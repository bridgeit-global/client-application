import { create } from 'zustand';

type ZoomState = {
  refAreaLeft: string;
  refAreaRight: string;
  left: string | number;
  right: string | number;
  top: string | number;
  bottom: string | number;
  brushStartIndex: number;
  brushEndIndex: number;
  animation: boolean;
};

type ZoomStore = {
  zoomState: ZoomState;
  setZoomState: (state: Partial<ZoomState>) => void;
  resetZoom: () => void;
};

const initialZoomState: ZoomState = {
  refAreaLeft: '',
  refAreaRight: '',
  left: 'dataMin',
  right: 'dataMax',
  top: 'dataMax+1',
  bottom: 'dataMin-1',
  brushStartIndex: 0,
  brushEndIndex: 0,
  animation: true
};

export const useZoomStore = create<ZoomStore>((set) => ({
  zoomState: initialZoomState,
  setZoomState: (newState) =>
    set((state) => ({ zoomState: { ...state.zoomState, ...newState } })),
  resetZoom: () => set({ zoomState: initialZoomState })
}));
