"use client";

import * as React from "react";

import { publicStellarConfig } from "@/core/config/env";

import type { IIssuanceQueueEntry, IIssuanceSnapshot, ITokenizationStats } from "../lib/types";

interface ReadyResponse {
  items: Array<{
    assetId: string;
    name: string;
    category: string;
    estimatedValue: string;
    currency: string;
    countryCode: string;
    assetVersion: number;
    profile: { assetCode: string; supply: string; internalReference: string };
  }>;
}

export function useTokenizationQueue() {
  const [entries, setEntries] = React.useState<IIssuanceQueueEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [readyResponse, issuanceResponse] = await Promise.all([
        fetch("/api/tokenization/ready?limit=100", { cache: "no-store" }),
        fetch("/api/issuances", { cache: "no-store" }),
      ]);
      if (!readyResponse.ok || !issuanceResponse.ok) throw new Error("Queue data is unavailable.");
      const ready = (await readyResponse.json()) as ReadyResponse;
      const { issuances } = (await issuanceResponse.json()) as { issuances: IIssuanceSnapshot[] };
      const readyEntries: IIssuanceQueueEntry[] = ready.items.map((item) => ({
        id: item.assetId,
        name: item.name,
        assetId: item.assetId,
        assetVersion: item.assetVersion,
        category: item.category,
        countryCode: item.countryCode,
        value: Number(item.estimatedValue) / 1_000_000,
        currency: item.currency,
        code: item.profile.assetCode,
        supply: item.profile.supply,
        status: "Ready",
        network: publicStellarConfig.uiLabel,
        internalReference: item.profile.internalReference,
      }));
      const issuanceEntries: IIssuanceQueueEntry[] = issuances.map((issuance) => ({
        id: issuance.issuanceId,
        name: issuance.assetName,
        assetId: issuance.assetId,
        assetVersion: issuance.assetVersion,
        category: issuance.category,
        countryCode: issuance.countryCode,
        value: Number(issuance.estimatedValue) / 1_000_000,
        currency: issuance.currency,
        code: issuance.assetCode,
        supply: issuance.supply,
        status: issuance.status,
        network: publicStellarConfig.uiLabel,
        internalReference: issuance.internalReference,
        issuance,
      }));
      const activeAssetIds = new Set(issuanceEntries.map((entry) => entry.assetId));
      setEntries([
        ...issuanceEntries,
        ...readyEntries.filter((entry) => !activeAssetIds.has(entry.assetId)),
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Queue data is unavailable.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const stats: ITokenizationStats = {
    readyForTokenization: entries.filter((entry) => entry.status === "Ready").length,
    readyEstimatedValueLabel: "Persisted Ready assets",
    confirmedAssets: entries.filter((entry) => entry.status === "Confirmed").length,
    queueStockLabel: "Durable issuance records",
    issuedToday: entries.filter(
      (entry) => entry.issuance?.paymentProof && entry.status === "Confirmed",
    ).length,
    txVolumeLabel: "Testnet confirmations",
    failedIssuance: entries.filter((entry) => entry.status === "Failed").length,
    failedCaption: "Terminal preflight failures",
  };

  return { entries, stats, isLoading, error, refetch: load };
}
