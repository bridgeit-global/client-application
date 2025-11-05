import { create } from 'zustand';

interface IncreaseAmountModalState {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
}

export const useIncreaseAmountModalStore = create<IncreaseAmountModalState>((set) => ({
    isModalOpen: false,
    setIsModalOpen: (open) => set({ isModalOpen: open }),
}));
