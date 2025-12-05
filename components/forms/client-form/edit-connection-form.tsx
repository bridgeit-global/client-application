"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { useBillerBoardStore } from "@/lib/store/biller-board-store"
import { useToast } from "@/components/ui/use-toast"
import { useSupabaseError } from "@/hooks/use-supabase-error"
import type { BillerListProps } from "@/types/biller-list-type"

// UI Components
import { Card, CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PAY_TYPE_LIST } from "@/constants/bill"
import { useSiteName } from "@/lib/utils/site"
import { BankSelector } from "@/components/input/bank-selector"
import { useUserStore } from "@/lib/store/user-store"
import { useRouter } from "next/navigation"
import { sanitizeInput } from "@/lib/utils/string-format"


type EditConnectionFormProps = {
    connectionId: string;
    initialData: {
        biller_id: string;
        site_id: string;
        paytype: string;
        parameters: Array<{
            key: string;
            value: string;
            validation?: string;
            message?: string;
        }>;
    };
    onSuccess?: () => void;
}

function EditConnectionForm({ connectionId, initialData, onSuccess }: EditConnectionFormProps) {
    const site_name = useSiteName();
    const supabase = createClient()
    const { user } = useUserStore();
    const { handleDatabaseError, error: dbError, clearError } = useSupabaseError();
    const router = useRouter()
    // Form schema with required fields
    const formSchema = z.object({
        biller_id: z.string().min(1, "Biller Board is required"),
        site_id: z.string().min(1, `${site_name} ID is required`),
        paytype: z.string().min(1, "Pay Type is required"),
        parameters: z.array(
            z.object({
                key: z.string(),
                value: z.string().min(1, "This field is required"),
                validation: z.string().optional(),
                message: z.string().optional(),
            }),
        ),
        // Submeter fields (optional)
        bank_name: z.string().optional(),
        bank_branch_name: z.string().optional(),
        bank_account_number: z.string().optional(),
        bank_account_holder_name: z.string().optional(),
        ifsc_code: z.string().optional().refine((val) => {
            if (!val) return true;
            return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val);
        }, "Invalid IFSC code format"),
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

    type FormValues = z.infer<typeof formSchema>

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            biller_id: initialData.biller_id,
            site_id: initialData.site_id,
            paytype: initialData.paytype,
            parameters: initialData.parameters,
            // Submeter fields - will be populated from submeterInfo
            bank_name: '',
            bank_branch_name: '',
            bank_account_number: '',
            bank_account_holder_name: '',
            ifsc_code: '',
            tl_mobile_number: '',
            operator_mobile_number: '',
            operator_name: '',
            operational_hours: '',
        },
    })

    const { billers } = useBillerBoardStore()
    const [siteId, setSiteId] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const { toast } = useToast()

    // Function to validate parameter value against regex
    const validateParameterValue = (value: string, validation: string, fieldName: string, index: number) => {
        if (!validation || !value) return true;

        try {
            const regex = new RegExp(validation);
            const isValid = regex.test(value);

            if (!isValid) {
                const param = fields[index];
                form.setError(`parameters.${index}.value`, {
                    type: "pattern",
                    message: param?.message || `Invalid format for ${param?.key}`
                });
            } else {
                form.clearErrors(`parameters.${index}.value`);
            }

            return isValid;
        } catch (error) {
            console.warn(`Invalid regex pattern: ${validation}`);
            return true;
        }
    }

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "parameters",
    })

    const getSubmeterInfo = async () => {
        const { data, error } = await supabase.from('connections').select('submeter_info').eq('id', connectionId).single()
        if (error) throw error
        return data.submeter_info
    }

    // Load submeter info and populate form
    useEffect(() => {
        const fetchSubmeterInfo = async () => {
            if (initialData?.paytype === "-1") {
                try {
                    const submeterInfo = await getSubmeterInfo()
                    if (submeterInfo) {
                        // Populate form with existing submeter data
                        form.setValue("bank_name", submeterInfo.bank_name || '')
                        form.setValue("bank_branch_name", submeterInfo.bank_branch_name || '')
                        form.setValue("bank_account_number", submeterInfo.bank_account_number || '')
                        form.setValue("bank_account_holder_name", submeterInfo.bank_account_holder_name || '')
                        form.setValue("ifsc_code", submeterInfo.ifsc_code || '')
                        form.setValue("tl_mobile_number", submeterInfo.tl_mobile_number?.toString() || '')
                        form.setValue("operator_mobile_number", submeterInfo.operator_mobile_number?.toString() || '')
                        form.setValue("operator_name", submeterInfo.operator_name || '')
                        form.setValue("operational_hours", submeterInfo.operational_hours || '')
                    }
                } catch (error) {
                    console.error("Error fetching submeter info:", error)
                }
            }
        }

        fetchSubmeterInfo()
        const paytypeValue = String(initialData?.paytype);
        form.setValue("paytype", paytypeValue);
    }, [initialData?.paytype, connectionId, form.watch("paytype")]);

    const getAllSiteId = async (search?: string) => {
        try {
            setIsLoading(true)
            let query = supabase.from("sites").select("id").eq("is_active", true)

            if (search) {
                query = query.ilike("id", `%${search}%`)
            } else {
                query = query.order("id", { ascending: true }).limit(10)
            }
            const { data, error } = await query

            if (error) throw error
            setSiteId(data?.map((site) => site.id) || [])
        } catch (err) {
            toast({
                variant: "destructive",
                title: `${site_name} ID load failed`,
                description: `${site_name} ID load failed`,
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle parameter updates when biller is selected
    const handleBillerChange = (billerId: string) => {
        const selectedBiller = billers.find((biller) => biller.id === billerId)

        // Create new parameters array with existing values or empty values
        const newParameters = (selectedBiller?.parameters || []).map((param: any) => {
            const existingParam = initialData.parameters.find(p => p.key === param.key)
            return {
                key: param.key,
                value: existingParam?.value || "",
                validation: param.validation,
                message: param.message,
            }
        })

        replace(newParameters)
        form.setValue("biller_id", billerId)
    }

    const getAccountNumber = (o: any) => {
        if (!o) return ""
        if (o.parameters?.length > 0) {
            return o.parameters[0]?.value || o.account_number || ""
        }
        return o.account_number || ""
    }

    const getTariff = (o: any) => {
        if (!o) return "";
        if (o.parameters?.length > 0) {
            // Try to find the parameter with key "Tariff"
            const tariffParam = o.parameters.find((param: any) => param.key === "Tariff");
            return tariffParam?.value || "";
        }
        return "";
    }

    // Handle pay type change
    const handlePayTypeChange = (value: string) => {
        form.setValue("paytype", value);
        if (value === "-1") { // Submeter
            const privateElectricityBiller = billers.find(biller => biller.board_name === "Private Electricity");
            if (privateElectricityBiller) {
                handleBillerChange(privateElectricityBiller.id);
            }
        }
    };

    const onSubmit = async (data: FormValues) => {
        // Check if all parameters have values
        const hasEmptyParameters = data.parameters.some((param) => !param.value)
        if (hasEmptyParameters) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "All parameters are required",
            })
            return
        }

        // Validate parameters against their regex patterns
        for (let i = 0; i < data.parameters.length; i++) {
            const param = data.parameters[i];
            if (param.validation && param.value) {
                try {
                    const regex = new RegExp(param.validation);
                    if (!regex.test(param.value)) {
                        // Set error for specific field
                        form.setError(`parameters.${i}.value`, {
                            type: "pattern",
                            message: param.message || `Invalid format for ${param.key}`
                        });

                        // Show toast error
                        toast({
                            variant: "destructive",
                            title: "Validation Error",
                            description: param.message || `Invalid format for ${param.key}`,
                        });
                        return;
                    }
                } catch (error) {
                    console.warn(`Invalid regex pattern for ${param.key}: ${param.validation}`);
                    // If regex is invalid, show warning but continue
                }
            }
        }

        try {
            clearError(); // Clear any previous errors
            setIsLoading(true);

            const submeterData = {
                bank_name: data.bank_name || null,
                bank_branch_name: data.bank_branch_name || null,
                bank_account_number: data.bank_account_number || null,
                bank_account_holder_name: data.bank_account_holder_name || null,
                ifsc_code: data.ifsc_code || null,
                tl_mobile_number: data.tl_mobile_number ? parseInt(data.tl_mobile_number) : null,
                operator_mobile_number: data.operator_mobile_number ? parseInt(data.operator_mobile_number) : null,
                operator_name: data.operator_name || null,
                operational_hours: data.operational_hours || null,
            };

            const connectionData: any = {
                biller_id: data.biller_id,
                site_id: data.site_id,
                paytype: data.paytype,
                account_number: getAccountNumber(data),
                tariff: getTariff(data) || null,
                parameters: data.parameters,
                updated_by: user?.id || null,
                submeter_info: data.paytype === "-1" ? submeterData : null,
            }

            const { error } = await supabase
                .from('connections')
                .update(connectionData)
                .eq('id', connectionId)

            if (error) {
                const errorMessage = handleDatabaseError(error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: errorMessage,
                })
                return;
            }

            toast({
                title: "Success",
                description: data.paytype === "-1"
                    ? "Connection and submeter information updated successfully"
                    : "Connection updated successfully",
            })

            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update connection",
            })
            console.error("Error:", error)
        } finally {
            router.back()
            setIsLoading(false);
        }
    }

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            getAllSiteId(searchQuery)
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchQuery])

    useEffect(() => {

        getAllSiteId()
    }, [])

    return (
        <Card>
            <CardContent className="space-y-4 pt-4">
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="site_id"
                            render={({ field }) => (
                                <FormItem className="mb-4">
                                    <FormLabel>{site_name} ID *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Select ${site_name} ID`}>
                                                    {field.value}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-[300px]">
                                            <div className="flex items-center gap-2 px-2 py-2 sticky top-0 bg-popover z-10 border-b">
                                                <Input
                                                    className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none"
                                                    placeholder={`Search ${site_name} ID...`}
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        const sanitized = sanitizeInput(e.target.value, false);
                                                        setSearchQuery(sanitized);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <ScrollArea className="max-h-[200px]">
                                                {isLoading ? (
                                                    <SelectItem value="loading" disabled>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
                                                            <span className="text-muted-foreground">Loading...</span>
                                                        </div>
                                                    </SelectItem>
                                                ) : siteId.length === 0 ? (
                                                    <SelectItem value="no-results" disabled>
                                                        <span className="text-muted-foreground">No results found</span>
                                                    </SelectItem>
                                                ) : (
                                                    siteId.map((id) => (
                                                        <SelectItem key={id} value={id} className="transition-colors hover:bg-primary/10">
                                                            {id}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="paytype"
                            render={({ field }) => (
                                <FormItem className="mb-4">
                                    <FormLabel>Pay Type *</FormLabel>
                                    <Select
                                        onValueChange={handlePayTypeChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a Pay Type">
                                                    {PAY_TYPE_LIST.find(pay => pay.value === field.value)?.name || field.value}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {PAY_TYPE_LIST.map((pay) => (
                                                <SelectItem key={pay.value} value={pay.value}>
                                                    {pay.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="biller_id"
                            render={({ field }) => (
                                <FormItem className="mb-4">
                                    <FormLabel>Biller Board *</FormLabel>
                                    <Select onValueChange={handleBillerChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a Biller Board" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-[300px]">
                                            <ScrollArea className="max-h-[200px]">
                                                {billers.sort((a, b) => a.board_name.localeCompare(b.board_name)).map((biller: BillerListProps, key: number) => (
                                                    <SelectItem key={key} value={biller.id}>
                                                        <span className="text-ellipsis">{biller.board_name}</span>
                                                    </SelectItem>
                                                ))}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Parameters Section */}
                        {fields.length > 0 && (
                            <div className="space-y-4 mt-4">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`parameters.${index}.value`}
                                        render={({ field: inputField }) => (
                                            <FormItem>
                                                <FormLabel>{field.key} *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...inputField}
                                                        placeholder={`Enter ${field.key}`}
                                                        required
                                                        onChange={(e) => {
                                                            const sanitized = sanitizeInput(e.target.value, false);
                                                            inputField.onChange(sanitized);
                                                            // Real-time validation
                                                            if (field.validation) {
                                                                validateParameterValue(sanitized, field.validation, field.key, index);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Submeter Information Section */}
                        {form.watch("paytype") === "-1" && (
                            <div className="space-y-4 mt-6">
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Submeter Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="bank_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Name</FormLabel>
                                                    <FormControl>
                                                        <BankSelector
                                                            label=""
                                                            placeholder="Select Bank"
                                                            onChange={field.onChange}
                                                            defaultValue={field.value}
                                                        />
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
                                                        <Input 
                                                            {...field} 
                                                            placeholder="Enter bank branch name"
                                                            onChange={(e) => {
                                                                const sanitized = sanitizeInput(e.target.value, true);
                                                                field.onChange(sanitized);
                                                            }}
                                                        />
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
                                                        <Input 
                                                            {...field} 
                                                            placeholder="Enter account holder name"
                                                            onChange={(e) => {
                                                                const sanitized = sanitizeInput(e.target.value, true);
                                                                field.onChange(sanitized);
                                                            }}
                                                        />
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
                                                        <Input 
                                                            {...field} 
                                                            placeholder="Enter operator name"
                                                            onChange={(e) => {
                                                                const sanitized = sanitizeInput(e.target.value, true);
                                                                field.onChange(sanitized);
                                                            }}
                                                        />
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
                                                    <Textarea 
                                                        {...field} 
                                                        placeholder="Enter operational hours (e.g., 9:00 AM - 6:00 PM)"
                                                        onChange={(e) => {
                                                            const sanitized = sanitizeInput(e.target.value, true);
                                                            field.onChange(sanitized);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Update Connection"}
                        </button>
                    </form>
                </FormProvider>
            </CardContent>
        </Card>
    )
}

export default EditConnectionForm 