import { OrganizationProps } from '@/types/organization-type';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type UserState = {
  user: any;
  organization: OrganizationProps;
};

type UserActions = {
  setUser: (user: any) => void;
  setOrganization: (organization: OrganizationProps) => void;
};
export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      user: {},
      organization: {} as OrganizationProps,
      setUser: (user: UserState) => set({ user }),
      setOrganization: (organization: OrganizationProps) => set({ organization })
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage) // (optional) by default, 'localStorage' is used
    }
  )
);


