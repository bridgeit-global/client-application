import { MetricCard } from '@/components/cards/metric-card';
import { fetchDashboardSupportData } from '@/services/dashboard';
import { SupportDashboardData } from '@/types/dashboard-type';

export default async function Page() {
  const { dashboardData } = await fetchDashboardSupportData();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
      {dashboardData &&
        dashboardData.map((item: SupportDashboardData, index: number) => (
          <MetricCard key={index} {...item} page="support" />
        ))}
    </div>
  );
}
