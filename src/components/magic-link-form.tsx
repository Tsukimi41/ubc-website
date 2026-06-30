"use client";

import { useState, type FormEvent } from "react";

export function MagicLinkForm() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const email = String(new FormData(event.currentTarget).get("email"));
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(body?.message ?? (response.ok ? "ログインリンクを確認してください。" : "現在送信できません。"));
    } catch {
      setMessage("通信できませんでした。時間をおいてお試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7">
      <label className="form-label" htmlFor="salon-email">メールアドレス</label>
      <input className="form-input" id="salon-email" name="email" type="email" required autoComplete="email" maxLength={254}/>
      <button className="button-primary mt-4 w-full" disabled={loading}>{loading ? "送信中…" : "ログインリンクを受け取る"}</button>
      {message && <p className="mt-4 rounded-xl bg-peach/30 p-4 text-sm leading-6" role="status">{message}</p>}
    </form>
  );
}
