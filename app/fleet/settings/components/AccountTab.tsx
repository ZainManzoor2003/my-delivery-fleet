import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PersonalInformationTab from './PersonalInformationTab'
import PasswordChangeTab from './PasswordChangeTab'

export default function AccountTab() {
    return (
        <>
            <div className="space-y-2 px-4 pt-4">
                <h1 className="font-medium text-text-1 text-xl">Account</h1>
                <p className="text-text-2 font-normal text-lg"> Manage your personal and business information</p>
            </div>

            <Tabs defaultValue="personal-information" className="w-full py-0 gap-0">
                <TabsList className="bg-transparent rounded-none w-inherit justify-start px-4 h-auto py-0">
                    <TabsTrigger value="personal-information"
                        className="rounded-none px-1 py-2 text-sm text-text-2 font-medium
                        data-[state=active]:text-text-1
                        data-[state=active]:border-b-2
                        data-[state=active]:border-b-primary ">
                        Personal Information</TabsTrigger>
                    <TabsTrigger value="password"
                        className="rounded-none px-1 py-2 text-sm text-text-2 font-medium
                        data-[state=active]:text-text-1
                        data-[state=active]:border-b-2
                        data-[state=active]:border-b-primary ">
                        Password
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="personal-information">
                    <PersonalInformationTab />
                </TabsContent>

                <TabsContent value="password">
                    <PasswordChangeTab />
                </TabsContent>
            </Tabs>

        </>
    )
}
