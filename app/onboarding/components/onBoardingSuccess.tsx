import { AccountReviewIcon } from "@/components/icons/accountReview";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/hooks/useSignOut";

export default function OnBoardingSuccess() {
    const signOut = useSignOut();
    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative p-4 ">
            <div className="min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                 border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014] text-center">
                <div className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border">
                        <AccountReviewIcon size={24} />
                    </div>

                    <p className="text-2xl font-semibold text-text-1">
                        Account Under Review!
                    </p>

                    <p className="text-text-2 text-md">
                        Your account has been submitted for review. We&apos;ll approve it within 24 hours.
                    </p>

                    <Button
                        className="w-full"
                        onClick={signOut}>Sign Out</Button>
                </div>
            </div>
        </div>
    )
}
