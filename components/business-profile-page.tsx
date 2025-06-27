import { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BusinessInformation } from "./business-profile/business-information"
import { BrandIdentity } from "./business-profile/brand-identity"
import { RewardConfiguration } from "./business-profile/reward-configuration"
import { QRCodeManagement } from "./business-profile/qr-code-management"
import { BusinessOptions } from "./business-profile/business-options"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import type { BasePageProps } from "@/types/common"

// 2. TypeScript Interfaces
interface BusinessProfilePageProps extends BasePageProps {}

interface TabsState {
  activeTab: string
}

// 3. Main Component
export function BusinessProfilePage({ user_id, business_id }: BusinessProfilePageProps) {
  // SECTION 1: State and Data Fetching
  const [tabsState, setTabsState] = useState<TabsState>({ activeTab: "information" })
  const { toast } = useToast()

  // Event handlers
  const handleTabChange = useCallback((value: string) => {
    setTabsState({ activeTab: value })
  }, [])

  const handleBusinessUpdate = useCallback(() => {
    toast({
      title: "Success",
      description: "Business profile updated successfully.",
    })
  }, [toast])
  
  // SECTION 2: Main Render
  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Business Profile
      </h1>

      <Card className="p-6">
        <Tabs value={tabsState.activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="information">Business Information</TabsTrigger>
            <TabsTrigger value="brand">Brand Identity</TabsTrigger>
            <TabsTrigger value="rewards">Reward Configuration</TabsTrigger>
            <TabsTrigger value="qrcodes">QR Code Management</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="information">
            <BusinessInformation 
              userId={user_id} 
              onUpdate={handleBusinessUpdate}
            />
          </TabsContent>

          <TabsContent value="brand">
            <BrandIdentity 
              userId={user_id}
              businessId={business_id}
              onUpdate={handleBusinessUpdate}
            />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardConfiguration 
              userId={user_id}
              businessId={business_id}
              onUpdate={handleBusinessUpdate}
            />
          </TabsContent>

          <TabsContent value="qrcodes">
            <QRCodeManagement 
              userId={user_id}
              businessId={business_id}
              onUpdate={handleBusinessUpdate}
            />
          </TabsContent>

          <TabsContent value="options">
            <BusinessOptions 
              userId={user_id}
              businessId={business_id}
              onUpdate={handleBusinessUpdate}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}