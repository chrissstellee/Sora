"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";

import { TABS } from "../constants/asset-details";
import { ActivityTab } from "./tabs/activity-tab";
import { DocumentsTab } from "./tabs/documents-tab";
import { OwnershipTab } from "./tabs/ownership-tab";
import { TokenizationTab } from "./tabs/tokenization-tab";

import type { IAsset } from "../../asset-list/lib/types";

interface AssetDetailsTabsProps {
  asset: IAsset;
}

export function AssetDetailsTabs({ asset }: AssetDetailsTabsProps) {
  return (
    <Tabs defaultValue="documents">
      <TabsList variant="line" className="w-full justify-start border-b border-border pb-0">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="pt-6">
        <TabsContent value="documents">
          <DocumentsTab asset={asset} />
        </TabsContent>
        <TabsContent value="tokenization">
          <TokenizationTab asset={asset} />
        </TabsContent>
        <TabsContent value="ownership">
          <OwnershipTab asset={asset} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab asset={asset} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
