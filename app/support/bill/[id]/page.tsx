import { BillForm } from '@/components/forms/support-form/bill-form';
import { HTMLViewer, PDFViewer } from '@/components/modal/pdf-viewer-modal';
import { fetchSingleBill } from '@/services/bills';
import { notFound } from 'next/navigation';

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await fetchSingleBill({ id });
  
  // Handle error cases
  if (error) {
    console.error('Error fetching bill:', error);
    if (error.code === 'PGRST116') {
      // No rows returned - bill not found
      notFound();
    }
    // For other errors, you might want to show an error page
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }
  
  // Handle case where data is null
  if (!data) {
    notFound();
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="overflow-y-auto max-h-screen">
        <BillForm initialValue={data} />
      </div>
      {data?.content && typeof data.content === 'string' && data.content.trim() !== '' && (
        data?.content_type == 'pdf' ? (
          <PDFViewer
            pdfUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${data.content}`}
          />
        ) : (
          <HTMLViewer
            htmlUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${data.content}`}
          />
        )
      )}
    </div>
  );
}
