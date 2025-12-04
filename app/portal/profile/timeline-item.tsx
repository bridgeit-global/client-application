'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, FileText, Calendar, Loader2 } from 'lucide-react';
import { useTimelineStore } from '@/lib/store/timeline-store';
import { motion } from 'framer-motion'; // Import framer-motion
import { ImageViewer } from '@/components/modal/document-viewer-modal';
import { PDFViewer } from '@/components/modal/document-viewer-modal';
import { HTMLViewer } from '@/components/modal/document-viewer-modal';
import { DialogContent } from '@/components/ui/dialog';
import { Dialog } from '@/components/ui/dialog';
import { ABNORMAL_BILL_STATUS_COLOR } from '@/constants/colors';
import { getPresignedUrl } from '@/lib/utils/presigned-url-client';
import { Skeleton } from '@/components/ui/skeleton';
export type TimelineItemProps = {
  id: string;
  date: string;
  title: string;
  link?: string;
  type?: string;
  bill_type?: string;
  billed_unit?: string;
  content_type?: string;
  description: string;
};

type TimelineItemComponentProps = {
  date: string;
  events: TimelineItemProps[];
  hasEvent: boolean;
};

export const TimelineItem: React.FC<TimelineItemComponentProps> = ({
  date,
  events,
  hasEvent
}) => {

  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | undefined>(undefined);
  const [content_type, setContentType] = useState<string | undefined>(undefined);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const { timelineId, setTimelineId } = useTimelineStore();
  const parsedDate = new Date(date);
  const formattedDate = format(parsedDate, 'MMM dd, yyyy');
  const isFirstOfMonth = parsedDate.getDate() === 1;

  const meterEvents = events.filter((event) => event.title === 'Reading');
  const billEvents = events.filter((event) =>
    ['Bill', 'DueDate', 'Payment'].includes(event.title)
  );

  const billGeneration = billEvents.find((event) => event.title === 'Bill');
  const payment = billEvents.find((event) => event.title === 'Payment');
  const dueDate = billEvents.find((event) => event.title === 'DueDate');

  // Fetch presigned URL when link changes
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (link) {
        setIsLoadingUrl(true);
        setPresignedUrl(null);
        try {
          const url = await getPresignedUrl(link);
          setPresignedUrl(url);
        } catch (error) {
          console.error('Failed to get presigned URL:', error);
        } finally {
          setIsLoadingUrl(false);
        }
      } else {
        setPresignedUrl(null);
        setIsLoadingUrl(false);
      }
    };

    fetchPresignedUrl();
  }, [link]);

  const handleMouseEnter = (id: any) => setTimelineId(id);
  const handleMouseLeave = () => setTimelineId('');

  const renderMeterReadings = () => {
    if (meterEvents.length === 0) return null;

    return (
      <motion.div

        onMouseEnter={() => handleMouseEnter(meterEvents[0].id)}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, scale: 0.95, zIndex: 0 }}
        animate={{
          opacity: meterEvents[0].id === timelineId ? 1 : 0.9,
          scale: meterEvents[0].id === timelineId ? 1 : 0.95,
          zIndex: meterEvents[0].id === timelineId ? 10 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="absolute left-1/4 mb-2"
      >
        <Card
          style={{
            backgroundColor: meterEvents[0]?.bill_type?.toLowerCase() === 'abnormal' ? ABNORMAL_BILL_STATUS_COLOR : 'white'
          }}
          className={cn(
            'transition-all duration-200',
            meterEvents[0].id === timelineId
              ? 'bg-yellow-50 shadow-md'
              : 'hover:shadow-md'
          )}
        >
          <CardContent className="space-y-3 p-3">
            <span className="mb-2 text-sm">{formattedDate}</span>
            {meterEvents.map((event, index) => (
              <div
                key={index}
                onClick={() => {
                  setOpen(true)
                  setLink(event.link)
                  setContentType(event.content_type)
                }} className="flex items-center justify-between">
                <Badge variant="outline" className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="mr-1 h-4 w-4"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  Unit
                </Badge>
                <span className="text-sm">{event.billed_unit}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderBillEvent = () => {
    if (billGeneration || payment || dueDate) {
      return (
        <motion.div
          onMouseEnter={() =>
            handleMouseEnter(billGeneration?.id || payment?.id || dueDate?.id)
          }
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, scale: 0.95, zIndex: 0 }}
          animate={{
            opacity:
              (billGeneration?.id || payment?.id || dueDate?.id) === timelineId
                ? 1
                : 0.9,
            scale:
              (billGeneration?.id || payment?.id || dueDate?.id) === timelineId
                ? 1
                : 0.95,
            zIndex:
              (billGeneration?.id || payment?.id || dueDate?.id) === timelineId
                ? 10
                : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute mb-2"
        >
          <Card
            style={{
              backgroundColor: billGeneration?.bill_type?.toLowerCase() === 'abnormal' ? ABNORMAL_BILL_STATUS_COLOR : payment?.bill_type?.toLowerCase() === 'abnormal' ? ABNORMAL_BILL_STATUS_COLOR : dueDate?.bill_type?.toLowerCase() === 'abnormal' ? ABNORMAL_BILL_STATUS_COLOR : 'white'
            }}
            className={cn(
              'transition-all duration-200',
              (billGeneration?.id || payment?.id || dueDate?.id) === timelineId
                ? 'bg-yellow-50 shadow-md'
                : 'hover:shadow-md'
            )}
          >
            <CardContent className="p-3">
              <span className="mb-2 text-sm">{formattedDate}</span>
              <div className="space-y-2">
                {billGeneration && (
                  <div onClick={() => {
                    setOpen(true)
                    setLink(billGeneration.link)
                    setContentType(billGeneration.content_type)
                  }} className="flex items-center justify-center text-center">
                    <Badge variant="outline" className="mr-2">
                      <FileText className="mr-1 h-4 w-4 text-blue-600" />
                      Bill
                    </Badge>
                    <span className="text-sm">
                      {billGeneration.description}
                    </span>
                  </div>
                )}
                {dueDate && (
                  <div onClick={() => {
                    setOpen(true)
                    setLink(dueDate.link)
                    setContentType(dueDate.content_type)
                  }} className="flex items-center justify-center text-center">
                    <Badge variant="outline" className="mr-2">
                      <Calendar className="mr-1 h-4 w-4 text-red-600" />
                      Due Date
                    </Badge>
                    <span className="text-sm">{dueDate.description}</span>
                  </div>
                )}
                {payment && (
                  <div onClick={() => {
                    setOpen(true)
                    setLink(payment.link)
                    setContentType(payment.content_type)
                  }} className="flex items-center justify-center text-center">
                    <Badge variant="outline" className="mr-2">
                      <Banknote className="mr-1 h-4 w-4 text-green-600" />
                      Paid
                    </Badge>
                    <span className="text-sm">{payment.description}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="group relative flex items-center">
      <div className="relative flex-1">{renderMeterReadings()}</div>
      <div className="relative w-24 flex-shrink-0 text-center">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'mb-1 h-0.5 w-2',
              hasEvent
                ? 'w-10 bg-primary'
                : 'bg-gray-300 group-hover:bg-gray-400',
              isFirstOfMonth ? 'w-6' : ''
            )}
          />
        </div>
      </div>
      <div className="relative flex-1">{renderBillEvent()}</div>
      <Dialog open={open} onOpenChange={setOpen} >
        <DialogContent className="h-full max-h-[95vh] w-full max-w-[95vw] p-2 sm:p-6">
          {isLoadingUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            </div>
          ) : presignedUrl ? (
            content_type === "pdf" ? (
              <PDFViewer pdfUrl={presignedUrl} />
            ) : content_type === "html" ? (
              <HTMLViewer htmlUrl={presignedUrl} />
            ) : content_type === "image" ? (
              <ImageViewer imageUrl={presignedUrl} />
            ) : (
              <div className="p-4">Unsupported content type</div>
            )
          ) : (
            <div className="p-4">No URL available</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};