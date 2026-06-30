"use client";

import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { newIdempotencyKey, trustedStripeNavigation } from "@/lib/client-security";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

type Cart = Record<string, number>;
export function ShopClient({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Cart>({}); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const total = useMemo(() => products.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0), [cart, products]);
  const count = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const change = (id: string, amount: number, stock: number) => setCart((current) => { const next = Math.max(0, Math.min(stock, (current[id] ?? 0) + amount)); const copy = { ...current, [id]: next }; if (!next) delete copy[id]; return copy; });
  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({ items }),
      });
      const body = await response.json().catch(() => null) as { url?: string; message?: string } | null;
      const destination = trustedStripeNavigation(body?.url);
      if (!response.ok || !destination) throw new Error(body?.message ?? "決済を開始できませんでした");
      window.location.assign(destination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "決済を開始できませんでした");
      setLoading(false);
    }
  }
  return <div className="grid gap-10 lg:grid-cols-[1fr_360px]"><div className="grid gap-6 sm:grid-cols-2">{products.map((product) => <article key={product.id} className="paper-card"><div className="grid aspect-[4/3] place-items-center rounded-2xl bg-gradient-to-br from-peach/30 to-pollen/30 text-8xl" aria-hidden="true">{product.emoji}</div><h2 className="mt-5 text-xl font-black">{product.name}</h2><p className="mt-2 min-h-14 text-sm leading-7 text-bark/70">{product.description}</p><div className="mt-5 flex items-center justify-between"><p className="text-xl font-black">{formatCurrency(product.price)}<span className="text-xs font-medium">（税込）</span></p>{cart[product.id] ? <Quantity value={cart[product.id]!} onMinus={() => change(product.id, -1, product.stock)} onPlus={() => change(product.id, 1, product.stock)}/> : <button className="button-primary min-h-10 px-4 py-2 text-sm" onClick={() => change(product.id, 1, product.stock)}>カートへ</button>}</div></article>)}</div><aside className="h-fit rounded-3xl bg-bark p-6 text-cream shadow-paper lg:sticky lg:top-28"><div className="flex items-center gap-3"><ShoppingBasket className="text-pollen"/><h2 className="text-xl font-black">カート <span className="text-sm text-cream/60">{count}点</span></h2></div>{count === 0 ? <p className="mt-8 text-sm leading-7 text-cream/65">商品を選ぶと、ここに入ります。</p> : <><ul className="mt-6 space-y-4">{products.filter((p) => cart[p.id]).map((p) => <li key={p.id} className="flex items-start justify-between gap-3 border-b border-cream/15 pb-4"><div><p className="font-bold">{p.name}</p><p className="mt-1 text-xs text-cream/60">{formatCurrency(p.price)} × {cart[p.id]}</p></div><button aria-label={`${p.name}を削除`} className="rounded-lg p-2 hover:bg-white/10" onClick={() => setCart((c) => { const copy = { ...c }; delete copy[p.id]; return copy; })}><Trash2 size={18}/></button></li>)}</ul><div className="mt-6 flex items-center justify-between"><span>合計</span><strong className="text-2xl text-pollen">{formatCurrency(total)}</strong></div>{error && <p className="mt-4 rounded-xl bg-red-950/40 p-3 text-sm" role="alert">{error}</p>}<button className="button-primary mt-6 w-full" disabled={loading} onClick={checkout}>{loading ? "決済画面を準備中…" : "購入手続きへ"}</button><p className="mt-4 text-xs leading-6 text-cream/55">決済はStripeの安全な画面で行います。送料は決済画面で表示されます。</p></>}</aside></div>;
}
function Quantity({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) { return <div className="flex items-center rounded-full border border-bark/20 bg-cream"><button className="grid h-10 w-10 place-items-center rounded-full hover:bg-peach" aria-label="数量を減らす" onClick={onMinus}><Minus size={16}/></button><span className="w-7 text-center font-bold" aria-live="polite">{value}</span><button className="grid h-10 w-10 place-items-center rounded-full hover:bg-peach" aria-label="数量を増やす" onClick={onPlus}><Plus size={16}/></button></div>; }
