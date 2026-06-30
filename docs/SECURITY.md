# Urban Bee Club Webサイト セキュリティ設計・運用ガイド

最終更新: 2026-06-30  
対象: 現在のワーキングツリー  
関連文書: [`IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md)、[`SRS.md`](./SRS.md)

## 1. セキュリティ方針

本システムは、次の原則で設計します。

1. **Fail closed**: 認証、共有レート制限、DB、鍵、許可Originなどのセキュリティ設定が欠ける本番リクエストは、機能を縮退して通すのではなく503または404で拒否する。
2. **最小権限**: ブラウザはSupabaseの管理用列を読めず、service roleはサーバー以外へ渡さない。
3. **多層防御**: 入力検証だけに依存せず、本文サイズ制限、Origin、Fetch Metadata、HMAC、RLS、列権限、署名検証、冪等性、CSPを重ねる。
4. **秘密情報をコードへ置かない**: 鍵、token、許可Origin、外部ホスト、Stripe環境は環境変数または外部サービスで管理する。
5. **個人情報を増やさない**: レート制限には生IPではなくHMAC値を保存し、Stripe Webhookの生payloadをDBへ保存しない。
6. **曖昧な成功を返さない**: 本番の問い合わせ保存先がない場合や、購入結果をStripeで検証できない場合は成功扱いにしない。
7. **再送を前提にする**: StripeとIoTのリクエストは重複し得るものとして、DBで冪等性を保証する。

この文書と実装は「絶対に脆弱性が存在しない」ことを保証するものではありません。公開前・大規模変更後には、別担当者によるレビュー、外部サービスを含むE2E、DAST、必要に応じた第三者診断が必要です。

## 2. 保護対象と信頼境界

### 2.1 保護対象

| 分類 | 例 | 重要度 |
|---|---|---|
| Secret | Supabase service role、Stripe Secret/Webhook Secret、IoT device secret、HMAC secret | Critical |
| 認証情報 | SupabaseセッションCookie、Magic Link code | High |
| 個人情報 | 問い合わせ氏名・メール・所属・本文、注文メール | High |
| 会員権限 | Membership状態、会員Gallery、割引コード | High |
| 決済整合性 | Stripe Price、支払状態、注文、購読状態 | High |
| IoT整合性 | 巣箱ID、観測値、記録時刻 | Medium〜High |
| 公開コンテンツ | Notion/Tumblr本文・外部URL・画像 | Medium |
| 可用性 | 公開ページ、フォーム、Dashboard | Medium |

### 2.2 信頼境界

- ブラウザ入力は常に不信とする。
- Notion/TumblrのAPI応答も、アカウント侵害や想定外形式を考慮して不信とする。
- Stripeイベントは、署名・Live/Test mode・application metadata・Price・DB対応関係を全て確認して初めて信頼する。
- IoTセンサーは、端末ごとのHMAC署名と巣箱割当を確認して初めて信頼する。
- `X-Forwarded-For` は、明示した信頼プロキシから来る場合だけ使用する。
- 環境変数は運用者が管理する信頼設定だが、形式、長さ、HTTPS、許可ホストをコードでも検証する。

## 3. 実装済み防御

### 3.1 ブラウザ・HTTP

- リクエストごとに暗号学的nonceを生成するCSP
- `script-src` から `unsafe-inline` を除去し、`strict-dynamic` とnonceを使用
- nonce付きHTMLを `private, no-store` とし、CSPとHTMLのキャッシュ不整合を防止
- HSTS、`nosniff`、`DENY`、COOP、CORP、Referrer Policy、Permissions Policy
- 本番ブラウザSource Mapを無効化
- 外部画像は `CMS_IMAGE_HOSTS` によるHTTPSホスト許可制
- SVGの画像最適化を無効化し、画像応答をattachment・sandbox CSPで保護
- Secret画面はFeature Flag無効時に404、`noindex`、サイトマップ除外

nonceにより全HTMLページは動的レンダリングです。CDNのHTMLキャッシュを使わない代わりに、スクリプト注入耐性を優先しています。CMS・Dashboardデータ自体のサーバーキャッシュは維持します。

### 3.2 CSRF・リクエスト偽装

ブラウザから状態を変更する全APIで、次を確認します。

- `Sec-Fetch-Site` が `same-origin` または `none`
- `Origin` が `NEXT_PUBLIC_SITE_URL` または `ALLOWED_ORIGINS` と完全一致
- `Host` や任意の `X-Forwarded-Host` を許可基準として使用しない
- Origin設定不備の本番環境は503でfail closed
- Stripe/Salon操作はブラウザ生成UUIDによる冪等キーを要求

対象はContact、Magic Link、Sign out、Shop Checkout、Salon Checkout、Billing Portalです。Stripe WebhookはStripe署名、IoTはHMAC署名で別に保護します。

### 3.3 入力・リソース制限

| Endpoint | 最大本文 | 主な追加制限 |
|---|---:|---|
| Contact | 16 KiB | strict Zod schema、文字数、種別、同意、honeypot |
| Magic Link | 1 KiB | Email形式・長さ、IPとEmailの二重制限 |
| Shop Checkout | 16 KiB | strict schema、商品・数量・Price ID再検証 |
| IoT | 8 KiB | strict schema、数値範囲、時刻範囲、巣箱割当 |
| Stripe Webhook | 512 KiB | raw body、署名、イベント種別・環境・metadata |
| CMS response | 1 MiB | timeout、redirect拒否、件数・文字数・URL制限 |

Content-LengthだけでなくReadableStreamを実測し、chunked requestも上限超過時に中断します。JSON APIは `application/json` 以外を415で拒否します。

### 3.4 分散レート制限

本番はSupabase PostgreSQLの `consume_rate_limit` 関数で、全Serverless instance共通の原子的カウンターを使用します。

- 生IPやメールは保存しない。
- `RATE_LIMIT_HMAC_SECRET` によるHMAC-SHA-256をbucket keyとして保存する。
- DBまたは秘密鍵が利用できない本番環境は503で拒否する。
- `RATE_LIMIT_BACKEND=memory` はローカル開発だけで有効。本番では拒否する。
- Vercelでは `x-vercel-forwarded-for` を使用。他のProxyは `TRUSTED_PROXY_IP_HEADER` で明示する。

目安の制限:

| Scope | Limit |
|---|---:|
| Contact IP | 5回/時 |
| Magic Link IP | 5回/時 |
| Magic Link Email | 3回/時 |
| Shop Checkout IP | 10回/時 |
| Salon Checkout IP | 10回/時 |
| Salon Checkout User | 5回/時 |
| Billing Portal User | 10回/時 |
| IoT IP | 300回/分 |
| IoT device key | 240回/分 |

### 3.5 Supabase・RLS

- 公開schemaの全業務テーブルでRLSを有効化
- `anon` に直接のテーブル権限を与えない
- `authenticated` は自分のMembership状態と有効な割引表示列だけを参照可能
- Stripe customer/subscription/promotion IDはservice role専用
- Service roleはブラウザBundleへ含めない
- Rate limitとWebhook冪等テーブルはservice roleだけが操作
- RLS Policyは `auth.uid() is not null` を明示
- Security functionは固定 `search_path`、`security invoker`、service roleだけにexecute許可

### 3.6 Stripe

- Webhook raw bodyをStripe Signing Secretで検証
- Stripe既定の署名timestamp toleranceを使用
- `STRIPE_EXPECT_LIVE_MODE` とeventの `livemode` を照合
- `STRIPE_METADATA_APP_ID` と `purpose` で同じStripe account内の他アプリを分離
- Shop/SalonそれぞれのFeature FlagをWebhookでも再確認
- Salon Price、Shop Price、Subscription metadata、Supabase Userを再検証
- Stripe event IDをDBでclaimし、成功・失敗・再試行状態を管理
- 古いSubscription eventで新しい会員状態を上書きしない
- Checkout/Billing Portal作成にStripe idempotency keyを使用
- Shop完了画面は `session_id` をStripeへ問い合わせ、paid・application・purposeを検証
- 会員失効時はPromotion Codeを無効化し、復帰時だけ再有効化
- 割引コードはUser IDとHMAC secretから安定的かつ推測困難に導出
- Webhook payload本体はDBへ保存しない

### 3.7 IoT

旧Bearer token方式は廃止しました。端末ごとに独立したHMAC secretと固定hive IDを割り当てます。

必須Header:

```http
X-UBC-Key-Id: sensor-a
X-UBC-Timestamp: 1782772800
X-UBC-Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
X-UBC-Signature: v1=<64文字の小文字hex HMAC-SHA-256>
Content-Type: application/json
```

署名対象は、区切りをLFに固定した次のbyte列です。

```text
<timestamp>\n<idempotency-key>\n<送信するJSONの生byte列>
```

Node.jsでの署名例:

```js
import { createHmac, randomUUID } from "node:crypto";

const timestamp = Math.floor(Date.now() / 1000).toString();
const idempotencyKey = randomUUID();
const rawBody = JSON.stringify(reading);
const signature = createHmac("sha256", process.env.UBC_DEVICE_SECRET)
  .update(`${timestamp}\n${idempotencyKey}\n${rawBody}`, "utf8")
  .digest("hex");
```

サーバー側は次を検証します。

1. Key IDが `IOT_INGEST_KEYS` に存在する。
2. HMACが定時間比較で一致する。
3. Timestampが既定±300秒以内である。
4. Headerのidempotency keyがUUIDである。
5. JSONの `hiveId` がKeyに割り当てたhive IDと一致する。
6. `recordedAt` が未来5分以内、既定7日以内の過去である。
7. `ingestion_id` のDB unique indexで再送を一度だけ保存する。

同じ端末の鍵をローテーションする場合、先に新しいKey IDを追加し、端末を切り替え、旧Key IDを削除します。同一Key IDのsecretを即時置換すると、更新前の端末が停止するため避けます。

### 3.8 CMSと外部URL

- Notion/Tumblr API endpoint自体はコードで固定
- redirectを拒否し、6秒timeoutと1 MiB応答上限を設定
- 件数・文字列長・日付を正規化
- 本文はReactのtextとして表示し、HTMLとして挿入しない
- 外部リンクはHTTPSかつ明示ホストだけ許可
- 外部画像も別の明示ホスト一覧を使用
- 設定がない外部URLはリンク・画像ごと省略
- API障害時はデモ表示へ切り替え、Secretや例外内容を利用者へ返さない

## 4. 必須環境変数と生成

完全な一覧は `.env.example` を正とします。次の値は本番で特に重要です。

| 変数 | 要件 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | HTTPS originのみ。path/query/fragment禁止 |
| `RATE_LIMIT_BACKEND` | 本番は `database` |
| `RATE_LIMIT_HMAC_SECRET` | 32 random bytes以上 |
| `IOT_INGEST_KEYS` | deviceごとに別secret、固定hive UUID |
| `STRIPE_EXPECT_LIVE_MODE` | Testはfalse、Productionはtrue |
| `STRIPE_METADATA_APP_ID` | 8〜64文字の固有namespace |
| `DISCOUNT_CODE_HMAC_SECRET` | 32 random bytes以上 |
| `CONTACT_WEBHOOK_ALLOWED_HOSTS` | Webhook利用時に必須 |
| `CMS_IMAGE_HOSTS` | 画像を出すホストだけを列挙 |

PowerShellで48 random bytesをBase64生成する例:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

生成値を次で使い回してはいけません。

- Rate limit用HMAC
- Discount code用HMAC
- IoT端末ごとのsecret
- Stripe/Supabaseが発行したSecret

PreviewとProductionでも値を分離します。秘密情報を `NEXT_PUBLIC_` 変数へ入れてはいけません。

## 5. DB migration

### 5.1 新規環境

Supabase CLIまたはSQL Editorで、番号順に適用します。

1. `001_initial_schema.sql`
2. `002_security_hardening.sql`

### 5.2 既存環境

既に001を適用済みの場合は、バックアップ後に002を適用します。002は次を追加・変更します。

- IoT `ingestion_id`
- Discount active状態
- Stripe event時刻
- Rate limit bucket
- Stripe Webhook event状態
- RLS Policyの認証明示
- authenticatedの列権限縮小
- 長さ・形式のDB制約
- 原子的な `consume_rate_limit`

適用後は、anon keyを使った直接RESTアクセスで管理列が読めないこと、service role経由のAPIだけが書き込めることをPreviewで確認します。

## 6. デプロイ順序

1. DBをバックアップする。
2. 002 migrationを適用する。
3. 新しいSecretを生成してVercel Previewへ登録する。
4. `RATE_LIMIT_BACKEND=database` を設定する。
5. CMS link/image hostを最小限で設定する。
6. IoT端末をHMAC Header方式へ更新する。
7. Stripe Test modeのPrice、Coupon、Webhook、application IDを設定する。
8. Feature FlagはfalseのままPreviewをデプロイする。
9. `npm run check`、`npm run audit:all`、E2Eを実行する。
10. Shop/SalonをTest modeで一時有効化し、成功・失敗・キャンセル・再送・解約を確認する。
11. Production secretへ切り替え、`STRIPE_EXPECT_LIVE_MODE=true` を設定する。
12. 正式許可後だけFeature Flagを有効化する。

DB migrationより先に新コードを本番へ出すと、本番APIは意図どおりfail closedで503になりますが、サービス停止になります。順序を逆にしないでください。

## 7. 鍵のローテーション

| 鍵 | 手順 |
|---|---|
| Supabase service role | Dashboardで再発行、Vercel更新、再デプロイ、旧鍵失効、API確認 |
| Supabase anon | 再発行後にPreview/Production更新、Auth確認 |
| Stripe Secret | Roll key、両方が有効な期間に更新、再デプロイ、旧鍵失効 |
| Stripe Webhook Secret | 新endpoint/secret設定、疎通後に旧endpoint削除 |
| Rate limit HMAC | 変更で既存bucketが別keyになる。低トラフィック時間に変更し監視 |
| Discount HMAC | 既存codeの再導出値が変わるため、通常は変更しない。漏えい時は既存Promotion Codeを全失効して再発行 |
| IoT secret | 新Key ID追加 → 端末切替 → 旧Key ID削除 |

漏えいが疑われる場合は、通常のローテーション日程を待たず即時失効します。

## 8. 監視とアラート

最低限、次を監視対象にします。

- 401/403/429/503の急増
- `Rate limiter unavailable`
- `Stripe webhook configuration is invalid`
- `Stripe webhook handling failed`
- `IoT authentication configuration is invalid`
- Contact insert失敗
- CMS fallbackの連続発生
- Supabase AuthのMagic Link送信量
- Stripe DashboardのWebhook retry・失敗イベント
- `stripe_webhook_events.status='failed'` または古い `processing`
- `rate_limit_buckets` の異常増加
- Dashboard最終観測時刻の遅延

ログへ氏名、メール、問い合わせ本文、Secret、Webhook payloadを出してはいけません。現行コードはイベントID、設定変数名、エラー分類、DB error codeだけを記録します。

期限切れbucketと古い完了Webhook eventは、運用ポリシーに従って定期削除します。削除ジョブにはservice role相当の権限を与えず、Supabaseの管理されたcron/functionで対象テーブルだけを処理することを推奨します。

## 9. インシデント対応

1. 影響機能のFeature Flagをfalseにする。
2. 漏えいが疑われる鍵を失効し、再発行する。
3. Vercel、Supabase、Stripe、CMSの監査ログと時刻を保全する。
4. `stripe_webhook_events`、`orders`、`memberships` の不整合を確認する。
5. 不審な会員権限・Promotion Codeを無効化する。
6. IoT漏えいの場合は該当Key IDを削除し、期間内の観測値を隔離・再評価する。
7. 個人情報への影響、通知義務、大学内の報告経路を確認する。
8. 原因修正後、Previewで再現テストと回帰テストを行う。
9. Productionを段階的に再開する。
10. Timeline、影響、対処、再発防止を記録する。

## 10. 検証コマンド

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:all
```

2026-06-30の確認結果:

- ESLint: 成功
- TypeScript: 成功
- Vitest: 6 files / 20 tests成功
- Next.js production build: 成功
- `npm audit`: production/devを含め0件
- HTTP: CSPあり、nonceとHTML一致、リクエストごとにnonce変更
- HTTP: `script-src` に `unsafe-inline` なし、`strict-dynamic` あり
- HTTP: Cache-Control no-store、X-Frame-Options DENY、nosniff
- HTTP: Shop無効時404、Auth callback無効時404

## 11. 残余リスク・未完了事項

優先度順です。

1. **外部サービスE2E未実施**: 実際のSupabase/Stripe/Notion/Tumblr credentialはこの環境にないため、Test modeを含む統合試験が必要。
2. **Remote migration未適用**: SQLは作成済みだが、実際のSupabaseへ適用した証跡はない。
3. **実ブラウザCSP確認未実施**: HTTP上のnonce整合は確認済み。アプリ内Browserが利用できなかったため、Chrome/Firefox/SafariのConsole確認が必要。
4. **在庫の原子的引当なし**: Shopはサーバーで商品・上限・Stripe Priceを再検証するが、在庫値はコード設定で、同時購入時のDB reservationを実装していない。販売開始前に在庫テーブルと原子的reservationを追加する。
5. **Refund/Dispute同期なし**: 注文作成は記録するが、返金・異議申立のイベントをOrdersへ同期していない。自動出荷判断には使用しない。
6. **Bot challengeなし**: 共有レート制限は実装済みだが、分散Bot対策としてTurnstile等を追加する余地がある。
7. **集中監視なし**: 安全な構造化ログはあるが、SIEM/Sentry/Alert ruleは外部設定が必要。
8. **PII retention自動化なし**: Contact/Orderの保存期限と自動削除を大学方針に合わせて実装する必要がある。
9. **本格的な侵入診断未実施**: 自動テスト、コード監査、依存監査は実施したが、第三者Pen Testを代替しない。
10. **HTML動的化のコスト**: nonce CSPによりHTML CDN cacheを無効化した。負荷試験とVercel無料枠の監視が必要。

## 12. 参考にした一次・公式資料

- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)
- [Stripe Webhook signatures](https://docs.stripe.com/webhooks/signature)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase auth getUser](https://supabase.com/docs/reference/javascript/auth-getuser)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
