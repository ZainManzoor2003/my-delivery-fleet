'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ContainAlcoholModal({ open, onClose, onConfirm }: Props) {
    const [accepted, setAccepted] = useState<boolean>(false);

    const handleClose = () => {
        setAccepted(false);
        onClose();
    };

    const handleConfirm = () => {
        setAccepted(false);
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="md:min-w-lg max-h-[95vh] overflow-y-auto rounded-3xl p-0">
                <VisuallyHidden>
                    <DialogTitle>Enable Alcohol Delivery?</DialogTitle>
                </VisuallyHidden>
                <div className="p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-medium text-text-sidebar">Enable Alcohol Delivery?</h2>
                    </div>

                    <div className="border border-border rounded-4xl p-5 space-y-4 bg-background">
                        <p className="text-sm text-text-2">
                            Delivery of alcohol and age-restricted items is strictly regulated and carries additional liability. By enabling this feature, you explicitly agree to the following terms, which are mandated by our Delivery Partners (e.g., Uber Direct):
                        </p>
                        <Separator className="bg-border" />
                        <ul className="space-y-4">
                            <li className="text-sm text-text-2">
                                <span className="font-semibold text-text-1">Valid License Required: </span>
                                You represent and warrant that you hold all necessary and valid state and local licenses to sell and deliver alcohol.
                            </li>
                            <li className="text-sm text-text-2">
                                <span className="font-semibold text-text-1">Strict Packaging &amp; Labeling: </span>
                                You agree to package all alcohol securely to prevent tampering and affix any state-mandated warning labels (e.g., &ldquo;Contains Alcohol - 21+ Signature Required&rdquo;).
                            </li>
                            <li className="text-sm text-text-2">
                                <span className="font-semibold text-text-1">You Pay for Return Trips: </span>
                                If a Delivery Person cannot legally complete the delivery (e.g., the customer is underage, intoxicated, or unavailable), the alcohol will be returned to your store. You agree to pay any and all Return Fees assessed by the Delivery Partner for the return trip.
                            </li>
                            <li className="text-sm text-text-2">
                                <span className="font-semibold text-text-1">Liability: </span>
                                You assume full liability for compliance with all local alcohol delivery laws.
                            </li>
                        </ul>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border border-border cursor-pointer appearance-none checked:bg-primary checked:border-primary checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMC42NjY3IDAuNUw0LjAwMDA0IDcuMTY2NjdMMS4zMzMzNyA0LjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS42NjY2NyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] checked:bg-center checked:bg-no-repeat"
                        />
                        <span className="text-sm text-text-2">
                            I have read and agree to the Age-Restricted Delivery Terms.
                        </span>
                    </label>

                    <div className="flex justify-end items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={!accepted}
                            onClick={handleConfirm}
                            className="h-10"
                        >
                            Enable Alcohol Delivery
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
