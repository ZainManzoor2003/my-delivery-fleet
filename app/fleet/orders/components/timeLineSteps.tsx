
interface TimelineProps {
    title: string;
    time: string;
    description?: string;
    status: 'active' | 'done' | 'pending';
    isLast?: boolean;
    isDelivered: boolean;
}

export default function TimelineStep({ title, time, description, status, isLast, isDelivered }: TimelineProps) {
    const isActive = status === 'active';
    const isDone = status === 'done';
    const isPending = status === 'pending';

    return (
        <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center
                    w-6 h-6 rounded-full border-2 transition-all duration-300
                    ${isDelivered ? 'border-[#1877F2]' : isDone ? 'border-[#94A3B8]' : isActive ? 'border-[#1877F2]' : isPending ? 'border-[#94A3B8]' : ''}
                    `}>
                    <div className={`transition-all duration-300
                    ${isDelivered ? 'bg-[#1877F2] w-2 h-2 rounded-full' : isDone ? 'bg-[#94A3B8] w-2 h-2 rounded-full' : isActive ? 'bg-[#1877F2] w-2 h-2 rounded-full animate-pulse' : isPending ? 'bg-transparent w-2 h-2 rounded-full' : ''}
                    `}>
                    </div>
                </div>

                {!isLast && <div className={`w-[1.5px] h-[calc(100%-1.5rem)] transition-all duration-300 ${isDelivered ? 'bg-[#1877F2]' : 'bg-[#94A3B8]'}`} />}
            </div>
            <div className="pb-8">
                <div className="flex flex-col gap-1">
                    <p className={`text-sm font-medium transition-colors duration-300 ${isPending ? 'text-text-1/50' : 'text-text-1'}`}>
                        {title}
                    </p>
                    <p className={`text-sm font-normal transition-colors duration-300 ${isPending ? 'text-text-1/50' : 'text-text-2'}`}>
                        {time}
                    </p>
                </div>
                {description && (
                    <p className={`text-sm font-normal mt-1 transition-colors duration-300 ${isPending ? 'text-text-1/50' : 'text-text-1'}`}>
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
