"use client";

import { DataSources } from "@/components/dashboard";
import { useDashboard } from "@/components/dashboard/DashboardProvider";

export default function SourcesPage() {
  const {
    connections,
    wallets,
    connectExchange,
    disconnectExchange,
    connectWallet,
    disconnectWallet,
  } = useDashboard();

  return (
    <DataSources
      connections={connections}
      wallets={wallets}
      onConnectExchange={connectExchange}
      onDisconnectExchange={disconnectExchange}
      onConnectWallet={connectWallet}
      onDisconnectWallet={disconnectWallet}
    />
  );
}
