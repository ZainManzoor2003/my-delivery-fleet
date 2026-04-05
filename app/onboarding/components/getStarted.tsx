import { HomeIcon } from "@/components/icons/home";
import { Button } from "@/components/ui/button";

interface GetStartedProps {
    onContinue: () => void;
}

export function GetStarted({ onContinue }: GetStartedProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative p-4 ">
            <div className="text-center min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                 border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014]">
                <div >

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border mb-5">
                        <HomeIcon size={24} />
                    </div>

                    <p className="text-2xl font-medium text-text-1">
                        Let&apos;s get your business ready
                    </p>

                    <p className="text-text-2 text-md mt-2">
                        Just a few steps before you can start deliveries
                    </p>
                </div>

                <div className="space-y-8 mt-8">

                    <div className="rounded-lg  px-4 py-5 text-sm text-text-1  bg-muted">
                        <p>
                            This setup helps us prepare delivery details and billing.
                        </p>
                        <p>
                            You can leave anytime and continue later.
                        </p>
                    </div>

                    <Button className="w-full h-10" onClick={onContinue}>
                        Get Started
                    </Button>
                </div>
            </div>
        </div>
    )
}
