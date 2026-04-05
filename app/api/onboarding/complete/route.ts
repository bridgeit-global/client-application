import {
  createAdminClient,
  createClient,
  createServicePortalClient
} from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/** Rows may be empty strings; server skips all-empty rows and rejects half-filled rows. */
const masterRowInputSchema = z.object({
  value: z.string().max(64),
  name: z.string().max(256)
});

const organizationSchema = z.object({
  name: z.string().min(2).max(256),
  /** Defaults to `site` server-side if omitted or empty. */
  site_name: z.string().max(256).optional(),
  company_name: z.string().max(256).optional().nullable(),
  company_address: z.string().max(1024).optional().nullable(),
  company_email: z.union([z.string().email().max(256), z.literal('')]).optional(),
  pan: z.string().max(20).optional().nullable(),
  gst: z.string().max(32).optional().nullable(),
  cin: z.string().max(32).optional().nullable(),
  batch_threshold_amount: z.coerce.number().nonnegative().optional(),
  logo_url: z.union([z.string().url().max(2048), z.literal('')]).optional().nullable()
});

const bodySchema = z.object({
  organization: organizationSchema,
  siteTypes: z.array(masterRowInputSchema).max(50),
  zoneIds: z.array(masterRowInputSchema).max(50)
});

function normalizeMasterRows(
  rows: z.infer<typeof masterRowInputSchema>[],
  type: 'site_type' | 'zone_id'
):
  | { ok: false; error: string }
  | { ok: true; rows: { type: string; value: string; name: string }[] } {
  const seen = new Set<string>();
  const out: { type: string; value: string; name: string }[] = [];
  for (const row of rows) {
    const value = row.value.trim();
    const name = row.name.trim();
    if (!value && !name) continue;
    if (!value || !name) {
      return {
        ok: false,
        error:
          'Each site type and zone row must include both code and display name, or leave the row empty.'
      };
    }
    const key = `${type}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      type,
      value,
      name
    });
  }
  return { ok: true, rows: out };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user?.id || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role =
      user.user_metadata?.role ??
      (user.app_metadata as { role?: string } | undefined)?.role ??
      user.role;

    if (role === 'operator' || role === 'service_role') {
      return NextResponse.json(
        { error: 'Onboarding is not available for this account type.' },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { organization: orgInput, siteTypes, zoneIds } = parsed.data;

    const siteTypeResult = normalizeMasterRows(siteTypes, 'site_type');
    if (!siteTypeResult.ok) {
      return NextResponse.json({ error: siteTypeResult.error }, { status: 400 });
    }
    const zoneResult = normalizeMasterRows(zoneIds, 'zone_id');
    if (!zoneResult.ok) {
      return NextResponse.json({ error: zoneResult.error }, { status: 400 });
    }

    const siteTypeRows = siteTypeResult.rows;
    const zoneRows = zoneResult.rows;

    const adminClient = createAdminClient();
    const portal = createServicePortalClient();

    const metaOrgId = user.user_metadata?.org_id as string | undefined;
    if (metaOrgId) {
      const { data: existingRow } = await portal
        .from('organizations')
        .select('id')
        .eq('id', metaOrgId)
        .maybeSingle();
      if (existingRow) {
        return NextResponse.json({
          orgId: metaOrgId,
          alreadyOnboarded: true
        });
      }
    }

    const orgId = metaOrgId ?? crypto.randomUUID();

    const companyEmail =
      orgInput.company_email && orgInput.company_email.length > 0
        ? orgInput.company_email
        : null;

    const logoUrl =
      orgInput.logo_url && orgInput.logo_url.length > 0
        ? orgInput.logo_url
        : null;

    const siteName =
      orgInput.site_name && orgInput.site_name.trim().length > 0
        ? orgInput.site_name.trim()
        : 'site';

    const { error: orgError } = await portal.from('organizations').insert({
      id: orgId,
      name: orgInput.name.trim(),
      site_name: siteName,
      company_name: orgInput.company_name?.trim() || null,
      company_address: orgInput.company_address?.trim() || null,
      company_email: companyEmail,
      pan: orgInput.pan?.trim() || null,
      gst: orgInput.gst?.trim() || null,
      cin: orgInput.cin?.trim() || null,
      logo_url: logoUrl,
      batch_threshold_amount: orgInput.batch_threshold_amount ?? 0
    });

    if (orgError) {
      console.error('onboarding organizations insert:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization', details: orgError.message },
        { status: 500 }
      );
    }

    const masterInserts = [...siteTypeRows, ...zoneRows].map((row) => ({
      org_id: orgId,
      type: row.type,
      value: row.value,
      name: row.name
    }));

    if (masterInserts.length > 0) {
      const { error: masterError } = await portal.from('org_master').insert(masterInserts);

      if (masterError) {
        console.error('onboarding org_master insert:', masterError);
        await portal.from('organizations').delete().eq('id', orgId);
        return NextResponse.json(
          { error: 'Failed to save organization configuration', details: masterError.message },
          { status: 500 }
        );
      }
    }

    const { data: fullUser, error: getUserError } =
      await adminClient.auth.admin.getUserById(user.id);

    if (getUserError || !fullUser?.user) {
      console.error('onboarding getUserById:', getUserError);
      await portal.from('organizations').delete().eq('id', orgId);
      return NextResponse.json(
        { error: 'Failed to finalize account' },
        { status: 500 }
      );
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...fullUser.user.user_metadata,
        org_id: orgId,
        role: 'admin'
      }
    });

    if (updateError) {
      console.error('onboarding updateUserById:', updateError);
      await portal.from('organizations').delete().eq('id', orgId);
      return NextResponse.json(
        { error: 'Failed to link organization to your account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orgId, alreadyOnboarded: false });
  } catch (e) {
    console.error('POST /api/onboarding/complete:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
