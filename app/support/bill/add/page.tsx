'use client';

import React, { useState } from 'react';
import { Heading } from '@/components/ui/heading';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { BillerListProps } from '@/types/biller-list-type';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function BillAddPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { billers } = useBillerBoardStore();

  // Form validation schema
  const formSchema = z.object({
    account_number: z.string().min(1, { message: "Account number is required" }),
    biller_name: z.string().min(1, { message: "Biller name is required" }),
    bill_date: z.date({ required_error: "Bill date is required" }),
    due_date: z.date({ required_error: "Due date is required" }),
    bill_amount: z.coerce.number({ required_error: "Bill amount is required" }),
    bill_number: z.string().min(1, { message: "Bill number is required" }),
    due_date_rebate: z.coerce.number().default(0),
    bill_type: z.string().min(1, { message: "Bill type is required" }),
    billed_unit: z.coerce.number({ required_error: "Billed unit is required" }),
    discount_date: z.date().optional().nullable(),
    disconnection_date: z.date().optional().nullable(),
    discount_date_rebate: z.coerce.number().default(0),
    start_date: z.date({ required_error: "Start date is required" }),
    end_date: z.date({ required_error: "End date is required" }),
    is_valid: z.boolean().default(false),
    penalty_amount: z.coerce.number().default(0),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_number: '',
      biller_name: '',
      bill_number: '',
      bill_type: '',
      due_date_rebate: 0,
      billed_unit: 0,
      bill_amount: 0,
      discount_date_rebate: 0,
      is_valid: false,
      penalty_amount: 0,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setFileType(file.type.includes('html') ? 'html' : 'pdf');

      toast({
        variant: 'success',
        title: 'Success',
        description: 'File selected successfully'
      });
    }
  };

  const uploadFile = async (billId: string) => {
    if (!selectedFile) {
      throw new Error('No file selected');
    }

    try {
      // Convert file to base64
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      // Extract content type and base64 content
      const [, contentType, base64Content] =
        base64File.match(/^data:(.+);base64,(.+)$/) || [];

      // Make API call to upload file
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_UPLOAD_PDF_URL}/bill/pdf_upload`,
        {
          id: billId,
          contentType: contentType,
          base64Content: base64Content,
        }
      );
      if (response.data.statusCode === 200) {
        return await response.data; // Return the file path/key
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if attachment is required for this biller
    const isAttachmentOptional = values.biller_name === 'BRGT00000IND7I';

    if (!selectedFile && !isAttachmentOptional) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Please upload a bill attachment'
      });
      return;
    }

    setIsLoading(true);

    try {
      const connection_id = values.biller_name + '_' + values.account_number;
      const fileUrl = 'bills/' + connection_id.split(' ')[0] + '/' + connection_id + '_' + values.bill_number;

      // Upload file only if file is selected
      let fileKey = null;
      if (selectedFile) {
        fileKey = await uploadFile(fileUrl);
      }

      // Format dates to YYYY-MM-DD format
      const formatDate = (date: Date | null | undefined) => {
        if (!date) return null;
        return format(date, 'yyyy-MM-dd');
      };

      const billData = {
        ...values,
        connection_id,
        id: connection_id + '_' + values.bill_number,
        content: selectedFile ? fileUrl : 'Auto Generated',
        content_type: selectedFile ? fileType : 'plain/text',
        bill_date: values.bill_date ? formatDate(values.bill_date) : null,
        due_date: values.due_date ? formatDate(values.due_date) : null,
        discount_date: values.discount_date ? formatDate(values.discount_date) : null,
        disconnection_date: values.disconnection_date ? formatDate(values.disconnection_date) : null,
        start_date: values.start_date ? formatDate(values.start_date) : null,
        end_date: values.end_date ? formatDate(values.end_date) : null
      };

      // Remove account_number and biller_name from billData
      const { account_number, biller_name, ...billDataWithoutAccountAndBiller } = billData;
      const cleanedBillData = billDataWithoutAccountAndBiller;

      const response = await axios.post('/api/bill-add', { event: cleanedBillData });

      if (response.status === 200 || response.status === 201) {
        toast({
          variant: 'success',
          title: 'Success',
          description: 'Bill created successfully'
        });
        form.reset();
        setFileUrl('');
        setFileName('');
        setFileType('');
        setSelectedFile(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to create bill. Please try again.'
      });
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setFileUrl('');
    setFileName('');
    setFileType('');
    setSelectedFile(null);
  };

  return (
    <>
      <Heading
        title="Add New Bill"
        description="Create a new bill with attachment"
      />

      <Card className="mt-6">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biller_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biller Name*</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a Biller" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-52">
                              {billers.sort((a, b) => a.board_name.localeCompare(b.board_name)).map(
                                (biller: BillerListProps, key: number) => (
                                  <SelectItem key={key} value={biller.id}>
                                    <span className="text-ellipsis">
                                      {biller.board_name}
                                    </span>
                                  </SelectItem>
                                )
                              )}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bill_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter bill number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bill_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bill Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Bill Date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Due Date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bill_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Amount*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billed_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billed Unit*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bill_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bill type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Abnormal">Abnormal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date_rebate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date Rebate</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Discount Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Discount Date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disconnection_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Disconnection Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Disconnection Date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_date_rebate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Date Rebate</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Start Date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>End Date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="penalty_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penalty Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_valid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Is Valid*</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Bill Attachment
                  {form.watch('biller_name') === 'BRGT00000IND7I' ? ' (Optional)' : '*'}
                </Label>
                <div className={`border rounded-md p-4 ${selectedFile ? 'bg-green-50' : ''}`}>
                  {selectedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{fileName}</div>
                        <div className="text-xs text-muted-foreground">({fileType})</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setFileName('');
                          setFileType('');
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Drag and drop or click to upload</p>
                      <p className="text-xs text-muted-foreground mb-4">PDF or HTML files only</p>
                      <Input
                        type="file"
                        accept=".pdf,.html"
                        onChange={handleFileChange}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Bill...
                    </>
                  ) : (
                    "Create Bill"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
