import React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineItem, TimelineItemProps } from './timeline-item';

type TimelineProps = {
  location: string;
  events: TimelineItemProps[];
};

function getStartAndEndDates(events: TimelineItemProps[]): {
  startDate: string;
  endDate: string;
} {
  if (!events || events.length === 0) {
    throw new Error('Events array is empty or undefined');
  }

  // Extract all dates from the events array
  const dates = events.map((event) => new Date(event.date));

  // Find the minimum and maximum dates
  const startDate = new Date(Math.min(...dates.map((date) => date.getTime())));
  const endDate = new Date(Math.max(...dates.map((date) => date.getTime())));

  // Format the dates back to 'YYYY-MM-DD'
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

export const Timeline: React.FC<TimelineProps> = ({ location, events }) => {
  const { startDate, endDate } = getStartAndEndDates(events);

  const dateRange = generateDateRange(startDate, endDate);
  const eventMap = groupEventsByDate(events);

  return (
    <div className="mx-auto w-full max-w-6xl pb-20">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold">
          {location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-1/2 h-full w-0.5 bg-gray-200"></div>
          <div className="space-y-2 pb-20">
            {dateRange.reverse().map((date) => (
              <TimelineItem
                key={date}
                date={date}
                events={eventMap.get(date) || []}
                hasEvent={eventMap.has(date)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </div>
  );
};

function generateDateRange(start: string, end: string): string[] {
  const dates = [];
  let currentDate = new Date(start);
  const endDate = new Date(end);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function groupEventsByDate(
  events: TimelineItemProps[]
): Map<string, TimelineItemProps[]> {
  const eventMap = new Map<string, TimelineItemProps[]>();

  events.forEach((event) => {
    if (event.date) {
      if (!eventMap.has(event.date)) {
        eventMap.set(event.date, []);
      }
      eventMap.get(event.date)!.push(event);
    }
  });

  return eventMap;
}