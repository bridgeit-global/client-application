import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/utils/supabase-error";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  const supabase = await createClient();
  // Prepare the search query by adding :* to enable prefix matching
  // and replacing spaces with & for AND operations
  let searchQuery = query
    .trim()
    .split(/\s+/)
    .map(term => `${term}:*`)
    .join(' & ');

  // Use textSearch instead of filter for better full-text search capabilities
  let { data, error } = await supabase
    .from("documents")
    .select("*")
    .textSearch('content', searchQuery, {
      config: 'english',
      type: 'websearch'
    });

  // Fallback to ilike search if textSearch fails
  if (error || !data || data.length === 0) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("documents")
      .select("*")
      .or(`content.ilike.%${query}%,title.ilike.%${query}%,table_name.ilike.%${query}%`)
      .limit(5);

    if (fallbackError) {
      const errorInfo = handleDatabaseError(fallbackError);
      return NextResponse.json({ error: errorInfo.message }, { status: 500 });
    }

    data = fallbackData;
    error = null;
  }

  let result = data;
  if (result && result.length >= 5) {
    result = result.slice(0, 5);
  }

  if (error) {
    const errorInfo = handleDatabaseError(error);
    return NextResponse.json({ error: errorInfo.message }, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
