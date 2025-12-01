import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleDatabaseError, logAndHandleDatabaseError } from "@/lib/utils/supabase-error";
import { updateSubmeterReading, deleteSubmeterReading, getSubmeterReading } from "@/services/submeter-readings";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ connection_id: string; reading_date: string }> }
) {
    try {
        const { connection_id, reading_date } = await params;
        const result = await getSubmeterReading(connection_id, reading_date);

        if (result.error) {
            const handledError = logAndHandleDatabaseError(result.error, 'fetch');
            return NextResponse.json({ error: handledError.message }, { status: 500 });
        }

        if (!result.data) {
            return NextResponse.json({ error: "Reading not found" }, { status: 404 });
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error('Error fetching submeter reading:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ connection_id: string; reading_date: string }> }
) {
    try {
        const { connection_id, reading_date } = await params;
        const body = await req.json();

        if (body.start_reading === undefined || body.end_reading === undefined) {
            return NextResponse.json({
                error: "start_reading and end_reading are required"
            }, { status: 400 });
        }

        // Use snapshot_urls field directly
        const updateData = {
            ...body
        };

        const result = await updateSubmeterReading(connection_id, reading_date, updateData);

        if (result.error) {
            const handledError = logAndHandleDatabaseError(result.error, 'update');
            return NextResponse.json({ error: handledError.message }, { status: 500 });
        }

        if (!result.data) {
            return NextResponse.json({ error: "Reading not found" }, { status: 404 });
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error) {
        console.error('Error updating submeter reading:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ connection_id: string; reading_date: string }> }
) {
    try {
        const { connection_id, reading_date } = await params;
        const result = await deleteSubmeterReading(connection_id, reading_date);

        if (result.error) {
            const handledError = logAndHandleDatabaseError(result.error, 'delete');
            return NextResponse.json({ error: handledError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Reading deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error('Error deleting submeter reading:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
