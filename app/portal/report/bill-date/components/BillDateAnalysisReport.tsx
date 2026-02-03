import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BillDateVsFetchDate from './BillDateVsFetchDate';
import BillDateVsDueDate from './BillDateVsDueDate';

export function BillDateAnalysisReport({ site_type }: { site_type: string }) {
  return (
    <Tabs defaultValue="generation" className="w-full">
      <TabsList>
        <TabsTrigger value="generation">Bill Date vs Fetch Date</TabsTrigger>
        <TabsTrigger value="due-date">Bill Date vs Due Date</TabsTrigger>
      </TabsList>
      <TabsContent value="generation">
        <BillDateVsFetchDate site_type={site_type} />
      </TabsContent>
      <TabsContent value="due-date">
        <BillDateVsDueDate site_type={site_type} />
      </TabsContent>
    </Tabs>
  );
} 