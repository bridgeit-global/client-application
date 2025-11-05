"use client"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SubmeterInfoProps } from "@/types/submeter-info-type"

const submeterInfoSchema = z.object({
    bank_name: z.string().optional(),
    bank_branch_name: z.string().optional(),
    bank_account_number: z.string().optional(),
    bank_account_holder_name: z.string().optional(),
    ifsc_code: z.string().optional(),
    tl_mobile_number: z.string().optional().refine((val) => {
        if (!val) return true;
        return /^\d{10}$/.test(val);
    }, "Mobile number must be 10 digits"),
    operator_mobile_number: z.string().optional().refine((val) => {
        if (!val) return true;
        return /^\d{10}$/.test(val);
    }, "Mobile number must be 10 digits"),
    operator_name: z.string().optional(),
    operational_hours: z.string().optional(),
})

type SubmeterInfoFormValues = z.infer<typeof submeterInfoSchema>

interface SubmeterInfoFormProps {
    connectionId: string;
    onSubmit: (data: SubmeterInfoProps) => void;
    isLoading?: boolean;
}

export default function SubmeterInfoForm({ connectionId, onSubmit, isLoading = false }: SubmeterInfoFormProps) {
    const form = useForm<SubmeterInfoFormValues>({
        resolver: zodResolver(submeterInfoSchema),
        defaultValues: {
            bank_name: "",
            bank_branch_name: "",
            bank_account_number: "",
            bank_account_holder_name: "",
            ifsc_code: "",
            tl_mobile_number: "",
            operator_mobile_number: "",
            operator_name: "",
            operational_hours: "",
        },
    })

    const handleSubmit = (data: SubmeterInfoFormValues) => {
        const submeterInfo: SubmeterInfoProps = {
            connection_id: connectionId,
            bank_name: data.bank_name || null,
            bank_branch_name: data.bank_branch_name || null,
            bank_account_number: data.bank_account_number || null,
            bank_account_holder_name: data.bank_account_holder_name || null,
            ifsc_code: data.ifsc_code || null,
            tl_mobile_number: data.tl_mobile_number ? parseInt(data.tl_mobile_number) : null,
            operator_mobile_number: data.operator_mobile_number ? parseInt(data.operator_mobile_number) : null,
            operator_name: data.operator_name || null,
            operational_hours: data.operational_hours || null,
        }
        onSubmit(submeterInfo)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submeter Information</CardTitle>
            </CardHeader>
            <CardContent>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bank_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter bank name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bank_branch_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Branch Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter bank branch name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bank_account_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Account Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter bank account number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bank_account_holder_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Account Holder Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter account holder name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ifsc_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IFSC Code</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter IFSC code" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tl_mobile_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TL Mobile Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter TL mobile number" type="tel" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="operator_mobile_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operator Mobile Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter operator mobile number" type="tel" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="operator_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Operator Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter operator name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="operational_hours"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Operational Hours</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Enter operational hours (e.g., 9:00 AM - 6:00 PM)" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-10 px-4 py-2 rounded-md"
                        >
                            {isLoading ? "Saving..." : "Save Submeter Information"}
                        </button>
                    </form>
                </FormProvider>
            </CardContent>
        </Card>
    )
} 