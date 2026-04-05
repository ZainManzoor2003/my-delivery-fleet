'use client'

import { useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GenericTable, { ColumnDef } from "@/app/components/table"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, MoreHorizontal, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Role } from '@/lib/enums/role'
import { useUsers } from '@/app/hooks/useUsers'
import { useApproveBusiness, useRejectBusiness } from '@/app/hooks/useBusinessApproval'
import { formatUTCLocalDate } from '@/lib/timezone'
import { Loader } from '@/app/components/loader'
import { CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface User {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    role: string
    isActive: boolean
    createdAt: string
    business?: {
        id: string
        name: string
        status: string
        type: string
    } | null
}

export default function UsersTable() {
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | Role.BUSINESS | Role.ADMIN>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [billingBusinessId, setBillingBusinessId] = useState<string | null>(null)

    const { data: usersData, isLoading } = useUsers({ page: currentPage, limit: 10 })
    const users = useMemo(() => usersData?.users || [], [usersData?.users])
    const pagination = usersData?.pagination

    const approveMutation = useApproveBusiness()
    const rejectMutation = useRejectBusiness()

    const processBusinessBilling = async (businessId: string, weekRange: 'current' | 'previous' = 'previous') => {
        try {
            setBillingBusinessId(businessId)
            const res = await fetch('/api/billing/weekly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessIds: [businessId], weekRange }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data?.message || 'Failed to process billing')
            }

            const firstResult = Array.isArray(data?.results) ? data.results[0] : undefined
            const totalAmount = firstResult?.totalAmount
            const totalOrders = firstResult?.totalOrders
            const billingSuccess = data?.success && firstResult?.success
            const weekRangeText = weekRange === 'current' ? 'current week' : 'previous week'

            if (billingSuccess) {
                const paymentStatus = firstResult?.paymentStatus
                let message = ''

                if (paymentStatus === 'processing') {
                    message = `Payment processed for ${weekRangeText}: ${totalOrders ?? 0} orders, $${Number(totalAmount).toFixed(2)}`
                } else if (paymentStatus === 'succeeded') {
                    message = `Payment completed for ${weekRangeText}: ${totalOrders ?? 0} orders, $${Number(totalAmount).toFixed(2)}`
                } else {
                    if (totalOrders === 0) {
                        message = `No orders found for ${weekRangeText} - no billing processed`
                    } else if (Number(totalAmount) === 0) {
                        message = `Zero amount billing for ${weekRangeText}: ${totalOrders} orders - no payment processed`
                    } else {
                        message = `Billing processed successfully for ${weekRangeText}: ${totalOrders ?? 0} orders, $${Number(totalAmount).toFixed(2)}`
                    }
                }
                toast.success(message)
            } else {
                const errorMsg = firstResult?.error || 'Billing processing failed'
                toast.error(`Billing failed for ${weekRangeText}: ${errorMsg}`)
            }
        } catch (e: any) {
            toast.error(e?.message || 'Failed to process billing')
        } finally {
            setBillingBusinessId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-100 text-green-800">Approved</Badge>
            case 'UNDER_REVIEW':
                return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
            case 'INCOMPLETE':
                return <Badge className="bg-gray-100 text-gray-800">Incomplete</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case Role.ADMIN:
                return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
            case Role.BUSINESS:
                return <Badge className="bg-blue-100 text-blue-800">Business</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>
        }
    }

    const filteredUsers = useMemo(() => {
        return users.filter((user: User) => {
            const q = search.trim().toLowerCase()
            const matchesSearch = !q ||
                user.email.toLowerCase().includes(q) ||
                (user.firstName?.toLowerCase().includes(q) ?? false) ||
                (user.lastName?.toLowerCase().includes(q) ?? false) ||
                (user.business?.name?.toLowerCase().includes(q) ?? false)

            const matchesTab = activeTab === 'all' || user.role === activeTab

            return matchesSearch && matchesTab
        })
    }, [users, search, activeTab])

    const allCount = users.length
    const businessCount = users.filter((u: User) => u.role === Role.BUSINESS).length
    const adminCount = users.filter((u: User) => u.role === Role.ADMIN).length

    const userColumns: ColumnDef<User>[] = [
        {
            key: 'email',
            label: 'User',
            width: 'pl-0 w-55 min-w-55',
            render: (_value, row: User) => (
                <div>
                    <div className="font-medium text-text-1">
                        {row.firstName && row.lastName
                            ? `${row.firstName} ${row.lastName}`
                            : row.email}
                    </div>
                    <div className="text-sm text-text-2">{row.email}</div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            width: 'w-30 min-w-30',
            render: (value) => getRoleBadge(value),
        },
        {
            key: 'business',
            label: 'Business',
            width: 'w-45 min-w-45',
            render: (_value, row: User) =>
                row.business ? (
                    <div>
                        <div className="font-medium text-text-1">{row.business.name}</div>
                        <div className="text-sm text-text-2">{row.business.type}</div>
                    </div>
                ) : (
                    <span className="text-text-3">No business</span>
                ),
        },
        {
            key: 'businessStatus',
            label: 'Status',
            width: 'w-35 min-w-35',
            render: (_value, row: User) =>
                row.business
                    ? getStatusBadge(row.business.status)
                    : <Badge className="bg-gray-100 text-gray-800">N/A</Badge>,
        },
        {
            key: 'createdAt',
            label: 'Joined',
            width: 'w-30 min-w-30',
            render: (value) => formatUTCLocalDate(value),
        },
        {
            key: 'action',
            label: 'Action',
            align: 'left',
            stickyRight: true,
            width: 'w-20 min-w-20',
            render: (_value, user: User) => {
                const hasAction = user.business &&
                    (user.business.status === 'UNDER_REVIEW' || user.business.status === 'APPROVED')

                if (!hasAction) return null

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center p-1 rounded-md transition-colors outline-none">
                                <MoreHorizontal className="h-6 w-6 text-[#1e293b] cursor-pointer hover:opacity-70 transition-opacity" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 border border-border rounded-lg">
                            {user.business!.status === 'UNDER_REVIEW' && (
                                <>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            approveMutation.mutate(user.business!.id)
                                        }}
                                        className="px-2 py-2 h-10 hover:font-medium text-green-600 text-sm font-normal hover:bg-[#f1f5f9] rounded-lg cursor-pointer flex items-center gap-1"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            rejectMutation.mutate(user.business!.id)
                                        }}
                                        className="px-2 py-2 h-10 hover:font-medium text-red-600 text-sm font-normal hover:bg-[#f1f5f9] rounded-lg cursor-pointer flex items-center gap-1"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                    </DropdownMenuItem>
                                </>
                            )}
                            {user.business!.status === 'APPROVED' && (
                                <>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            processBusinessBilling(user.business!.id, 'current')
                                        }}
                                        disabled={billingBusinessId === user.business!.id}
                                        className="px-2 py-2 h-10 hover:font-medium text-blue-600 text-sm font-normal hover:bg-[#f1f5f9] rounded-lg cursor-pointer flex items-center gap-1"
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        {billingBusinessId === user.business!.id ? 'Processing...' : 'Process Current Week'}
                                    </DropdownMenuItem>
                                    <Separator className='bg-border' />
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            processBusinessBilling(user.business!.id, 'previous')
                                        }}
                                        disabled={billingBusinessId === user.business!.id}
                                        className="px-2 py-2 h-10 hover:font-medium text-green-600 text-sm font-normal hover:bg-[#f1f5f9] rounded-lg cursor-pointer flex items-center gap-1"
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        {billingBusinessId === user.business!.id ? 'Processing...' : 'Process Previous Week'}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    return (
        <div className='px-4 py-4'>
            <div className="space-y-4 border border-border rounded-[20px] bg-background">
                <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full py-4 gap-0">
                    <TabsList className="bg-transparent rounded-none w-inherit justify-start h-auto px-6 py-0 gap-4">
                        <TabsTrigger value="all"
                            className="rounded-none px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                     data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary">
                            All ({allCount})
                        </TabsTrigger>
                        <TabsTrigger value={Role.BUSINESS}
                            className="rounded-none px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                     data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary">
                            Business ({businessCount})
                        </TabsTrigger>
                        <TabsTrigger value={Role.ADMIN}
                            className="rounded-none px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                     data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary">
                            Admin ({adminCount})
                        </TabsTrigger>
                    </TabsList>

                    <div className="border-t border-border mt-0 flex flex-col lg:flex-row justify-between items-center gap-4 pt-5 py-4 px-6">
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                            <Input
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 pr-10 placeholder:text-text-3 font-normal text-sm pl-10 border-border"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                                >
                                    <X className="h-6 w-6 text-text-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {isLoading && !usersData ?
                        (
                            <Loader
                                fullScreen
                                label="Fetching Users"
                                description="Please wait while we load user information..."
                            />
                        ) :
                        <GenericTable
                            data={filteredUsers}
                            columns={userColumns}
                            className="px-6"
                            selectable={false}
                            hoverable={true}
                            emptyMessage="No users found"
                        />
                    }
                </Tabs>

                <CardFooter className="justify-center border-t items-center p-4!">
                    <div className="flex flex-col items-center gap-2">
                        {pagination && (pagination.hasPrevPage || pagination.hasNextPage) && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="text-primary font-medium hover:bg-primary/10 border-none"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-text-2">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    className="text-primary font-medium hover:bg-primary/10 border-none"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                        {pagination && !pagination.hasPrevPage && !pagination.hasNextPage && users.length > 0 && (
                            <p className="text-sm text-text-2">
                                All users loaded ({pagination.totalCount})
                            </p>
                        )}
                    </div>
                </CardFooter>
            </div>
        </div>
    )
}
