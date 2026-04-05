'use client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    description?: string
    isLoading?: boolean
}

export default function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    description,
    isLoading = false,
}: DeleteConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-text-1">Are you sure?</DialogTitle>
                    <DialogDescription className="text-text-2 pt-1">
                        {description ?? 'This action cannot be undone.'}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:justify-end pt-2">
                    <Button
                        variant="outline"
                        className="border-border text-text-sidebar"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
