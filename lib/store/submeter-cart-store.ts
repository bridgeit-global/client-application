import { AllBillTableProps } from '@/types/bills-type';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SubmeterCartStore {
  items: AllBillTableProps[];
  isClearSelectedItems: boolean;
  addItem: (item: AllBillTableProps) => void;
  addAllItem: (items: AllBillTableProps[]) => void;
  removeItem: (id: string) => void;
  removeAllItems: (ids: string[]) => void;
  clearCart: () => void;
  openModal: () => void;
  closeModal: () => void;
  isModalOpen: boolean;
  batchName: string;
  setBatchName: (name: string) => void;
}

export const useSubmeterCartStore = create<SubmeterCartStore>()(
  persist(
    (set) => ({
      items: [],
      isClearSelectedItems: false,
      isModalOpen: false,
      batchName: '',
      setBatchName: (name) => set({ batchName: name }),
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      addAllItem: (newItems) =>
        set((state) => ({
          items: [
            ...state.items,
            ...newItems.filter(
              (newItem) =>
                !state.items.some(
                  (existingItem) => existingItem.id === newItem.id
                )
            )
          ]
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        })),
      removeAllItems: (ids) =>
        set((state) => ({
          items: state.items.filter((item) => !ids.includes(item.id))
        })),
      clearCart: () =>
        set((state) => ({
          items: [],
          isClearSelectedItems: !state.isClearSelectedItems
        }))
    }),
    {
      name: 'submeter-cart-store',
      storage: createJSONStorage(() => localStorage) // (optional) by default, 'localStorage' is used
    }
  )
);
