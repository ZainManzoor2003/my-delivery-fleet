'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import UsersTable from './components/usersTable'

export default function UsersPage() {
    return (
        <div>
            <div className='flex flex-wrap items-center justify-between px-4 py-5 gap-2'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='xl:hidden' />
                    <span className='font-medium text-md text-text-sidebar'>User Management</span>
                </div>
            </div>
            <UsersTable />
        </div>
    )
}
