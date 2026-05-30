"use client";

import { McpSection } from "@/components/dashboard";
import { useDashboard } from "@/components/dashboard/DashboardProvider";

export default function McpPage() {
  const { mcpTokens, hasExchanges, generateToken, revokeToken } = useDashboard();

  return (
    <McpSection
      tokens={mcpTokens}
      hasConnections={hasExchanges}
      onGenerateToken={generateToken}
      onRevokeToken={revokeToken}
    />
  );
}
