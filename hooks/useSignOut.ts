import { useClerk } from "@clerk/nextjs";
import { toast } from "react-toastify";

const clearCoookies = async (): Promise<boolean> => {
    const result = await fetch('/api/clear-cookies', { method: 'POST' });
    if (!result.ok) {
        return false;
    }
    return true;
}

export const useSignOut = () => {
    const { signOut } = useClerk();

    const handleSignOut = async () => {
        try {
            const success = await clearCoookies();
            if (!success) {
                console.error('Failed to clear cookies');
                toast.error('Error signing out. Please try again.');
                return;
            }

            localStorage.removeItem('businessId');
            localStorage.removeItem('paymentMethodId');

            await signOut();
        } catch (error) {
            console.error('Error during sign out:', error);
        }
    }

    return handleSignOut;
}
