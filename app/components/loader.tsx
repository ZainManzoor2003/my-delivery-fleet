import { cn } from "@/lib/utils";

interface LoaderProps {
    /** Main text to display */
    label?: string;
    /** Secondary descriptive text */
    description?: string;
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to take full screen height */
    fullScreen?: boolean;
    /** Custom className for the container */
    className?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-4',
};

const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
};

export function Loader({
    label,
    description,
    size = 'md',
    fullScreen = false,
    className,
}: LoaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center h-full",
                fullScreen && "min-h-screen",
                className
            )}
        >
            <div className="flex flex-col items-center gap-4">
                {/* Spinner */}
                <div
                    className={cn(
                        "border-gray-200 border-t-primary rounded-full animate-spin",
                        sizeClasses[size]
                    )}
                />

                {/* Text content */}
                {(label || description) && (
                    <div className="text-center">
                        {label && (
                            <p className={cn("font-medium text-gray-900", textSizeClasses[size])}>
                                {label}
                            </p>
                        )}
                        {description && (
                            <p className="text-sm text-gray-500 mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

