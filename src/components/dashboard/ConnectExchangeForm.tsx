"use client";

import { useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { EXCHANGE_OPTIONS } from "@/lib/exchange-names";
import { BrandLogo } from "@/components/icons/BrandLogo";
import { cn } from "@/lib/cn";

const EXCHANGES = EXCHANGE_OPTIONS;

const PASSPHRASE_EXCHANGES = ["okx", "bitget", "kucoin"];

const ShieldIcon = (
  <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

interface Props {
  onConnect: (data: {
    exchange: string;
    apiKey: string;
    secret: string;
    password?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ConnectExchangeForm({ onConnect, onCancel }: Props) {
  const [exchange, setExchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const needsPassphrase = PASSPHRASE_EXCHANGES.includes(exchange);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConnecting(true);

    try {
      await onConnect({
        exchange,
        apiKey,
        secret,
        password: needsPassphrase ? passphrase : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-5 space-y-4">
      <Field label="Exchange">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {EXCHANGES.map((ex) => {
            const selected = exchange === ex.id;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setExchange(ex.id)}
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition",
                  selected
                    ? "border-emerald-500/70 bg-emerald-50/70 text-gray-900 ring-1 ring-emerald-500/30"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
                )}
              >
                <BrandLogo id={ex.id} size={22} />
                <span className="truncate">{ex.name}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="API Key" hint="(read-only)">
        <Input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          autoComplete="off"
          placeholder="Your read-only API key"
        />
      </Field>

      <Field label="API Secret">
        <Input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="Your API secret"
        />
      </Field>

      {needsPassphrase && (
        <Field
          label="Passphrase"
          hint="— the API passphrase you set when creating the key, not your login password"
        >
          <Input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
            placeholder={`${exchange.toUpperCase()} API passphrase`}
          />
        </Field>
      )}

      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
        {ShieldIcon}
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="text-gray-700 font-medium">Security:</span> Only provide a read-only API
          key. Disable trading and withdrawals at your exchange. We verify balance access; this does not verify that other permissions are disabled.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={connecting}>
          {connecting ? "Verifying…" : "Connect"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
