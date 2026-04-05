'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

export async function updateUserPassword(currentPassword: string, newPassword: string) {
    const { userId } = await auth();

    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        const client = await clerkClient();

        const user = await client.users.getUser(userId);
        const primaryEmail = user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress;

        if (!primaryEmail) {
            return { error: 'No email address found on account' };
        }

        const verified = await client.users.verifyPassword({
            userId,
            password: currentPassword,
        });

        if (!verified) {
            return { error: 'Current password is incorrect' };
        }

        await client.users.updateUser(userId, {
            password: newPassword,
        });

        return { success: true };
    } catch (err: any) {
        const message = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || '';
        if (
            message.toLowerCase().includes('password') &&
            (message.toLowerCase().includes('incorrect') || message.toLowerCase().includes('invalid'))
        ) {
            return { error: 'Current password is incorrect' };
        }
        return { error: message || 'Failed to update password' };
    }
}