import { createClient } from '@/lib/supabase/server';
import { convertKeysToTitleCase } from '@/lib/utils/string-format';
import { SearchParamsProps } from '@/types';
import { RegistrationsProps } from '@/types/registrations-type';
import { SiteConnectionProps } from '@/types/site-type';
import { SupabaseError } from '@/types/supabase-type';
import { cache } from 'react';

type Result = {
  data: RegistrationsProps[];
  export_data?: SearchParamsProps[];
  totalCount: number;
  pageCount: number;
  error?: SupabaseError;
};

type SingleResult = {
  data?: SiteConnectionProps;
  totalCount: number;
  pageCount: number;
  error?: SupabaseError;
};

export const fetchRegistrations = cache(
  async (
    searchParams: SearchParamsProps,
    options?: { is_export?: boolean }
  ): Promise<Result> => {
    const supabase = await createClient();
    const {
      page = 1,
      limit = 10,
      created_at_start,
      created_at_end,
      parent_id
    } = searchParams;

    const pageLimit = Number(limit);
    const offset = (Number(page) - 1) * pageLimit;

    let query = supabase
      .from('registrations')
      .select(`*, users!inner(*)`, { count: 'estimated' })
      .eq('is_bulk', false)
    query = query.order('created_at', { ascending: false });

    // Date filter
    if (created_at_start && created_at_end) {
      query = query
        .gte('created_at', created_at_start)
        .lte('created_at', created_at_end);
    }

    if (parent_id) {
      query = query.eq('parent_id', parent_id);
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
      const modifiedData = data.map((site) => {
        return {
          ...site,
          data: JSON.stringify(site.data)
        };
      });

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
      data: data,
      totalCount,
      pageCount
    };
  }
);

export const fetchSingleConnection = async (
  searchParams: SearchParamsProps
): Promise<SingleResult> => {
  // Initialize the Supabase client
  const supabase = await createClient(); // Assuming Supabase client is properly set up
  const { data, error } = await supabase
    .from('sites')
    .select('*,connections(*)')
    .match({
      id: searchParams?.id
    })
    .single();

  if (error) {
    console.error('error', error);
    return {
      totalCount: 0,
      pageCount: 0,
      error
    };
  }
  return {
    data: data,
    totalCount: 0,
    pageCount: 0
  };
};
