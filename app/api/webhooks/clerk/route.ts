import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { Role } from '@/lib/enums/role'

export async function POST(req: NextRequest) {
    try {
        const evt = await verifyWebhook(req)
        const eventType = evt.type


        if (eventType === 'user.created' || eventType === 'user.updated') {
            const {
                id,
                first_name,
                last_name,
                email_addresses,
                primary_email_address_id,
                image_url,
                created_at,
                updated_at,
                unsafe_metadata
            } = evt.data

            const phoneNumber = (unsafe_metadata as { phoneNumber: string })?.phoneNumber || null

            // Get primary email and verification status
            const primaryEmailObj = email_addresses?.find(
                (email: any) => email.id === primary_email_address_id
            )

            const primaryEmail = primaryEmailObj?.email_address || null
            const isEmailVerified = primaryEmailObj?.verification?.status === 'verified'

            if (!primaryEmail) {
                console.error('No primary email found for user:', id)
                return new Response('No primary email found', { status: 400 })
            }

            if (eventType === 'user.created') {
                await prisma.user.create({
                    data: {
                        id,
                        firstName: first_name,
                        lastName: last_name,
                        email: primaryEmail,
                        emailVerified: isEmailVerified ? new Date() : null,
                        phoneNumber: phoneNumber,
                        image: image_url,
                        passwordHash: '',
                        role: Role.BUSINESS,
                        isActive: true,
                        createdAt: new Date(created_at),
                        updatedAt: new Date(updated_at)
                    }
                })
            } else if (eventType === 'user.updated') {
                await prisma.user.update({
                    where: { id },
                    data: {
                        firstName: first_name,
                        lastName: last_name,
                        email: primaryEmail,
                        emailVerified: isEmailVerified ? new Date() : null,
                        image: image_url,
                        updatedAt: new Date(updated_at)
                    }
                })
            }
        }

        return new Response('Webhook received', { status: 200 })
    } catch (err) {
        console.error('Error processing webhook:', err)
        return new Response('Error processing webhook', { status: 400 })
    }
}
