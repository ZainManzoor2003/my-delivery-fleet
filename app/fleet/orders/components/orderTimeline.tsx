import TimelineStep from './timeLineSteps'
import { Order } from '@/lib/types/order'

interface Props {
    order: Order
}

type StepStatus = 'active' | 'done' | 'pending'

interface TimelineStepConfig {
    title: string;
    time: string;
    status: StepStatus;
    description?: string;
}

export default function OrderTimeline({ order }: Props) {
    const formatTime = (date: Date | string | null | undefined) => {
        if (!date) return "-- : --"
        const d = new Date(date)
        return d.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return ""
        const d = new Date(date)
        return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        })
    }

    const formatDateTime = (date: Date | string | null | undefined) => {
        const time = formatTime(date)
        const dateStr = formatDate(date)
        return dateStr ? `${dateStr}, ${time}` : time
    }

    const getCurrentStep = (): number => {
        if (order.deliveredAt) return 5
        if (order.deliveryStartTime) return 4
        if (order.driverAcceptedAt) return 3
        if (order.driverRequestedAt) return 2
        if (order.createdAt) return 1
        return 0
    }

    const getStepStatus = (stepNumber: number): StepStatus => {
        const currentStep = getCurrentStep()
        if (stepNumber < currentStep) return 'done'
        if (stepNumber === currentStep) return 'active'
        return 'pending'
    }

    const getTimelineSteps = (): TimelineStepConfig[] => {
        const steps: TimelineStepConfig[] = [
            {
                title: "Order Created",
                time: formatDateTime(order.createdAt),
                status: getStepStatus(1),
            },
            {
                title: "Driver Requested",
                time: formatDateTime(order.driverRequestedAt),
                status: getStepStatus(2),
            },
            {
                title: "Pickup Scheduled",
                time: formatDateTime(order.driverAcceptedAt),
                status: getStepStatus(3)
            },
            {
                title: "Out for Delivery",
                time: formatDateTime(order.deliveryStartTime),
                status: getStepStatus(4),
            },
            {
                title: "Delivered",
                time: formatDateTime(order.deliveredAt),
                status: getStepStatus(5),
            }
        ]

        return steps
    }

    const timelineSteps = getTimelineSteps()
    const isDelivered = !!order.deliveredAt

    return (
        <div className="pt-4 px-4">
            <h2 className="text-lg font-medium text-text-1 mb-8">Order Timeline</h2>
            <div className="relative space-y-0 ml-2">
                {timelineSteps.map((step, index) => (
                    <TimelineStep
                        key={step.title}
                        title={step.title}
                        time={step.time}
                        description={step.description}
                        status={step.status}
                        isLast={index === timelineSteps.length - 1}
                        isDelivered={isDelivered}
                    />
                ))}
            </div>
        </div>
    );
}
