'use client';
import * as z from 'zod';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useToast } from '../../ui/use-toast';
import FileUpload from '../../file-upload';
import { useUserStore } from '@/lib/store/user-store';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useSiteName } from '@/lib/utils/site';
const FileSchema = z.object({
  url: z.string()
});

const formSchema = z.object({
  fileUrl: z
    .array(FileSchema)
    .max(1, { message: `You can only add up to one Excel` })
    .min(1, { message: 'At least one file must be added.' })
});

type SiteBulkFormValues = z.infer<typeof formSchema>;

interface SiteBulkFormProps {
  initialData: any | null;
}

export const SiteBulkForm: React.FC<SiteBulkFormProps> = ({ initialData }) => {
  const site_name = useSiteName();
  const router = useRouter();
  const { user } = useUserStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const action = initialData ? 'Save' : 'Create';

  const defaultValues = initialData
    ? initialData
    : {
      fileUrl: []
    };

  const form = useForm<SiteBulkFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: SiteBulkFormValues) => {
    try {
      setLoading(true);
      setUploadSuccess(false);
      setTrackId(null);

      if (!user || !user.id) {
        return;
      }

      const body = { record: { created_by: user.id, data, is_bulk: true } };
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_UPLOAD_PDF_URL}/verify/trigger`,
        body
      );

      if (response?.data?.errorMessage) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: response?.data?.errorMessage
        });
      }

      if (response?.data?.successMessage) {
        // Store the track ID from the response
        const responseTrackId = response.data?.registrationId || null;
        setTrackId(responseTrackId);
        form.reset();
        setUploadSuccess(true);
        toast({
          title: 'Request received',
          description: responseTrackId
            ? `Track ID: ${responseTrackId}. You can track it from registration status section.`
            : 'You should be able to track it from registration status section'
        });
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_BUCKET_URL}/template/Bulk-Template-Excel.xlsx`
    );
  };

  const navigateToTrackingPage = () => {
    const filter = {
      parent_id: trackId
    };
    router.push(`/support/registration?filter=${JSON.stringify(filter)}#failed_registration`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Bulk Register {site_name}</h2>
      </div>
      <div className="flex justify-start">
        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Template
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6"
        >
          <FormField
            control={form.control}
            name="fileUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload Excel File</FormLabel>
                <FormControl>
                  <FileUpload
                    onChange={field.onChange}
                    value={field.value || []}
                    onRemove={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
              <div className="flex flex-col gap-2">
                <p>Upload successful!</p>
                {trackId && (
                  <p>Track ID: <span className="font-medium">{trackId}</span></p>
                )}
                <button
                  onClick={navigateToTrackingPage}
                  className="text-green-800 underline hover:text-green-900 font-medium text-left flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  Go to registration status
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <Button
              disabled={!form.getValues().fileUrl.length || loading}
              type="submit"
              className="min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : action}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
