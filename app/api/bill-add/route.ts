import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleDatabaseError, logAndHandleDatabaseError } from "@/lib/utils/supabase-error";

export async function POST(req: NextRequest) {
  const { event } = await req.json();

  if (!event || typeof event !== "object") {
    return NextResponse.json({ error: "Event parameter is required" }, { status: 400 });
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("bills")
    .insert([event])
    .select();

  if (!error) {
    let charges = { id: event.id };
    const coreResponse = await supabase
      .from('core_charges')
      .insert([charges])
      .select();
    const aditionalResponse = await supabase
      .from('additional_charges')
      .insert([charges])
      .select();
    const adherenceResponse = await supabase
      .from('adherence_charges')
      .insert([charges])
      .select();
    const regulatoryResponse = await supabase
      .from('regulatory_charges')
      .insert([charges])
      .select();
  }

  if (error) {
    const handledError = logAndHandleDatabaseError(error, 'add');
    return NextResponse.json({ error: handledError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
