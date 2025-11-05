import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  DashboardData,
  SupportDashboardData,
  WeekGroup
} from '@/types/dashboard-type';
import { handleDatabaseError, logAndHandleDatabaseError } from '@/lib/utils/supabase-error';
type Result = {
  dashboardData: DashboardData[];
  billerBoardWiseData: any[];
  isLoading: false;
};


export const getActiveSites = async (): Promise<{ count: number, error: any }> => {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true }).match({ 'is_active': true })
  return { count: count || 0, error }
}

export const getActiveConnectionsByPaytype = async ({ paytype }: { paytype: number }): Promise<{ count: number, error: any }> => {
  const supabase = createClient();
  try {
    const { count, error } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('paytype', paytype)
      .eq('is_active', true);

    if (error) {
      const handledError = handleDatabaseError(error);
      return { count: 0, error: handledError.message };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    const handledError = logAndHandleDatabaseError(error as any, 'getActiveConnectionsByPaytype');
    return { count: 0, error: handledError.message };
  }
};

export const getActiveConnections = cache(async () => {
  const supabase = createClient();

  try {
    const [prepaid, postpaid, submeter] = await Promise.all([
      supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('paytype', 1)
        .eq('is_active', true),
      supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('paytype', 2)
        .eq('is_active', true),
      supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('paytype', 3)
        .eq('is_active', true)
    ]);

    if (prepaid.error) {
      const handledError = handleDatabaseError(prepaid.error);
      throw new Error(handledError.message);
    }
    if (postpaid.error) {
      const handledError = handleDatabaseError(postpaid.error);
      throw new Error(handledError.message);
    }
    if (submeter.error) {
      const handledError = handleDatabaseError(submeter.error);
      throw new Error(handledError.message);
    }

    return {
      prepaid: prepaid.count,
      postpaid: postpaid.count,
      submeter: submeter.count
    };
  } catch (error) {
    const handledError = logAndHandleDatabaseError(error as any, 'getActiveConnections');
    console.error('Error fetching active connections:', handledError.message);
    return {
      prepaid: 0,
      postpaid: 0,
      submeter: 0
    };
  }
});


export const fetchDashboardData = cache(async (): Promise<Result> => {
  const supabase = createClient();

  try {
    const [
      dashboardResponse,
      billerBoardResponse,
    ] = await Promise.all([
      supabase
        .from('dashboard_summary')
        .select('*')
        .order('index', { ascending: true }),
      supabase
        .rpc('get_biller_stats')
    ]);

    if (dashboardResponse.error) {
      const handledError = handleDatabaseError(dashboardResponse.error);
      throw new Error(handledError.message);
    }
    if (billerBoardResponse.error) {
      const handledError = handleDatabaseError(billerBoardResponse.error);
      throw new Error(handledError.message);
    }
    const dashboardData = dashboardResponse.data;
    return {
      dashboardData,
      billerBoardWiseData: billerBoardResponse.data,
      isLoading: false
    };
  } catch (error) {
    const handledError = logAndHandleDatabaseError(error as any, 'fetchDashboardData');
    console.error('Error fetching data:', handledError.message);
    return {
      dashboardData: [],
      billerBoardWiseData: [],
      isLoading: false
    };
  }
});

type DashboardResult = {
  dashboardData: SupportDashboardData[];
};

export const fetchDashboardSupportData = cache(
  async (): Promise<DashboardResult> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('dashboard_support_data')
      .select('*');
    if (error) {
      return {
        dashboardData: []
      };
    }
    return {
      dashboardData: data
    };
  }
);


type ConnectionCostsResult = {
  geojsonData: any;
  geojsonSwapData: any;
};

const getCostGeoJson = async ({ sites, cost_type }: { sites: any, cost_type: string }) => {
  const geojsonData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection' as const,
    features:
      sites?.map((site: any) => ({
        type: 'Feature' as const,
        properties: {
          site_id: site.id,
          site: site.connections.site_id,
          paytype: site.connections.paytype,
          charges: site.charges,
          units: cost_type === 'unit_cost' ? site.billed_unit : site.swapped_unit,
          [cost_type]: site[cost_type]
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [site.connections.sites.longitude, site.connections.sites.latitude]
        }
      })) || []
  };
  return geojsonData;
};

export const fetchConnectionCosts = cache(async (): Promise<ConnectionCostsResult> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('connection_metrics')
    .select('*,connections!inner(site_id,paytype,sites!inner(*))')
    .gt('connections.sites.latitude', 0)
    .gt('connections.sites.longitude', 0);

  if (error) {
    return {
      geojsonData: [],
      geojsonSwapData: []
    };
  }
  const geojsonData = await getCostGeoJson({ sites: data, cost_type: "unit_cost" });
  const geojsonSwapData = await getCostGeoJson({ sites: data, cost_type: "swap_cost" });
  return {
    geojsonData,
    geojsonSwapData
  };
});
