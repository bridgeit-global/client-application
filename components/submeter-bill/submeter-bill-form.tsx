"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SubmeterBillInvoice } from "./submeter-bill-invoice";
import type { SubmeterBillInvoiceProps } from "./submeter-bill-invoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type ConnectionOption = {
  id: string;
  account_number: string | number;
  site_id: string;
  submeter_info?: {
    operator_name?: string | null;
  } | null;
};

const formSchema = z
  .object({
    site_id: z.string().min(1, { message: "Site ID is required" }),
    connection_id: z.string().min(1, { message: "Connection is required" }),
    billing_start: z.date({ required_error: "Billing start date is required" }),
    billing_end: z.date({ required_error: "Billing end date is required" }),
  })
  .refine(
    (data) =>
      !data.billing_start ||
      !data.billing_end ||
      data.billing_start <= data.billing_end,
    {
      message: "Billing start date must be before or equal to end date",
      path: ["billing_end"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

type RequestPayload = {
  connection_id: string;
  billing_start: string;
  billing_end: string;
};

async function generatePdfBlob(
  element: HTMLElement
): Promise<{ blob: Blob; pdf: jsPDF }> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: 794,
    windowWidth: 794,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  const blob = pdf.output("blob");
  return { blob, pdf };
}

export default function SubmeterBillForm() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<ConnectionOption[]>([]);
  const [isFetchingConnections, setIsFetchingConnections] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [invoiceData, setInvoiceData] =
    useState<SubmeterBillInvoiceProps | null>(null);
  const [billNumber, setBillNumber] = useState<string | null>(null);
  const [savedPayload, setSavedPayload] = useState<RequestPayload | null>(null);
  const [billSaved, setBillSaved] = useState(false);
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      site_id: "",
      connection_id: "",
    },
  });

  const handleFetchConnections = async () => {
    const siteId = form.getValues("site_id");
    if (!siteId) {
      toast({
        variant: "destructive",
        title: "Site ID required",
        description: "Please enter a site ID before fetching connections.",
      });
      return;
    }

    setIsFetchingConnections(true);
    setConnections([]);
    setInvoiceData(null);
    setBillNumber(null);
    setSavedPayload(null);
    setBillSaved(false);
    form.setValue("connection_id", "");

    try {
      const res = await fetch(
        `/api/submeter-bill?site_id=${encodeURIComponent(siteId)}`
      );
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(
          payload?.error || "Failed to fetch submeter connections"
        );
      }

      const options: ConnectionOption[] = payload.data || [];
      setConnections(options);

      if (options.length === 0) {
        toast({
          title: "No submeter connections",
          description:
            "No active submeter connections were found for this site.",
        });
      } else {
        toast({
          variant: "success",
          title: "Connections loaded",
          description: "Select a connection to generate the bill.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching connections",
        description:
          error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsFetchingConnections(false);
    }
  };

  const handlePreview = async (values: FormValues) => {
    setIsPreviewing(true);
    setInvoiceData(null);
    setBillNumber(null);
    setSavedPayload(null);
    setBillSaved(false);

    try {
      const payload: RequestPayload = {
        connection_id: values.connection_id,
        billing_start: format(values.billing_start, "yyyy-MM-dd"),
        billing_end: format(values.billing_end, "yyyy-MM-dd"),
      };

      const res = await fetch("/api/submeter-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, preview: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate preview");
      }

      if (!data?.invoice) {
        throw new Error("Invoice data missing from response");
      }

      setInvoiceData(data.invoice as SubmeterBillInvoiceProps);
      setBillNumber(data.billNumber || null);
      setSavedPayload(payload);

      toast({
        variant: "success",
        title: "Preview ready",
        description:
          "Review the bill below. Click 'Save & Download PDF' to confirm.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error generating preview",
        description:
          error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!savedPayload || !invoiceRef.current || !invoiceData) return;

    setIsSaving(true);

    try {
      const { blob, pdf } = await generatePdfBlob(invoiceRef.current);

      // Upload PDF to Supabase storage
      const supabase = createClient();
      const storagePath = `bills/${savedPayload.connection_id}/${billNumber || "bill"}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("bill-documents")
        .upload(storagePath, blob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Save bill to DB with the storage path
      const res = await fetch("/api/submeter-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...savedPayload,
          preview: false,
          content_path: storagePath,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save bill");
      }

      // Download the PDF locally
      const savedBillNumber = data.bill?.bill_number || billNumber;
      pdf.save(`${savedBillNumber || "submeter-bill"}.pdf`);

      setBillSaved(true);

      toast({
        variant: "success",
        title: "Bill saved",
        description:
          "Bill has been saved to the database and downloaded as PDF.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving bill",
        description:
          error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setInvoiceData(null);
    setBillNumber(null);
    setSavedPayload(null);
    setBillSaved(false);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Submeter Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handlePreview)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="site_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter site ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={handleFetchConnections}
                    disabled={isFetchingConnections || !form.watch("site_id")}
                  >
                    {isFetchingConnections
                      ? "Fetching..."
                      : "Fetch Connections"}
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="connection_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connection / Meter</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={connections.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                connections.length === 0
                                  ? "Fetch connections first"
                                  : "Select a connection"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {connections.map((conn) => (
                              <SelectItem key={conn.id} value={conn.id}>
                                {String(conn.account_number)}{" "}
                                {conn.submeter_info?.operator_name
                                  ? `- ${conn.submeter_info.operator_name}`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billing_start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Billing Start Date</FormLabel>
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
                                <span>Select date</span>
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
                  name="billing_end"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Billing End Date</FormLabel>
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
                                <span>Select date</span>
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
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isPreviewing || isSaving}
                >
                  {isPreviewing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPreviewing ? "Generating Preview..." : "Preview Bill"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {invoiceData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Bill Preview
              {billSaved && (
                <span className="ml-2 text-xs font-normal text-green-600">
                  (Saved)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <div ref={invoiceRef}>
                <SubmeterBillInvoice {...invoiceData} />
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              {!billSaved && (
                <Button
                  type="button"
                  className="w-full md:w-auto"
                  onClick={handleSaveAndDownload}
                  disabled={isSaving}
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSaving ? "Saving..." : "Save & Download PDF"}
                </Button>
              )}

              {billSaved && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full md:w-auto"
                  onClick={handleReset}
                >
                  Generate Another Bill
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
