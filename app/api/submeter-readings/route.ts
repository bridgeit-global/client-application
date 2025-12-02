import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAndHandleDatabaseError } from "@/lib/utils/supabase-error";
import { fetchSubmeterReadings, createSubmeterReading } from "@/services/submeter-readings";
import { SearchParamsProps } from "@/types";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const params: SearchParamsProps = {};

    for (const [key, value] of Array.from(searchParams.entries())) {
        params[key] = value;
    }

    try {
        const result = await fetchSubmeterReadings(params);

        if (result.error) {
            const handledError = logAndHandleDatabaseError(result.error, 'fetch');
            return NextResponse.json({ error: handledError.message }, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('Error fetching submeter readings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.connection_id || !body.reading_date || body.start_reading === undefined || body.end_reading === undefined) {
            return NextResponse.json({
                error: "connection_id, reading_date, start_reading, and end_reading are required"
            }, { status: 400 });
        }

        const supabase = await createClient();

        // Check if reading already exists
        const { data: existing } = await supabase
            .from('submeter_readings')
            .select('connection_id, reading_date')
            .eq('connection_id', body.connection_id)
            .eq('reading_date', body.reading_date)
            .single();

        if (existing) {
            return NextResponse.json({
                error: "A reading for this connection and date already exists"
            }, { status: 409 });
        }

        // Prepare the data to insert
        const readingData = {
            connection_id: body.connection_id,
            reading_date: body.reading_date,
            start_reading: body.start_reading,
            end_reading: body.end_reading,
            snapshot_urls: body.snapshot_urls || null,
            per_day_unit: body.per_day_unit || null,
        };

        const result = await createSubmeterReading(readingData);

        if (result.error) {
            const handledError = logAndHandleDatabaseError(result.error, 'create');
            return NextResponse.json({ error: handledError.message }, { status: 500 });
        }

        return NextResponse.json(result.data, { status: 201 });
    } catch (error) {
        console.error('Error creating submeter reading:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 