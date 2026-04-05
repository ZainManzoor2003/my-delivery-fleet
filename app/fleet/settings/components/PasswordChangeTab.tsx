'use client';

import { Button } from '@/components/ui/button';
import Password from '@/components/password';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { updateUserPassword } from '@/services/updatePassword';

export default function PasswordChangeTab() {
    const { user } = useUser();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordValidation, setPasswordValidation] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!user) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-medium text-text-1">User not found</h3>
                <p className="text-text-2 text-sm">Unable to load your profile</p>
            </div>
        );
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentPassword.trim()) {
            setError('Please enter your current password');
            return;
        }
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields');
            return;
        }
        if (!passwordValidation) {
            setError('New password does not meet security requirements');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (currentPassword === newPassword) {
            setError('New password must be different from your current password');
            return;
        }

        try {
            setIsSaving(true);
            const result = await updateUserPassword(currentPassword, newPassword);

            if (result.error) {
                setError(result.error);
                toast.error(result.error);
            } else {
                toast.success('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordValidation(false);
                setError('');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error('Failed to update password');
        } finally {
            setIsSaving(false);
        }
    };

    const canSubmit =
        !isSaving &&
        currentPassword.trim() !== '' &&
        newPassword.trim() !== '' &&
        confirmPassword.trim() !== '' &&
        passwordValidation;

    return (
        <div className="space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-background px-4 py-6 border-t border-border space-y-4">
                    <div className="space-y-4 w-2/3">
                        <div className="space-y-1">
                            <Password
                                label="Current Password"
                                placeholder="Enter your current password"
                                password={currentPassword}
                                setPassword={setCurrentPassword}
                                setPasswordValidation={() => { }}
                            />
                        </div>

                        <div className="space-y-1">
                            <Password
                                label="New Password"
                                placeholder="Create a new password"
                                password={newPassword}
                                setPassword={setNewPassword}
                                setPasswordValidation={setPasswordValidation}
                            />
                        </div>

                        <div className="space-y-1">
                            <Password
                                label="Confirm New Password"
                                placeholder="Re-enter new password"
                                password={confirmPassword}
                                setPassword={setConfirmPassword}
                                setPasswordValidation={() => { }}
                            />
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex p-6 justify-end gap-3 border-t border-border pt-6">
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}