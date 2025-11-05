'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseError } from '@/hooks/use-supabase-error';
import { LoadingButton } from '../../buttons/loading-button';
import { MeterReadingsForm } from './meter-reading-form';
import { SingleBillProps } from '@/types/bills-type';
import { MeterReadingsProps } from '@/types/meter-readings-type';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';
import { Switch } from '../../ui/switch';
import { useSidebar } from '@/components/ui/sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { m } from 'framer-motion';

//initial value
const coreCharges = {
  energy_charges: 0,
  fixed_charges: 0,
  demand_charges: 0,
  fppac_charges: 0,
  minimum_charges: 0,
  surcharge: 0
};

const regulatoryCharges = {
  electricity_duty: 0,
  municipal_tax: 0,
  cgst: 0,
  sgst: 0,
  tax_at_source: 0
};

const adherenceCharges = {
  lpsc: 0,
  tod_rebate: 0,
  tod_surcharge: 0,
  low_pf_surcharge: 0,
  sanctioned_load_penalty: 0,
  power_factor_penalty: 0,
  power_factor_incentive: 0,
  capacitor_surcharge: 0,
  misuse_surcharge: 0
};

const additionalCharges = {
  other_charges: 0,
  arrears: 0,
  rebate_subsidy: 0,
  adjustment: 0,
  interest_on_sd: 0,
  additional_security_deposit: 0,
  wheeling_charges: 0,
  round_off_amount: 0
};

interface BillTypeReason {
  amount: boolean;
  charges: boolean;
  consumption: boolean;
}

// Helper function to get a safe BillTypeReason object
function getBillTypeReason(val: unknown): BillTypeReason {
  if (
    val &&
    typeof val === 'object' &&
    'amount' in val &&
    'charges' in val &&
    'consumption' in val
  ) {
    const v = val as Record<string, unknown>;
    return {
      amount: typeof v.amount === 'boolean' ? v.amount : false,
      charges: typeof v.charges === 'boolean' ? v.charges : false,
      consumption: typeof v.consumption === 'boolean' ? v.consumption : false
    };
  }
  return { amount: false, charges: false, consumption: false };
}

export function BillForm({ initialValue }: { initialValue: SingleBillProps }) {


  const { toggleSidebar, state } = useSidebar()

  useEffect(() => {
    if (state === 'expanded') {
      toggleSidebar();
    }
  }, [state]);

  const initialChargeType = {
    core_charges: initialValue.core_charges || {
      id: initialValue.id,
      ...coreCharges
    },
    regulatory_charges: initialValue.regulatory_charges || {
      id: initialValue.id,
      ...regulatoryCharges
    },
    adherence_charges: initialValue.adherence_charges || {
      id: initialValue.id,
      ...adherenceCharges
    },
    additional_charges: initialValue.additional_charges || {
      id: initialValue.id,
      ...additionalCharges
    }
  };
  const { toast } = useToast();
  const { handleDatabaseError, clearError } = useSupabaseError();
  const [isLoader, setIsLoader] = useState<boolean>(false);
  const [formData, setFormData] = useState<SingleBillProps>({
    ...initialValue,
    ...initialChargeType,
    bill_type_reason: (initialValue.bill_type_reason && typeof initialValue.bill_type_reason === 'object') ? {
      amount: (initialValue.bill_type_reason as any).amount ?? false,
      charges: (initialValue.bill_type_reason as any).charges ?? false,
      consumption: (initialValue.bill_type_reason as any).consumption ?? false
    } : {
      amount: false,
      charges: false,
      consumption: false
    }
  });

  const supabase = createClient();
  const router = useRouter();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleChargesChange = (
    chargeType:
      | 'core_charges'
      | 'regulatory_charges'
      | 'adherence_charges'
      | 'additional_charges',
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [chargeType]: {
        ...prev[chargeType],
        [field]: parseFloat(value)
      }
    }));
  };

  const handleMeterReadingChange = (
    index: number,
    field: keyof MeterReadingsProps,
    value: string | number
  ) => {
    setFormData((prev) => {
      const readings = [...(prev.meter_readings || [])];
      readings[index] = {
        ...readings[index],
        [field]:
          field === 'multiplication_factor' || field.includes('reading')
            ? parseFloat(value as string)
            : value
      };
      return { ...prev, meter_readings: readings };
    });
  };
  // Utility function to get updated fields
  const getUpdatedFields = <T extends Record<string, any>>(
    original: T,
    current: T
  ): Partial<T> => {
    const updatedFields: any = {};
    for (const key in current) {
      if (
        current[key] !== null &&
        typeof current[key] === 'object' &&
        !Array.isArray(current[key]) &&
        original[key] !== null &&
        typeof original[key] === 'object'
      ) {
        // Handle nested objects
        const nestedChanges = getUpdatedFields(
          original[key] as Record<string, any>,
          current[key] as Record<string, any>
        );
        if (Object.keys(nestedChanges).length > 0) {
          updatedFields[key] = nestedChanges;
        }
      } else if (current[key] !== original[key]) {
        // Direct comparison for primitive values or if one is null and the other is not
        updatedFields[key] = current[key];
      }
    }

    return updatedFields;
  };

  const handleSubmit = async () => {
    try {
      setIsLoader(true);
      clearError(); // Clear any previous errors
      const updatedFields = getUpdatedFields(initialValue, formData);
      let discount_date_rebate = formData.discount_date_rebate;
      let due_date_rebate = formData.due_date_rebate;
      let bill_amount = formData.bill_amount;

      let tod_rebate = formData.adherence_charges?.tod_rebate;
      let pf_incentive = formData.adherence_charges?.power_factor_incentive;
      let rebate_subsidy = formData.additional_charges?.rebate_subsidy;
      let interest_on_sd = formData.additional_charges?.interest_on_sd;

      let sum_of_charges = 0;

      // Calculate sum of all charges
      if (formData.core_charges) {
        Object.entries(formData.core_charges).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'updated_at' && key !== 'created_at' && typeof value === 'number') {
            sum_of_charges += value;
          }
        });
      }

      if (formData.regulatory_charges) {
        Object.entries(formData.regulatory_charges).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'updated_at' && key !== 'created_at' && typeof value === 'number') {
            sum_of_charges += value;
          }
        });
      }

      if (formData.additional_charges) {
        Object.entries(formData.additional_charges).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'updated_at' && key !== 'created_at' &&
            key !== 'rebate_subsidy' && key !== 'interest_on_sd' && typeof value === 'number') {
            sum_of_charges += value;
          }
        });
      }

      if (formData.adherence_charges) {
        Object.entries(formData.adherence_charges).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'updated_at' && key !== 'created_at' &&
            key !== 'tod_rebate' && key !== 'power_factor_incentive' && typeof value === 'number') {
            sum_of_charges += value;
          }
        });
      }

      // Subtract the rebates and incentives if they exist
      if (tod_rebate && typeof tod_rebate === 'number') {
        sum_of_charges -= tod_rebate;
      }

      if (pf_incentive && typeof pf_incentive === 'number') {
        sum_of_charges -= pf_incentive;
      }

      if (rebate_subsidy && typeof rebate_subsidy === 'number') {
        sum_of_charges -= rebate_subsidy;
      }

      if (interest_on_sd && typeof interest_on_sd === 'number') {
        sum_of_charges -= interest_on_sd;
      }
      let is_valid = true;
      if (bill_amount && typeof bill_amount === 'number') {
        const difference = Number(bill_amount) - Number(sum_of_charges.toFixed(2));
        if (difference >= -1 && difference <= 1) {
          is_valid = true;
        } else {
          is_valid = false;
        }
      }
      if (!is_valid) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Invalid bill amount'
        });
        setIsLoader(false);
        return;
      }

      if (Object.keys(updatedFields).length === 0) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'No changes detected.'
        });
        setIsLoader(false);
        return;
      }
      if (updatedFields.core_charges !== undefined) {
        const { error } = await supabase
          .from('core_charges')
          .upsert({ ...updatedFields.core_charges, id: formData.id });

        if (error) {
          const errorMessage = handleDatabaseError(error);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: errorMessage
          });
          setIsLoader(false);
          return;
        }
        delete updatedFields.core_charges;
      }

      if (updatedFields.regulatory_charges !== undefined) {
        const { error } = await supabase
          .from('regulatory_charges')
          .upsert({ ...updatedFields.regulatory_charges, id: formData.id });

        if (error) {
          const errorMessage = handleDatabaseError(error);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: errorMessage
          });
          setIsLoader(false);
          return;
        }
        delete updatedFields.regulatory_charges;
      }

      if (updatedFields?.adherence_charges !== undefined) {
        const { error } = await supabase
          .from('adherence_charges')
          .upsert({ ...updatedFields.adherence_charges, id: formData.id });

        if (error) {
          const errorMessage = handleDatabaseError(error);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: errorMessage
          });
          setIsLoader(false);
          return;
        }
        delete updatedFields.adherence_charges;
      }

      if (updatedFields?.additional_charges !== undefined) {
        const { error } = await supabase
          .from('additional_charges')
          .upsert({ ...updatedFields.additional_charges, id: formData.id });

        if (error) {
          const errorMessage = handleDatabaseError(error);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: errorMessage
          });
          setIsLoader(false);
          return;
        }
        delete updatedFields.additional_charges;
      }

      if (
        updatedFields?.meter_readings !== undefined &&
        updatedFields?.meter_readings?.length > 0
      ) {
        console.error(
          'updatedFields?.meter_readings',
          updatedFields?.meter_readings
        );
        const meterReadings = updatedFields?.meter_readings?.map(
          ({ created_at, updated_at, ...r }: any) => ({
            ...r,
            bill_id: formData.id
          })
        );

        const { error } = await supabase
          .from('meter_readings')
          .upsert(meterReadings);
        if (error) {
          const errorMessage = handleDatabaseError(error);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: errorMessage
          });
          setIsLoader(false);
          return;
        }
        delete updatedFields.meter_readings;
      }

      if (updatedFields !== undefined) {
        delete updatedFields.adherence_charges;
        delete updatedFields.core_charges;
        delete updatedFields.regulatory_charges;
        delete updatedFields.additional_charges;
        delete updatedFields.meter_readings;
        // Remove non-column properties
        if (updatedFields.connections !== undefined) {
          delete updatedFields.connections;
        }
        const { error } = await supabase
          .from('bills')
          .update({ ...updatedFields, is_valid: formData.is_valid, bill_type_reason: formData.bill_type_reason as any })
          .eq('id', formData.id);
        if (error) {
          console.error('error', error);
          toast({
            title: 'Error',
            variant: 'destructive',
            description: 'Error updating bills'
          });
          setIsLoader(false);
          return;
        }
      }

      const { error } = await supabase
        .from('bills')
        .update({ is_valid: formData.is_valid })
        .eq('id', formData.id);
      if (error) {
        console.error('error', error);
        toast({
          title: 'Error',
          variant: 'destructive',
          description: 'Error updating bills'
        });
      }
      toast({
        variant: 'success',
        title: 'Success',
        description: 'Bills edited successfully'
      });

      router.refresh();
      // router.push('/support/bill'); // Redirect to bills list page
    } catch (error) {
      console.error('Error updating data:', error);
      // You can add an error message here
    } finally {
      setIsLoader(false);
    }
  };

  const addNewMeterReading = () => {
    const newReading: MeterReadingsProps = {
      billed_demand: 0,
      bill_id: formData.id,
      end_date: '',
      end_reading: 0,
      meter_no: '',
      multiplication_factor: 0,
      start_date: '',
      start_reading: 0,
      type: ''
    };

    setFormData((prev) => ({
      ...prev,
      meter_readings: [...(prev.meter_readings || []), newReading]
    }));
  };

  const removeMeterReading = async (index: number) => {
    const removeReading =
      formData.meter_readings?.filter((_, i) => i === index) || [];
    const { error } = await supabase
      .from('meter_readings')
      .delete()
      .in(
        'bill_id',
        removeReading.map((m) => m.bill_id)
      )
      .in(
        'meter_no',
        removeReading.map((m) => m.meter_no)
      );
    if (error) {
      console.error('error', error);
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Error Remove Meter Reading bills'
      });
    }
    setFormData((prev) => ({
      ...prev,
      meter_readings: prev.meter_readings?.filter((_, i) => i !== index) || []
    }));
  };


  return (
    <div className="space-y-6">
      {/* Basic Bill Information */}
      <h3 className="mb-2 text-lg font-semibold">Bill Information</h3>
      {formData.bill_amount < 0 && (
        <div className="text-red-500 font-medium mb-2">
          Negative bill amount
        </div>
      )}
      {formData?.validation_reason && typeof formData.validation_reason === 'object' ? (
        <div className="space-y-2">
          {Object.keys(formData.validation_reason as Record<string, boolean>).map((key) =>
            (formData.validation_reason as Record<string, boolean>)[key] === false ? (
              <div className='text-red-500' key={key}>
                {camelCaseToTitleCase(key) + ' discrepancy'}
              </div>
            ) : null
          )}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="connection_id">Connection ID</Label>
          <Input
            disabled
            id="connection_id"
            name="connection_id"
            value={formData.connection_id}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="bill_date">Bill Date</Label>
          <Input
            id="bill_date"
            name="bill_date"
            type="date"
            value={formData.bill_date}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="bill_amount">Bill Amount</Label>
          <Input
            id="bill_amount"
            name="bill_amount"
            type="number"
            value={formData.bill_amount}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="bill_number">Bill Number</Label>
          <Input
            id="bill_number"
            name="bill_number"
            value={formData.bill_number}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="billed_unit">Billed Unit</Label>
          <Input
            id="billed_unit"
            name="billed_unit"
            type="number"
            value={formData.billed_unit}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            value={formData.start_date || ''}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            value={formData.end_date || ''}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="due_date_rebate">Due Date Rebate</Label>
          <Input
            id="due_date_rebate"
            name="due_date_rebate"
            type="number"
            step="0.01"
            value={formData.due_date_rebate ?? ''}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="discount_date_rebate">Discount Date Rebate</Label>
          <Input
            id="discount_date_rebate"
            name="discount_date_rebate"
            type="number"
            step="0.01"
            value={formData.discount_date_rebate ?? ''}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="penalty_amount">Penalty Amount</Label>
          <Input
            id="penalty_amount"
            name="penalty_amount"
            type="number"
            step="0.01"
            value={formData.penalty_amount ?? ''}
            onChange={handleInputChange}
          />
        </div>



        <div>
          <Label htmlFor="bill_type">Bill Type</Label>
          <Select
            value={formData.bill_type || ''}
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                bill_type: value
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bill type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Abnormal">Abnormal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.bill_type === 'Abnormal' && (
          <div className="space-y-4">
            <Label>Bill Type Reason</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="amount"
                  checked={getBillTypeReason(formData.bill_type_reason).amount === true}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      bill_type_reason: {
                        ...getBillTypeReason(prev.bill_type_reason),
                        amount: checked
                      }
                    }));
                  }}
                />
                <Label htmlFor="amount">Amount Issue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="charges"
                  checked={getBillTypeReason(formData.bill_type_reason).charges === true}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      bill_type_reason: {
                        ...getBillTypeReason(prev.bill_type_reason),
                        charges: checked
                      }
                    }));
                  }}
                />
                <Label htmlFor="charges">Charges Issue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="consumption"
                  checked={getBillTypeReason(formData.bill_type_reason).consumption === true}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      bill_type_reason: {
                        ...getBillTypeReason(prev.bill_type_reason),
                        consumption: checked
                      }
                    }));
                  }}
                />
                <Label htmlFor="consumption">Consumption Issue</Label>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Core Charges */}

      {formData.core_charges && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Core Charges</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(formData.core_charges).map(
              ([key, value]: any) =>
                key !== 'id' &&
                key !== 'updated_at' &&
                key !== 'created_at' && (
                  <div key={key}>
                    <Label htmlFor={`core_${key}`}>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={`core_${key}`}
                      name={`core_${key}`}
                      type="number"
                      value={value}
                      onChange={(e) =>
                        handleChargesChange('core_charges', key, e.target.value)
                      }
                    />
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Regulatory Charges */}
      {formData.regulatory_charges && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Regulatory Charges</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(formData.regulatory_charges).map(
              ([key, value]: any) =>
                key !== 'id' &&
                key !== 'updated_at' &&
                key !== 'created_at' && (
                  <div key={key}>
                    <Label htmlFor={`regulatory_${key}`}>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={`regulatory_${key}`}
                      name={`regulatory_${key}`}
                      type="number"
                      value={value}
                      onChange={(e) =>
                        handleChargesChange(
                          'regulatory_charges',
                          key,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Adherence Charges */}
      {formData.adherence_charges && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Adherence Charges</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(formData.adherence_charges).map(
              ([key, value]: any) =>
                key !== 'id' &&
                key !== 'updated_at' &&
                key !== 'created_at' && (
                  <div key={key}>
                    <Label htmlFor={`adherence_${key}`}>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={`adherence_${key}`}
                      name={`adherence_${key}`}
                      type="number"
                      value={value}
                      onChange={(e) =>
                        handleChargesChange(
                          'adherence_charges',
                          key,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Additional Charges */}
      {formData.additional_charges && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Additional Charges</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(formData.additional_charges).map(
              ([key, value]: any) =>
                key !== 'id' &&
                key !== 'updated_at' &&
                key !== 'created_at' && (
                  <div key={key}>
                    <Label htmlFor={`additional_${key}`}>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={`additional_${key}`}
                      name={`additional_${key}`}
                      type="number"
                      value={value}
                      onChange={(e) =>
                        handleChargesChange(
                          'additional_charges',
                          key,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
            )}
          </div>
        </div>
      )}

      {/* Meter Readings */}

      <MeterReadingsForm
        formData={formData}
        handleMeterReadingChange={handleMeterReadingChange}
        removeMeterReading={removeMeterReading}
        addNewMeterReading={addNewMeterReading}
      />

      <div className="flex items-center space-x-2">
        <Switch
          title='valid'
          id='is_valid'
          checked={formData?.is_valid || false}
          onCheckedChange={(checked) => {
            setFormData((prev) => ({
              ...prev,
              is_valid: checked
            }));
          }}
        />
        <Label htmlFor="is_valid">Validation</Label>
      </div>
      {/* Submit Button */}
      <LoadingButton loading={isLoader} onClick={handleSubmit}>
        Update Bill
      </LoadingButton>
    </div>
  );
}
