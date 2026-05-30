"use client";

import { useState } from "react";
import type { Connection, Wallet } from "./types";
import { ConnectExchangeForm } from "./ConnectExchangeForm";
import { AddWalletForm } from "./AddWalletForm";
import { Button, Card, EmptyState, SectionHeader } from "@/components/ui";

const EXCHANGE_ICONS: Record<string, string> = {
  binance: "BN", okx: "OK", bybit: "BY", coinbase: "CB", kraken: "KR",
  bitget: "BG", kucoin: "KC", gateio: "GT", htx: "HT", mexc: "MX",
  cryptocom: "CR", bingx: "BX", bitfinex: "BF", gemini: "GE", bitstamp: "BS", upbit: "UP",
};

const PlusIcon = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const LinkIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25a4.5 4.5 0 006.364 6.364l2.382-2.382" />
  </svg>
);

const WalletIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

function ActiveDot() {
  return (
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="text-xs text-emerald-600">Active</span>
    </span>
  );
}

interface Props {
  connections: Connection[];
  wallets: Wallet[];
  onConnectExchange: (data: { exchange: string; apiKey: string; secret: string; password?: string }) => Promise<void>;
  onDisconnectExchange: (id: string) => void;
  onConnectWallet: (data: { address: string; chain: string; label: string }) => Promise<void>;
  onDisconnectWallet: (id: string) => void;
}

export function DataSources({
  connections, wallets,
  onConnectExchange, onDisconnectExchange,
  onConnectWallet, onDisconnectWallet,
}: Props) {
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);

  return (
    <section>
      <SectionHeader title="Data Sources" description="Exchanges and wallets feeding your context" />

      {/* Exchanges */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Exchanges</h3>
          {!showExchangeForm && (
            <Button size="sm" leftIcon={PlusIcon} onClick={() => setShowExchangeForm(true)}>
              Connect
            </Button>
          )}
        </div>

        {showExchangeForm && (
          <div className="mb-3">
            <ConnectExchangeForm
              onConnect={async (data) => {
                await onConnectExchange(data);
                setShowExchangeForm(false);
              }}
              onCancel={() => setShowExchangeForm(false)}
            />
          </div>
        )}

        {connections.length === 0 && !showExchangeForm ? (
          <EmptyState
            compact
            icon={LinkIcon}
            title="No exchanges connected"
            description="Connect a read-only API key to pull balances and trade history."
          />
        ) : connections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {connections.map((c) => (
              <Card
                key={c.id}
                className="p-4 flex items-center justify-between group transition hover:border-gray-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
                    {EXCHANGE_ICONS[c.exchange] ?? c.exchange[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize text-sm text-gray-900">{c.exchange}</span>
                      <ActiveDot />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {c.label} &middot; {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDisconnectExchange(c.id)}
                  className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  Disconnect
                </button>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {/* Wallets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500">Wallets</h3>
          {!showWalletForm && (
            <Button size="sm" leftIcon={PlusIcon} onClick={() => setShowWalletForm(true)}>
              Add wallet
            </Button>
          )}
        </div>

        {showWalletForm && (
          <div className="mb-3">
            <AddWalletForm
              onConnect={async (data) => {
                await onConnectWallet(data);
                setShowWalletForm(false);
              }}
              onCancel={() => setShowWalletForm(false)}
            />
          </div>
        )}

        {wallets.length === 0 && !showWalletForm ? (
          <EmptyState
            compact
            icon={WalletIcon}
            title="No wallets tracked"
            description="Add an EVM address to fold on-chain balances into your context."
          />
        ) : wallets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {wallets.map((w) => (
              <Card
                key={w.id}
                className="p-4 flex items-center justify-between group transition hover:border-gray-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs flex-shrink-0">
                    {w.chain.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 font-mono">
                        {w.address.slice(0, 6)}...{w.address.slice(-4)}
                      </span>
                      <ActiveDot />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      <span className="capitalize">{w.chain}</span>
                      {w.label && <> &middot; {w.label}</>} &middot;{" "}
                      {new Date(w.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDisconnectWallet(w.id)}
                  className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  Remove
                </button>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
