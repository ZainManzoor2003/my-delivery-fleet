'use client'
import TicketDetail from '../../components/ticketDetail'
import { Button } from '@/components/ui/button'
import { Loader } from '@/app/components/loader'
import { useGetTicket } from '@/app/hooks/useSupport';
import { useParams } from 'next/navigation';

export default function Page() {
    const params = useParams()
    const ticketId = params?.id as string
    const { data: ticketData, isLoading, error } = useGetTicket(ticketId);
    if (isLoading) {
        return (
            <Loader
                fullScreen
                label='Loading ticket details...'
            />
        );
    }

    if (error || !ticketData?.success || !ticketData?.ticket) {
        return (
            <div className="min-h-screen py-5 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">
                        {error?.message || 'Failed to load ticket details'}
                    </p>
                    <Button onClick={() => window.history.back()} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }


    return (
        <TicketDetail ticket={ticketData.ticket} />
    )
}
