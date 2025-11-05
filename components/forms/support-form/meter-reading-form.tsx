import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { SingleBillProps } from '@/types/bills-type';
import IconButton from '../../buttons/icon-button';
import { Trash } from 'lucide-react';
import { MeterReadingsProps } from '@/types/meter-readings-type';

interface MeterReadingsFormProps {
  formData: SingleBillProps;
  handleMeterReadingChange: (
    index: number,
    field: keyof MeterReadingsProps,
    value: string | number
  ) => void;
  removeMeterReading: (index: number) => void;
  addNewMeterReading: () => void;
}

export function MeterReadingsForm({
  formData,
  handleMeterReadingChange,
  removeMeterReading,
  addNewMeterReading
}: MeterReadingsFormProps) {
  return (
    <div>
      {formData.meter_readings && formData.meter_readings?.length > 0 && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Meter Readings</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type & MF</TableHead>
                  <TableHead>Meter Number</TableHead>
                  <TableHead>Start Reading & Date</TableHead>
                  <TableHead>End Reading & Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.meter_readings?.map(
                  (reading: MeterReadingsProps, index: number) => (
                    <TableRow key={reading.bill_id + index}>
                      <TableCell className="space-y-2">
                        <Input
                          placeholder="type"
                          value={reading.type}
                          onChange={(e) =>
                            handleMeterReadingChange(
                              index,
                              'type',
                              e.target.value
                            )
                          }
                        />
                        <Input
                          type="number"
                          placeholder="MF"
                          value={reading.multiplication_factor}
                          onChange={(e) =>
                            handleMeterReadingChange(
                              index,
                              'multiplication_factor',
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={reading.meter_no}
                          placeholder="Meter No"
                          onChange={(e) =>
                            handleMeterReadingChange(
                              index,
                              'meter_no',
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="space-y-2">
                        <Input
                          placeholder="Start Reading"
                          type="number"
                          value={reading.start_reading}
                          onChange={(e) =>
                            handleMeterReadingChange(
                              index,
                              'start_reading',
                              parseFloat(e.target.value)
                            )
                          }
                        />
                        <Input
                          type="date"
                          value={reading.start_date}
                          onChange={(e) =>
                            handleMeterReadingChange(
                              index,
                              'start_date',
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="space-y-2">
                        <Input
                          placeholder="End Reading"
                          type="number"
                          value={reading.end_reading}
                          onChange={(e) =>
                            handleMeterReadingChange(
                              index,
                              'end_reading',
                              parseFloat(e.target.value)
                            )
                          }
                        />
                        <Input
                          type="date"
                          value={reading.end_date}
                          onChange={(e) =>
                            handleMeterReadingChange(
                              index,
                              'end_date',
                              e.target.value
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          icon={Trash}
                          variant={'destructive'}
                          onClick={() => removeMeterReading(index)}
                        />
                        {/* <Button
                                                variant="destructive"
                                                onClick={() => removeMeterReading(index)}
                                            >
                                                Remove
                                            </Button> */}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <Button className="mb-4" size={'sm'} onClick={addNewMeterReading}>
        Add Meter Reading
      </Button>
    </div>
  );
}
