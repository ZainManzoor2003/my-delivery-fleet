import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import InvoicesTab from './InvoicesTab';
import PaymentMethodTab from './PaymentMethodTab';

export default function BillingTab() {
    return (
        <>
            <div className="space-y-2 px-4 pt-4">
                <h1 className="font-medium text-text-1 text-xl">Billing</h1>
                <p className="text-text-2 font-normal text-lg">Manage your billing, payments and invoices</p>
            </div>

            <Tabs defaultValue="payment-method" className="w-full py-0 gap-0">
                <TabsList className="bg-transparent rounded-none w-inherit justify-start px-4 h-auto py-0">
                    <TabsTrigger value="payment-method"
                        className="rounded-none px-1 py-2 text-sm text-text-2 font-medium
                        data-[state=active]:text-text-1
                        data-[state=active]:border-b-2
                        data-[state=active]:border-b-primary ">
                        Payment Method
                    </TabsTrigger>
                    <TabsTrigger value="invoices"
                        className="rounded-none px-1 py-2 text-sm text-text-2 font-medium
                        data-[state=active]:text-text-1
                        data-[state=active]:border-b-2
                        data-[state=active]:border-b-primary ">
                        Invoices
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="payment-method" className='border-t border-border'>
                    <PaymentMethodTab />
                </TabsContent>

                <TabsContent value="invoices">
                    <InvoicesTab />
                </TabsContent>
            </Tabs>
        </>
    )
}
