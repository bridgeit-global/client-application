'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';

import DocumentViewerModalWithPresigned from '@/components/modal/document-viewer-modal-with-presigned';
import { cn } from '@/lib/utils';
import {
  getStorageSourceFromPaytype,
  type StorageSource
} from '@/lib/utils/presigned-url-client';

type Row = Record<string, unknown>;

function toStringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function tryParseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function BillDocumentLinks({ rows }: { rows: Row[] }) {
  const billRows = React.useMemo(() => {
    const candidates = rows.filter((r) => {
      const content = (r as any).content;
      const contentType = (r as any).content_type;
      return Boolean(content) && Boolean(contentType);
    });

    // Keep this compact inside the chat.
    return candidates.slice(0, 6);
  }, [rows]);

  if (billRows.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Bill copies</div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Bill</th>
              <th className="px-3 py-2 text-left font-semibold">Site</th>
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {billRows.map((r, idx) => {
              const content = (r as any).content as string | undefined;
              const contentTypeRaw = (r as any).content_type as unknown;
              const contentType = toStringOrEmpty(contentTypeRaw).toLowerCase();
              const billId = toStringOrEmpty((r as any).bill_id ?? (r as any).billId ?? (r as any).id);
              const siteName = toStringOrEmpty((r as any).site_name ?? (r as any).site ?? (r as any).name);
              const date =
                toStringOrEmpty((r as any).bill_date ?? (r as any).due_date ?? (r as any).billDate);

              let storageSource: StorageSource = 's3';
              const paytypeRaw = (r as any).paytype;
              const paytype = tryParseNumber(paytypeRaw);
              if (paytype !== null) {
                storageSource = getStorageSourceFromPaytype(paytype);
              }

              return (
                <tr key={`${billId}-${idx}`} className={cn('border-b last:border-0 even:bg-muted/30')}>
                  <td className="px-3 py-2 text-muted-foreground">{billId || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{siteName || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{date || '—'}</td>
                  <td className="px-3 py-2">
                    {content ? (
                      <DocumentViewerModalWithPresigned
                        fileKey={content}
                        contentType={contentType || 'pdf'}
                        storageSource={storageSource}
                        icon={<FileText className="h-4 w-4" />}
                        label="View"
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

