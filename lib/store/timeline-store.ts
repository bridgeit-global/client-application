import { create } from 'zustand';

type TimelineState = {
  timelineId: string;
};

type TimelineActions = {
  setTimelineId: (timelineId: string) => void;
};

export const useTimelineStore = create<TimelineState & TimelineActions>()(
  (set) => ({
    timelineId: '',
    setTimelineId: (timelineId) => set(() => ({ timelineId: timelineId }))
  })
);
