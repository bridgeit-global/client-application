import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { SubmeterReadingProps, SubmeterReadingInsert, SubmeterReadingUpdate, SubmeterReadingWithConnection } from '@/types/submeter-readings-type';
import { SearchParamsProps } from '@/types';
import { processValues } from '@/lib/utils';
import { fetchOrganization } from './organization';
import { convertKeysToTitleCase } from '@/lib/utils/string-format';

export interface Result<T> {
  data: T[];
  totalCount: number;
  pageCount: number;
  error?: any;
  export_data?: any;
}

export const fetchSubmeterReadings = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean, side?: string }
  ): Promise<Result<SubmeterReadingWithConnection>> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      connection_id,
      reading_date_start,
      reading_date_end,
      sort,
      order = 'desc'
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;
    const { data: { user } } = await supabase.auth.getUser()
    // if (user?.user_metadata?.role !== 'operator') {
    //   return {
    //     data: [],
    //     totalCount: 0,
    //     pageCount: 0,
    //     error: 'Unauthorized'
    //   }
    // }


    let query = supabase
      .from('submeter_readings')
      .select(`
        *,
        connections!inner(
          account_number,
          site_id,
          biller_list!inner(
            board_name,
            state
          )
        )
      `, {
        count: 'estimated'
      });


    if (options?.side === 'portal') {
      if (!user?.user_metadata?.site_id) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: 'Unauthorized'
        }
      }
      query = query.eq('connections.site_id', user?.user_metadata?.site_id)
    }
    // Apply sorting
    if (sort) {
      query = query.order(sort, { ascending: order === 'asc' });
    } else {
      query = query.order('reading_date', { ascending: false });
    }

    // Apply filters
    if (connection_id) {
      const value = processValues(connection_id);
      query = query.in('connection_id', value);
    }

    if (reading_date_start && reading_date_end) {
      query = query
        .gte('reading_date', reading_date_start)
        .lte('reading_date', reading_date_end);
    }

    if (options?.is_export) {
      const { data, error } = await query;
      if (error) {
        return {
          data: [],
          totalCount: 0,
          pageCount: 0,
          error: error
        };
      }

      const { site_name } = await fetchOrganization();


      const modifiedData = data?.map((reading) => ({
        connection_id: reading.connection_id,
        account_number: reading.connections?.account_number,
        [`${site_name}_id`]: reading.connections?.site_id,
        biller_board: reading.connections?.biller_list?.board_name,
        state: reading.connections?.biller_list?.state,
        reading_date: reading.reading_date,
        start_reading: reading.start_reading,
        end_reading: reading.end_reading,
        per_day_unit: reading.per_day_unit,
        operator_info: reading.operator_info,
        created_at: reading.created_at,
        updated_at: reading.updated_at
      })) || [];

      return {
        data: [],
        export_data: convertKeysToTitleCase(modifiedData),
        totalCount: 0,
        pageCount: 0
      };
    }

    // Pagination
    query = query.range(offset, offset + pageLimit - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('error', error);
      return {
        data: [],
        totalCount: 0,
        pageCount: 0,
        error: error
      };
    }

    const totalCount = count || 0;
    const pageCount = Math.ceil(totalCount / pageLimit);

    return {
      data: data || [],
      totalCount,
      pageCount
    };
  }
);

export const createSubmeterReading = async (
  reading: SubmeterReadingInsert
): Promise<{ data: SubmeterReadingProps | null; error: any }> => {
  const supabase = await createClient();
  const user_id = await supabase.auth.getUser().then((res) => res.data.user?.id);

  const { data, error } = await supabase
    .from('submeter_readings')
    .insert([{ ...reading, created_by: user_id }])
    .select()
    .single();

  return { data, error };
};

export const updateSubmeterReading = async (
  connection_id: string,
  reading_date: string,
  updates: SubmeterReadingUpdate
): Promise<{ data: SubmeterReadingProps | null; error: any }> => {
  const supabase = await createClient();
  const user_id = await supabase.auth.getUser().then((res) => res.data.user?.id);
  const { data, error } = await supabase
    .from('submeter_readings')
    .update({ ...updates, updated_by: user_id })
    .eq('connection_id', connection_id)
    .eq('reading_date', reading_date)
    .select()
    .single();

  return { data, error };
};

export const deleteSubmeterReading = async (
  connection_id: string,
  reading_date: string
): Promise<{ error: any }> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('submeter_readings')
    .delete()
    .eq('connection_id', connection_id)
    .eq('reading_date', reading_date);

  return { error };
};

export const getSubmeterReading = async (
  connection_id: string,
  reading_date: string
): Promise<{ data: SubmeterReadingWithConnection | null; error: any }> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('submeter_readings')
    .select(`
      *,
      connections!inner(
        account_number,
        site_id,
        biller_list!inner(
          board_name,
          state
        )
      )
    `)
    .eq('connection_id', connection_id)
    .eq('reading_date', reading_date)
    .single();

  return { data, error };
};

export const fetchSubmeterReadingsByConnection = cache(
  async (connection_id: string): Promise<{ data: SubmeterReadingWithConnection[]; error: any }> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('submeter_readings')
      .select(`
        *,
        connections!inner(
          account_number,
          site_id,
          biller_list!inner(
            board_name,
            state
          )
        )
      `)
      .eq('connection_id', connection_id)
      .order('reading_date', { ascending: false });

    return { data: data || [], error };
  }
); 

export const upsertSubmeterReadingsBulk = async (
  reading_date: string,
  readings: Array<{
    connection_id: string
    start_reading: number
    end_reading: number
    snapshot_urls?: string[] | null
    per_day_unit?: number | null
  }>,
  allow_update: boolean
): Promise<{ data: { inserted: number; updated: number; reading_date: string } | null; error: any }> => {
  try {
    const response = await fetch("/api/submeter-readings/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading_date, readings, allow_update }),
    })
    const payload = await response.json()
    if (!response.ok) {
      return { data: null, error: payload?.error || "Bulk upsert failed" }
    }
    return { data: payload, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
