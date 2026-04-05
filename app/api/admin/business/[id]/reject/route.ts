import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { Role } from '@/lib/enums/role'
import { BusinessStatus } from '@/lib/types/business'

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user || user.role !== Role.ADMIN) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        const business = await prisma.business.update({
            where: { id },
            data: { status: BusinessStatus.REJECTED },
            select: {
                id: true,
                name: true,
                status: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })

        return NextResponse.json({
            message: 'Business rejected successfully',
            business
        })
    } catch (error) {
        console.error('Error rejecting business:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
