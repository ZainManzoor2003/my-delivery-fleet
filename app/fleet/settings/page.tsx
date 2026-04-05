
'use client'
import { SidebarTrigger } from "@/components/ui/sidebar";
import AccountTab from "./components/AccountTab";
import BusinessTab from "./components/BusinessTab";
import BillingTab from "./components/BillingTab";
import { useState } from "react";
import { SettingTab } from "@/lib/enums/settingTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore } from "@/app/stores/userStore";
import { Role } from "@/lib/enums/role";

export default function FleetSettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingTab>(SettingTab.ACCOUNT);
    const { role } = useUserStore()

    return (
        <div>
            <div className='flex flex-wrap  items-center justify-between px-4 py-5 gap-2'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='xl:hidden' />
                    <span className='font-medium text-md text-text-sidebar'>Settings</span>
                </div>
            </div>
            <div className='px-4 py-4'>
                <div className="flex border border-border rounded-[20px] h-[calc(100vh-100px)] bg-background">
                    <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as SettingTab)} className="w-full xl:flex-row py-0 gap-0">
                        <TabsList className="flex-col bg-transparent border-b border-l-0 xl:border-b-0 border-t-0 xl:border-r  
                        min-w-full rounded-none xl:min-w-54 justify-start items-start h-auto px-2 py-4 gap-2">
                            <TabsTrigger value={SettingTab.ACCOUNT}
                                className="rounded-xl flex-0 h-10 px-2 py-2 w-full justify-start text-start text-sm text-text-2 font-normal
                                data-[state=active]:text-text-1
                                data-[state=active]:bg-[#F1F5F9]
                                data-[state=active]:font-medium">
                                Account
                            </TabsTrigger>
                            {role && role !== Role.ADMIN && (
                                <>
                                    <TabsTrigger value={SettingTab.BUSINESS}
                                        className="rounded-xl flex-0 h-10 px-2 py-2 w-full justify-start text-start text-sm text-text-2 font-normal
                                data-[state=active]:text-text-1
                                data-[state=active]:bg-[#F1F5F9]
                                data-[state=active]:font-medium">
                                        Business
                                    </TabsTrigger>
                                    <TabsTrigger value={SettingTab.BILLING_AND_INVOICES}
                                        className="rounded-xl flex-0 h-10 px-2 py-2 w-full justify-start text-start text-sm text-text-2 font-normal
                                        data-[state=active]:text-text-1
                                data-[state=active]:bg-[#F1F5F9]
                                data-[state=active]:font-medium">
                                        Billing & Invoices
                                    </TabsTrigger>
                                    <TabsTrigger value={SettingTab.INTEGRATIONS}
                                        className="rounded-xl flex-0 h-10 px-2 py-2 w-full justify-start text-start text-sm text-text-2 font-normal
                            data-[state=active]:text-text-1
                            data-[state=active]:bg-[#F1F5F9]
                            data-[state=active]:font-medium">
                                        Integrations
                                    </TabsTrigger>
                                    <TabsTrigger value={SettingTab.NOTIFICATIONS}
                                        className="rounded-xl flex-0 h-10 px-2 py-2 w-full justify-start text-start text-sm text-text-2 font-normal
                                data-[state=active]:text-text-1
                                data-[state=active]:bg-[#F1F5F9]
                                data-[state=active]:font-medium">
                                        Notifications
                                    </TabsTrigger>
                                </>
                            )
                            }
                        </TabsList>
                        <div className="flex flex-col w-full" >
                            <TabsContent value={SettingTab.ACCOUNT} className="w-full h-full space-y-4">
                                <AccountTab />
                            </TabsContent>
                            <TabsContent value={SettingTab.BUSINESS} className="w-full h-full space-y-4 overflow-y-auto">
                                <BusinessTab />
                            </TabsContent>
                            <TabsContent value={SettingTab.BILLING_AND_INVOICES} className="w-full h-full space-y-4 overflow-y-auto">
                                <BillingTab />
                            </TabsContent>
                        </div>

                    </Tabs>
                </div>
            </div>
        </div>
    )
}
