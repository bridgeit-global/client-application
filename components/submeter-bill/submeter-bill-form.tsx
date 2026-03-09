"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

type ConnectionOption = {
  id: string;
  account_number: string | number;
  site_id: string;
  submeter_info?: {
    operator_name?: string | null;
  } | null;
};

const formSchema = z.object({
  site_id: z.string().min(1, { message: "Site ID is required" }),
  connection_id: z.string().min(1, { message: "Connection is required" }),
  billing_start: z.date({ required_error: "Billing start date is required" }),
  billing_end: z.date({ required_error: "Billing end date is required" }),
}).refine(
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

export default function SubmeterBillForm() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<ConnectionOption[]>([]);
  const [isFetchingConnections, setIsFetchingConnections] = useState(false);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [invoiceData, setInvoiceData] = useState<SubmeterBillInvoiceProps | null>(null);
  const [billNumber, setBillNumber] = useState<string | null>(null);
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
    form.setValue("connection_id", "");

    try {
      const res = await fetch(`/api/submeter-bill?site_id=${encodeURIComponent(siteId)}`);
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "Failed to fetch submeter connections");
      }

      const options: ConnectionOption[] = payload.data || [];
      setConnections(options);

      if (options.length === 0) {
        toast({
          title: "No submeter connections",
          description: "No active submeter connections were found for this site.",
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
        description: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsFetchingConnections(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsGeneratingBill(true);
    setInvoiceData(null);
    setBillNumber(null);

    try {
      const payload = {
        connection_id: values.connection_id,
        billing_start: format(values.billing_start, "yyyy-MM-dd"),
        billing_end: format(values.billing_end, "yyyy-MM-dd"),
      };

      const res = await fetch("/api/submeter-bill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate bill");
      }

      if (!data?.invoice) {
        throw new Error("Invoice data missing from response");
      }

      setInvoiceData(data.invoice as SubmeterBillInvoiceProps);
      setBillNumber(data.bill?.bill_number || null);

      toast({
        variant: "success",
        title: "Bill generated",
        description: "Submeter bill has been created and saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error generating bill",
        description: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsGeneratingBill(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !invoiceData) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${billNumber || "submeter-bill"}.pdf`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error downloading PDF",
        description: error?.message || "Unable to generate PDF. Please try again.",
      });
    }
  };

  const selectedConnection = connections.find(
    (c) => c.id === form.watch("connection_id")
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Submeter Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
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
                        <Input
                          placeholder="Enter site ID"
                          {...field}
                        />
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
                    {isFetchingConnections ? "Fetching..." : "Fetch Connections"}
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
                  disabled={isGeneratingBill}
                >
                  {isGeneratingBill ? "Generating Bill..." : "Generate Bill"}
                </Button>

                {invoiceData && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={handleDownloadPdf}
                  >
                    Download PDF
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {invoiceData && (
        <div ref={invoiceRef}>
          <SubmeterBillInvoice {...invoiceData} />
        </div>
      )}
    </div>
  );
}

