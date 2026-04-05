import { create } from 'zustand'
import { Address } from '@/lib/enums/address'
import { Role } from '@/lib/enums/role'
import { BusinessStatus } from '@/lib/types/business'
import { BusinessType } from '@/lib/enums/businessType'

export type UserState = {
    userId: string | null
    businessName?: string | null
    businessId?: string | null
    businessAddress?: Address | null
    businessStatus?: BusinessStatus | null
    businessType?: BusinessType | null
    role?: Role | null
}

export type UserActions = {
    setUser: (user: Partial<UserState>) => void
}

export type UserStore = UserState & UserActions

export const useUserStore = create<UserStore>()((set) => ({
    userId: null,
    businessId: null,
    businessAddress: null,
    businessStatus: null,
    businessType: null,
    role: null,
    setUser: (user) => set(user),
}))
