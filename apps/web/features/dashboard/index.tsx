"use client";

import { ApiPerformancePanel } from "./components/api-performance-panel";
import { AssetValueChart } from "./components/asset-value-chart";
import { DashboardHeader } from "./components/dashboard-header";
import { DashboardStats } from "./components/dashboard-stats";
import { LatestTransactions } from "./components/latest-transactions";
import { PortfolioDistribution } from "./components/portfolio-distribution";
import { RecentAssets } from "./components/recent-assets";
import { TokenizationQueuePanel } from "./components/tokenization-queue-panel";
import { WorkspaceHealth } from "./components/workspace-health";
import { useDashboard } from "./hooks/use-dashboard";

export function DashboardPage() {
  const { data } = useDashboard();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <DashboardHeader orgName={data.orgName} />

      {/* Stats row */}
      <DashboardStats stats={data.stats} />

      {/* Main two-column grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Latest Stellar Transactions */}
          <LatestTransactions transactions={data.transactions} />

          {/* API Performance + Recent API Calls */}
          <ApiPerformancePanel
            bars={data.apiPerformanceBars}
            recentApiCalls={data.recentApiCalls}
            avgLatency={data.apiAvgLatency}
          />

          {/* Asset Value Chart */}
          <AssetValueChart data={data.assetValueOverTime} />

          {/* Recent Assets table */}
          <RecentAssets assets={data.recentAssets} />
        </div>

        {/* Right sidebar column */}
        <div className="flex flex-col gap-6">
          {/* Tokenization Queue */}
          <TokenizationQueuePanel items={data.tokenizationQueue} />

          {/* Portfolio Distribution */}
          <PortfolioDistribution distribution={data.portfolioDistribution} />

          {/* Workspace Health */}
          <WorkspaceHealth workspaceHealth={data.workspaceHealth} />
        </div>
      </div>
    </div>
  );
}
