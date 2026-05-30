"use client";

import { useState } from "react";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

const CHAINS = [
  { id: "ethereum", name: "Ethereum" },
  { id: "bsc", name: "BSC (BNB Chain)" },
  { id: "polygon", name: "Polygon" },
  { id: "arbitrum", name: "Arbitrum" },
  { id: "base", name: "Base" },
  { id: "optimism", name: "Optimism" },
  { id: "avalanche", name: "Avalanche C-Chain" },
  { id: "solana", name: "Solana" },
];

const EyeIcon = (
  <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface Props {
  onConnect: (data: { address: string; chain: string; label: string }) => Promise<void>;
  onCancel: () => void;
}

export function AddWalletForm({ onConnect, onCancel }: Props) {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const isSolana = chain === "solana";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = address.trim();
    const valid = isSolana
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)
      : /^0x[0-9a-fA-F]{40}$/.test(trimmed);

    if (!valid) {
      setError(isSolana ? "Invalid Solana address" : "Invalid EVM address");
      return;
    }

    setConnecting(true);

    try {
      await onConnect({ address: trimmed, chain, label });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add wallet");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-5 space-y-4">
      <Field label="Wallet address">
        <Input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder={isSolana ? "Base58 address…" : "0x…"}
          className="font-mono"
        />
      </Field>

      <Field label="Chain">
        <Select value={chain} onChange={(e) => setChain(e.target.value)}>
          {CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Label" hint="(optional)">
        <Input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Main wallet, DeFi wallet"
        />
      </Field>

      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
        {EyeIcon}
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="text-gray-700 font-medium">Read-only:</span> We only read public on-chain
          balances. No private keys required.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={connecting}>
          {connecting ? "Adding…" : "Add wallet"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
