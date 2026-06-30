# Urban Bee Club 公式Webサイト

電気通信大学 Urban Bee Club の公式サイトです。ミツバチの知性、都市養蜂、IoT・AI研究を、子供から研究者まで楽しめる形で伝えます。

## 実装範囲

- 公開5画面: Home / ハチのひみつ / スマート巣箱 / 活動と研究 / 参加・問合せ
- Tumblr `#news`・`#gallery` と Notion「Bee Diary」の連携（未設定時は表示確認用データ）
- Supabaseへの問い合わせ保存、IoT時系列データ取得・認証付き投入
- WebGLの自律飛行ミツバチ。低性能端末、タッチ端末、`prefers-reduced-motion` ではCSS版へ自動切替
- Stripe Checkoutを使うショップと月額88円サロン
- Supabase Magic Link認証、会員限定ギャラリー、会員割引コード発行
- Feature Flag無効時のシークレット画面・APIの404化
- レスポンシブ表示、キーボード操作、スキップリンク、十分なコントラスト、動きの抑制設定

## ローカル起動

Node.js 20以上を用意します。

```bash
npm ci
copy .env.example .env.local
npm run dev
```

`http://localhost:3000` を開きます。外部サービスの変数が未設定でも、公開画面はデモデータで確認できます。

## 品質確認

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:all
```

まとめて実行する場合は `npm run check` を使用します。

## 外部サービス設定

`.env.example` を `.env.local` にコピーし、必要な値を設定します。秘密鍵を `NEXT_PUBLIC_` 付き変数へ入れないでください。

### Supabase

1. Supabaseプロジェクトを作成します。
2. `supabase/migrations/001_initial_schema.sql` と `002_security_hardening.sql` を番号順にSQL EditorまたはCLIで適用します。
3. Project URL、anon key、service role keyを設定します。
4. AuthのSite URLを本番URLにし、`/auth/callback` をRedirect URLへ追加します。
5. `hives` に巣箱を1件作成し、そのUUIDをセンサーノードへ設定します。

service role keyはサーバー専用です。ブラウザへ渡さず、VercelではProduction / Previewを分けて管理します。

### IoTデータ投入

旧Bearer token方式は廃止されています。`IOT_INGEST_KEYS` に端末ごとのKey ID、固定hive UUID、独立した32 bytes以上のsecretを設定し、HTTPSでHMAC署名付きリクエストを送ります。

```http
POST /api/iot/readings
X-UBC-Key-Id: sensor-a
X-UBC-Timestamp: <UNIX秒>
X-UBC-Idempotency-Key: <UUID>
X-UBC-Signature: v1=<timestamp + LF + UUID + LF + raw JSONのHMAC-SHA-256>
Content-Type: application/json

{
  "hiveId": "00000000-0000-0000-0000-000000000000",
  "recordedAt": "2026-06-30T12:00:00Z",
  "temperature": 34.5,
  "humidity": 58.2,
  "weight": 38.7,
  "activity": 72
}
```

正規化対象byte列、署名コード例、鍵ローテーションは [`docs/SECURITY.md`](./docs/SECURITY.md) を参照してください。

### Tumblr

Tumblr API keyとブログ識別子を設定します。`#news` はホーム、`#gallery` は会員ギャラリーへ最大5分程度で反映されます。本文はHTMLとして挿入せず、プレーンテキストへ変換しています。

### Notion

Integrationを「Bee Diary」データベースへ接続し、データベースIDとTokenを設定します。次のプロパティ名を使用します。

| プロパティ | 型 | 値 |
|---|---|---|
| タイトル | Title | 記事名 |
| 概要 | Rich text | カード用の短い説明 |
| ステータス | Select | 公開 |
| 公開日 | Date | 公開日 |
| カテゴリ | Select | 養蜂日誌、研究、技術など |

### Stripeとシークレット機能

1. Stripeでショップ商品3点のPrice、88円/月のrecurring Price、会員割引用Couponを作成します。
2. 対応する環境変数を設定します。
3. Webhook URLを `https://<domain>/api/stripe/webhook` にし、`checkout.session.completed`、`customer.subscription.updated`、`customer.subscription.deleted` を購読します。
4. Signing secretを設定します。
5. Test/Live mode、application ID、割引コード用HMAC secretを設定します。
6. 大学・担当教授の正式許可後に限り、対象フラグを有効化して再デプロイします。

```env
ENABLE_SECRET_SHOP=true
ENABLE_SALON=true
```

許可前は必ず両方を `false` のままにします。false時はナビ・フッターにリンクが出ず、画面、Checkout API、認証API、Webhookも404になります。`robots.txt` とサイトマップにもシークレットURLを公開しません。

## 運用

- 長文・研究記録: Notionでページを作り、ステータスを「公開」にします。
- 速報: Tumblrへ `#news` を付けて投稿します。
- 会員写真: Tumblrへ `#gallery` を付けて投稿します。
- 問い合わせ: Supabaseの `contact_submissions` を管理者権限で確認します。必要なら固定の通知Webhookも設定できます。
- センサー障害: 最後の取得データまたはデモデータと「ハチたちはお休み中」を表示し、公開画面をエラーにしません。

## デプロイ

Vercelへリポジトリを接続し、環境ごとの変数を登録します。`main` のデプロイ前にCIで `npm run check` を実行してください。大学サブドメインを使う場合は、Vercelが示すDNSレコードを大学ネットワーク担当へ申請します。

## セキュリティ上の注意

- `.env*`、Supabase service role、Stripe secret、IoT device secretをGitへ追加しません。
- RLSと列権限により、会員は自分の会員状態・有効な割引表示列だけを読めます。
- 商品価格と在庫はCheckout APIがサーバー側で再検証します。ブラウザから金額を受け取りません。
- Stripe Webhookは署名、環境、application metadata、Price、イベント冪等性を検証してからDBを更新します。
- 問い合わせと認証には本文上限、同一Origin/Fetch Metadata検査、Supabase共有レート制限があります。本番で共有制限を利用できない場合はfail closedします。
- IoTは端末別HMAC、時刻窓、巣箱固定、DB冪等性で保護します。
- HTMLはリクエストごとのnonce付きCSPを使用し、scriptの `unsafe-inline` を許可しません。

脅威モデル、全設定、migration、検証結果、残余リスク、インシデント対応は [`docs/SECURITY.md`](./docs/SECURITY.md) を参照してください。

## ライセンス

[LICENSE](./LICENSE) を参照してください。生成済みヒーロー画像の利用条件は、プロジェクトの公開方針に合わせて確認してください。
