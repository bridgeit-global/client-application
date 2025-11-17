import { BillDetails } from '@/components/bill/BillDetails';
import { HTMLViewer, PDFViewer } from '@/components/modal/pdf-viewer-modal';
import { fetchSingleBill } from '@/services/bills';
import { notFound } from 'next/navigation';

export default async function Page({
    params
}: {
    params: { id: string };
}) {
    const { data, error } = await fetchSingleBill(params);
    
    // Handle error cases
    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned - bill not found
            notFound();
        }
        throw new Error(`Failed to fetch bill: ${error.message}`);
    }
    
    // Handle case where data is null
    if (!data) {
        notFound();
    }
    
    return (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 p-4">
            <div className="bg-white rounded-lg shadow-sm border">
                <BillDetails bill={data} />
            </div>
            {data?.content && typeof data.content === 'string' && data.content.trim() !== '' && (
                <div className="bg-white rounded-lg shadow-sm border">
                    {data?.content_type == 'pdf' ? (
                        <PDFViewer
                            pdfUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${data.content}`}
                        />
                    ) : (
                        <HTMLViewer
                            htmlUrl={`${process.env.NEXT_PUBLIC_BUCKET_URL}/${data.content}`}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
