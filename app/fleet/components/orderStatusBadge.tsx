import { Order, OrderStatus } from '@/lib/types/order'
import { Badge } from "@/components/ui/badge";

export default function OrderStatusBadge({ order }: { order: Order }) {
    const getStatusColor = (status: string) => {
        switch (true) {
            case status === OrderStatus.Unassigned:
                return "border-[#FF7A21] text-text-1 bg-orange-100"
            case status === OrderStatus.RequestingDriver:
                return "border-[#1877F2] text-text-1 bg-blue-200"
            case status === OrderStatus.Scheduled:
                if (order.providerDeliveryId) return "border-[#1877F2] text-text-1 bg-blue-200"
                else return "border-[#FF7A21] text-text-1 bg-orange-100"
            case status === OrderStatus.PickUp:
                return "border-[#EC4899] text-text-1 bg-pink-100"
            case status === OrderStatus.Delivery:
                return "border-[#F4C542] text-text-1 bg-yellow-100"
            case status === OrderStatus.Delivered:
                return "border-[#3FC060] text-text-1 bg-green-200"
            default:
                return "border-[#FF7A21] text-text-1 bg-orange-100"
        }
    }

    const getEnhancedStatusText = () => {
        const status = order.status;

        if (status === OrderStatus.PickUp && order.estimatedPickupTime) {
            const now = new Date();
            const pickupTime = new Date(order.estimatedPickupTime);
            const diffMs = pickupTime.getTime() - now.getTime();
            const diffMins = Math.ceil(diffMs / (1000 * 60));
            const timeText = diffMins > 0 ? `${diffMins} mins` : "1 min";
            return `Pickup in ${timeText}`;
        }

        if (status === OrderStatus.Delivery && order.estimatedDeliveryTime) {
            const now = new Date();
            const deliveryTime = new Date(order.estimatedDeliveryTime);
            const diffMs = deliveryTime.getTime() - now.getTime();
            const diffMins = Math.ceil(diffMs / (1000 * 60));
            const timeText = diffMins > 0 ? `${diffMins} mins` : "1 min";
            return `Delivery in ${timeText}`;
        }

        return status;
    }

    return (
        <Badge variant="outline" className={`text-xs px-3 py-1 uppercase font-medium rounded-md ${getStatusColor(order.status)}`}>
            {getEnhancedStatusText()}
        </Badge>
    )
}
