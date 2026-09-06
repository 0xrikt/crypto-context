"use client";

import { useState } from "react";
import type { Connection, Wallet } from "./types";
import { ConnectExchangeForm } from "./ConnectExchangeForm";
import { AddWalletForm, type WalletInput } from "./AddWalletForm";
import { Button, Card, EmptyState, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/timeAgo";
import { getExchangeBrand, getChainBrand, getWalletBrand } from "@/lib/wallets/brands";
import { BrandLogo } from "@/components/icons/BrandLogo";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium px-1.5 py-0.5 flex-shrink-0">
      {children}
    </span>
  );
}

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
      <span className="text-xs text-emerald-600">Connected</span>
    </span>
  );
}

/**
 * One card per brand+address: "a MetaMask account", not "7 chain rows".
 * The chains stay visible as logo chips — they're the underlying truth.
 */
interface WalletGroup {
  key: string;
  brand: string | null;
  address: string;
  label: string;
  rows: Wallet[];
}

function groupWallets(wallets: Wallet[]): WalletGroup[] {
  const groups = new Map<string, WalletGroup>();
  for (const w of wallets) {
    const key = `${w.brand ?? ""}|${w.address.toLowerCase()}`;
    const group = groups.get(key) ?? {
      key,
      brand: w.brand ?? null,
      address: w.address,
      label: w.label,
      rows: [],
    };
    group.rows.push(w);
    if (!group.label && w.label) group.label = w.label;
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

interface Props {
  connections: Connection[];
  wallets: Wallet[];
  onConnectExchange: (data: { exchange: string; apiKey: string; secret: string; password?: string }) => Promise<void>;
  onDisconnectExchange: (id: string) => void;
  onConnectWallets: (items: WalletInput[]) => Promise<void>;
  onDisconnectWalletGroup: (ids: string[]) => void;
}

export function DataSources({
  connections, wallets,
  onConnectExchange, onDisconnectExchange,
  onConnectWallets, onDisconnectWalletGroup,
}: Props) {
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);

  const walletGroups = groupWallets(wallets);

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
            {connections.map((c) => {
              const style = getExchangeBrand(c.exchange);
              return (
              <Card
                key={c.id}
                className="p-4 flex items-center justify-between group transition hover:border-gray-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BrandLogo id={c.exchange} size={36} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">{style.name}</span>
                      <ActiveDot />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {c.label} &middot; {formatDate(c.created_at)}
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
              );
            })}
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
              onConnect={async (items) => {
                await onConnectWallets(items);
                setShowWalletForm(false);
              }}
              onCancel={() => setShowWalletForm(false)}
            />
          </div>
        )}

        {walletGroups.length === 0 && !showWalletForm ? (
          <EmptyState
            compact
            icon={WalletIcon}
            title="No wallets tracked"
            description="Add your wallet — MetaMask, Phantom, or any address — to fold on-chain balances into your context."
          />
        ) : walletGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {walletGroups.map((g) => {
              const brandStyle = getWalletBrand(g.brand);
              const shortAddr = `${g.address.slice(0, 6)}…${g.address.slice(-4)}`;
              // Identity priority: user label → wallet-app brand → the address.
              const name = (g.label && g.label.trim()) || brandStyle?.name || null;
              const logoId = g.brand ?? g.rows[0].chain;
              return (
              <Card
                key={g.key}
                className="p-4 flex items-center justify-between group transition hover:border-gray-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BrandLogo id={logoId} size={36} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium text-sm text-gray-900 truncate", !name && "font-mono")}>
                        {name ?? shortAddr}
                      </span>
                      <ActiveDot />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 min-w-0 flex-wrap">
                      {g.rows.map((w) => (
                        <Chip key={w.id}>
                          <BrandLogo id={w.chain} size={12} rounded={false} className="rounded-[3px]" />
                          {getChainBrand(w.chain).name}
                        </Chip>
                      ))}
                      {name && (
                        <span className="text-xs text-gray-400 font-mono truncate">{shortAddr}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDisconnectWalletGroup(g.rows.map((w) => w.id))}
                  className="text-xs text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  Remove
                </button>
              </Card>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
