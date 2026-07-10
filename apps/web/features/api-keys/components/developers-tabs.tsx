"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";

import { TABS } from "../constants/api-keys";
import { ApiKeysTab } from "./tabs/api-keys-tab";
import { ApiReferenceTab } from "./tabs/api-reference-tab";
// import { SdksTab } from "./tabs/sdks-tab";
import { WebhooksTab } from "./tabs/webhooks-tab";

export function DevelopersTabs() {
  return (
    <Tabs defaultValue="api-keys">
      <TabsList variant="line" className="w-full justify-start border-b border-border pb-0">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="pt-6">
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="api-reference">
          <ApiReferenceTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>
        {/* <TabsContent value="sdks">
          <SdksTab />
        </TabsContent> */}
      </div>
    </Tabs>
  );
}
