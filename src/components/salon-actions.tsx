"use client";

import { useState } from "react";
import { newIdempotencyKey, trustedStripeNavigation } from "@/lib/client-security";

const ALLOWED_ENDPOINTS = new Set(["/api/salon/checkout", "/api/salon/portal"]);

export function SalonActions({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function go(endpoint: string) {
    if (!ALLOWED_ENDPOINTS.has(endpoint)) {
      setError("安全でない操作を拒否しました。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "X-Idempotency-Key": newIdempotencyKey() },
      });
      const body = await response.json().catch(() => null) as { url?: string; message?: string } | null;
      const destination = trustedStripeNavigation(body?.url);
      if (!response.ok || !destination) throw new Error(body?.message ?? "処理できませんでした");
      window.location.assign(destination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "処理できませんでした");
      setLoading(false);
    }
  }

  return (
    <div className="mt-7">
      {active ? (
        <div className="flex flex-wrap gap-3">
          <a href="/salon/gallery" className="button-primary">会員ギャラリーを見る</a>
          <button className="button-secondary" onClick={() => go("/api/salon/portal")} disabled={loading}>支払いを管理</button>
        </div>
      ) : (
        <button className="button-primary w-full" onClick={() => go("/api/salon/checkout")} disabled={loading}>{loading ? "準備中…" : "月額88円で支援する"}</button>
      )}
      {error && <p className="mt-4 text-sm font-bold text-red-800" role="alert">{error}</p>}
    </div>
  );
}
