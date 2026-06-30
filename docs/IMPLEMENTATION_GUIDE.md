# Urban Bee Club Webサイト 実装・運用ガイド

最終確認日: 2026-06-30  
対象: 現在のワーキングツリー  
要件比較元: [`SRS.md`](./SRS.md)

## 1. この文書について

この文書は、Urban Bee Club公式Webサイトの現在の実装について、次の情報を一か所にまとめたものです。

- ローカル実行、テスト、本番実行の方法
- 採用技術とディレクトリ構成
- 画面、API、外部サービス、データベースのアーキテクチャ
- サイト閲覧者、コンテンツ運用者、システム管理者の使い方
- `SRS.md` と現行実装の差分、制約、今後の課題

「実装差分」はGitコミット間の差分ではなく、原則として **SRSの要求と現在のコードとの差分** を意味します。Git上の状態は「12. Git上の実装差分」で別に説明します。

## 2. クイックスタート

### 2.1 前提環境

- Node.js 20以上
- npm（`package-lock.json` を使用）
- 外部サービスを実際に接続する場合は、Supabase、Notion、Tumblr、Stripeの各アカウント

外部サービスの環境変数が空でも、公開画面はフォールバック用デモデータで確認できます。問い合わせは画面上成功しますが、Supabaseと通知Webhookの両方が未設定の場合は保存されないため、本番環境では必ず保存先を設定してください。

### 2.2 開発サーバー

PowerShellで次を実行します。

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。開発サーバーはNext.jsのTurbopackを使用します。

### 2.3 品質確認

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

すべてまとめて確認する場合:

```powershell
npm run check
```

2026-06-30時点で品質確認は成功しています。内訳はESLint成功、TypeScript型検査成功、Vitest 6ファイル・20テスト成功、Next.js本番ビルド成功、`npm audit` 0件です。

### 2.4 本番相当で実行

```powershell
npm run build
npm run start
```

`npm run start` の前に必ずビルドを行います。本番では `.env.local` を配布せず、VercelのEnvironment Variablesなどへ環境ごとに値を登録します。

## 3. 採用技術

| 分類 | 技術 | 用途 |
|---|---|---|
| Webフレームワーク | Next.js 15 App Router | Server Components、画面ルーティング、Route Handlers、メタデータ生成 |
| UI | React 19、TypeScript 5 | コンポーネントと型安全な実装 |
| CSS | Tailwind CSS 3、PostCSS | レスポンシブUI、テーマカラー、紙・木・葉の表現 |
| フォント | Zen Maru Gothic (`next/font`) | 丸みと可読性を持つ日本語表示 |
| アニメーション | anime.js 4 | 初回ローディング、SVG描画、葉とテキストの出現 |
| 3D | Three.js、React Three Fiber | ヒーロー上の自律飛行ミツバチ |
| アイコン | Lucide React | UIアイコン |
| DB・認証 | Supabase | PostgreSQL、RLS、Magic Link認証 |
| 決済 | Stripe | 商品Checkout、月額購読、Billing Portal、Webhook |
| CMS | Notion API、Tumblr API | 養蜂日誌、研究記録、速報、会員写真 |
| 入力検証 | Zod | 問い合わせ、IoT値、カート、メールの検証 |
| テスト | Vitest、Testing Library、jsdom | ユーティリティと共通UIの単体テスト |
| 品質管理 | ESLint、TypeScript | 静的解析と型検査 |
| 想定ホスティング | Vercel | Next.js配信、Serverless Functions、環境変数、SSL |

実際の依存バージョン範囲はルートの `package.json`、固定された解決バージョンは `package-lock.json` を正とします。

## 4. ディレクトリ構成

```text
ubc-website/
├─ docs/
│  ├─ SRS.md                    # 要件定義・仕様書
│  └─ IMPLEMENTATION_GUIDE.md   # 本書
├─ public/
│  ├─ favicon.svg
│  └─ images/                   # サイト内で配信する画像
├─ src/
│  ├─ app/                      # App Routerの画面、API、メタデータ
│  │  ├─ api/                   # contact、IoT、認証、Shop、Salon、Stripe
│  │  ├─ shop/                  # Feature Flag対象
│  │  ├─ salon/                 # Feature Flag・会員認証対象
│  │  └─ ...                    # 公開ページ
│  ├─ components/               # UI、フォーム、3D、グラフ、アニメーション
│  ├─ lib/                      # CMS、DB、認証、Stripe、設定、型、デモデータ
│  └─ test/                     # Vitest共通設定
├─ supabase/
│  └─ migrations/
│     ├─ 001_initial_schema.sql
│     └─ 002_security_hardening.sql
├─ .env.example                # 環境変数のひな型
├─ next.config.ts              # 画像許可元、HTTPセキュリティヘッダー
├─ tailwind.config.ts          # 色、フォント、影、アニメーション
└─ package.json                # コマンドと依存関係
```

## 5. システムアーキテクチャ

```mermaid
flowchart LR
    Visitor[閲覧者のブラウザ] --> Next[Next.js App Router on Vercel]
    Operator[運用者] --> Notion[Notion Bee Diary]
    Operator --> Tumblr[Tumblr news / gallery]
    Sensor[IoTセンサーノード] -->|device HMAC + JSON| IoT[/api/iot/readings]

    Next -->|Server Components + cache| Notion
    Next -->|Server Components + cache| Tumblr
    Next -->|service role / server only| DB[(Supabase PostgreSQL)]
    Next -->|Magic Link / session| Auth[Supabase Auth]
    Visitor -->|問い合わせ・認証・購入| Next
    IoT --> DB

    Next -->|Checkout / Portal| Stripe[Stripe]
    Stripe -->|署名付きWebhook| Webhook[/api/stripe/webhook]
    Webhook --> DB
    Next -->|任意の通知| Notify[Contact Webhook]
```

### 5.1 レンダリングとキャッシュ

- 公開ページは主にServer Componentsで構成し、必要な箇所だけClient Componentsを使用します。
- Tumblrの `#news` と `#gallery` は5分間キャッシュします。
- Notionの養蜂日誌は15分間キャッシュします。
- スマート巣箱はSupabaseから最新48件を取得し、1分間キャッシュします。
- CMS未設定または取得失敗時はデモコンテンツへ切り替えます。
- センサーデータがない場合も画面全体をエラーにせず、デモ値と「最終取得データ」の表示へ切り替えます。

### 5.2 クライアント処理

- 問い合わせ、Magic Link、カート、Stripe遷移はClient Componentsから内部APIを呼び出します。
- ヒーローの3DミツバチはWebGL対応・比較的高性能な端末だけで描画します。
- `prefers-reduced-motion`、粗いポインター、CPU 4スレッド以下、メモリ4GB以下ではCSS版のミツバチへ切り替えます。
- 初回ローディング演出は1セッションにつき1回だけ表示し、動きを減らす設定では表示しません。

## 6. 画面とAPI

### 6.1 画面ルート

| URL | 内容 | 公開条件 |
|---|---|---|
| `/` | Hero、活動数値、ハチの紹介、Tumblr速報 | 常時公開 |
| `/amazing-bees` | 顔認識、ダンス、数、感情、視覚、受粉の解説 | 常時公開 |
| `/dashboard` | 温度、湿度、重量、活動量のグラフ | 常時公開 |
| `/research` | 沿革、活動、IoT・AI研究、Notion記事 | 常時公開 |
| `/contact` | 入部、出前授業、研究、その他の問い合わせ | 常時公開 |
| `/diary` | Notion「Bee Diary」のカード一覧 | 常時公開、補助メニュー |
| `/privacy` | プライバシーポリシー | 常時公開、補助メニュー |
| `/shop` | 商品、カート、Stripe Checkout | `ENABLE_SECRET_SHOP=true` |
| `/shop/success` | 商品購入完了表示 | `ENABLE_SECRET_SHOP=true` |
| `/salon` | Magic Link、月額88円購読、会員操作 | `ENABLE_SALON=true` |
| `/salon/gallery` | Tumblr `#gallery` の会員限定表示 | Salon有効かつ有効会員 |

主要ナビゲーションはSRSどおり5項目です。養蜂日誌、プライバシー、許可後のShopとSalonは補助メニューまたはフッターに表示します。

### 6.2 APIルート

| Method | URL | 主な保護・処理 |
|---|---|---|
| `POST` | `/api/contact` | Origin・Fetch Metadata、本文上限、strict Zod、ハニーポット、DB共有回数制限、Supabase保存、許可Host限定Webhook |
| `POST` | `/api/iot/readings` | 端末別HMAC、timestamp、UUID冪等性、固定hive ID、DB共有回数制限、Supabase保存 |
| `POST` | `/api/auth/magic-link` | Salon Flag、Origin、本文上限、IP・Email二重共有制限、Supabase OTP |
| `POST` | `/api/auth/signout` | Salon Flag、Origin、Supabaseセッション破棄 |
| `GET` | `/auth/callback` | Salon Flag、認証code長、固定path allow-list、セッション交換 |
| `POST` | `/api/shop/checkout` | Shop Flag、Origin、共有制限、UUID冪等キー、商品・数量・Price ID再検証 |
| `POST` | `/api/salon/checkout` | Salon Flag、Origin、ログイン、IP/User共有制限、重複会員確認、冪等Checkout |
| `POST` | `/api/salon/portal` | Salon Flag、Origin、ログイン、User共有制限、冪等Billing Portal |
| `POST` | `/api/stripe/webhook` | 本文上限、Stripe署名・環境・application・Price・User・DB event冪等性検証 |

Feature Flagが無効なシークレット画面と対象APIは404を返します。シークレットURLはサイトマップに含めず、各画面には `noindex` を設定しています。

## 7. データベース

`supabase/migrations/001_initial_schema.sql` が初期スキーマ、`002_security_hardening.sql` が既存環境向けの堅牢化です。新規環境でも番号順に両方を適用します。

| テーブル | 用途 | 主な書き込み元 |
|---|---|---|
| `hives` | 巣箱名、場所、有効状態 | 管理者 |
| `sensor_readings` | 温度、湿度、重量、活動量の時系列値 | IoT API |
| `contact_submissions` | 問い合わせと対応状態 | Contact API |
| `memberships` | SupabaseユーザーとStripe購読の対応 | Stripe Webhook |
| `discount_codes` | 会員用10%割引コード | Stripe Webhook |
| `orders` | 商品Checkoutの注文概要 | Stripe Webhook |
| `rate_limit_buckets` | HMAC化した共有レート制限状態 | 各Serverless API |
| `stripe_webhook_events` | Webhook claim・成功・失敗・再試行状態 | Stripe Webhook |

全テーブルでRLSを有効化しています。匿名ユーザーにテーブルを直接公開せず、公開データの読み書きはサーバー専用のservice role経由です。認証済みユーザーには、自分の会員状態と有効な割引の表示用列だけをRLS Policyと列権限で許可し、Stripe内部IDは公開しません。

### 7.1 Supabase初期設定

1. Supabaseプロジェクトを作成します。
2. SQL EditorまたはSupabase CLIで `001_initial_schema.sql`、`002_security_hardening.sql` を番号順に適用します。
3. Project URL、anon key、service role keyを環境変数へ設定します。
4. AuthのSite URLをサイトURLにし、`https://<domain>/auth/callback` をRedirect URLへ追加します。
5. 最初の巣箱を作成し、返されたUUIDをセンサーノードの `hiveId` に設定します。

```sql
insert into public.hives (name, location)
values ('第1巣箱', '調布キャンパス屋上')
returning id;
```

service role keyはブラウザへ渡してはいけません。`NEXT_PUBLIC_` 接頭辞を付けず、Vercelのサーバー用Secretとして管理します。

## 8. 環境変数

| 変数 | 必須になる機能 | 説明 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | 本番全体 | 正規URL、認証・決済の戻り先。ローカル既定値は `http://localhost:3000` |
| `ALLOWED_ORIGINS` | ブラウザAPI | 追加の完全一致Origin。通常の本番は空 |
| `ENABLE_SECRET_SHOP` | Shop | 正式許可後だけ `true` |
| `ENABLE_SALON` | Salon | 正式許可後だけ `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | DB・認証 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Salon認証 | 公開可能なanon key。RLSを前提に使用 |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard、Contact、IoT、Webhook | サーバー専用の強い権限を持つ鍵 |
| `RATE_LIMIT_BACKEND` | 本番API | 本番は `database`、localのみ `memory` |
| `RATE_LIMIT_HMAC_SECRET` | 本番API | 生IP・Emailを保存しないための32 random bytes以上のsecret |
| `IOT_INGEST_KEYS` | IoT投入 | Key IDごとの固定hive UUIDと32 bytes以上の独立secretを持つJSON |
| `IOT_SIGNATURE_TOLERANCE_SECONDS` | IoT投入 | HMAC timestampの許容秒数 |
| `NOTION_TOKEN` | Diary・Research | Notion Integration token |
| `NOTION_DATABASE_ID` | Diary・Research | Bee DiaryデータベースID |
| `TUMBLR_API_KEY` | News・Gallery | Tumblr API key |
| `TUMBLR_BLOG_IDENTIFIER` | News・Gallery | ブログの識別子 |
| `STRIPE_SECRET_KEY` | Shop・Salon | StripeサーバーSecret key |
| `STRIPE_WEBHOOK_SECRET` | 注文・会員反映 | Webhook Signing secret |
| `STRIPE_METADATA_APP_ID` | Shop・Salon | 同一Stripe account内のアプリ分離namespace |
| `STRIPE_EXPECT_LIVE_MODE` | Shop・Salon | Testはfalse、Productionはtrue |
| `STRIPE_SALON_PRICE_ID` | Salon | 88円/月のrecurring Price ID |
| `STRIPE_SALON_COUPON_ID` | Salon | Stripe側で作成した会員割引用Coupon ID |
| `DISCOUNT_CODE_HMAC_SECRET` | Salon | 安定的で推測困難な会員code導出用secret |
| `STRIPE_HONEY_PRICE_ID` | Shop | はちみつのPrice ID |
| `STRIPE_CREAM_PRICE_ID` | Shop | みつろうクリームのPrice ID |
| `STRIPE_LIP_PRICE_ID` | Shop | リップのPrice ID |
| `CMS_IMAGE_HOSTS` | CMS画像 | Next Imageが取得可能なHTTPS hostname allow-list |
| `CONTACT_WEBHOOK_ALLOWED_HOSTS` | 問い合わせ通知 | Webhook URLのhostname allow-list |
| `CONTACT_WEBHOOK_URL` | 問い合わせ通知 | Slack互換などの固定通知先。任意 |

## 9. 運用者向けの使い方

### 9.1 Notionで養蜂日誌を更新

Integrationを対象データベースへ接続し、次のプロパティを用意します。

| プロパティ | Notion型 | 使用方法 |
|---|---|---|
| `タイトル` | Title | カード見出し |
| `概要` | Rich text | カード本文 |
| `ステータス` | Select | `公開` の記事だけ取得 |
| `公開日` | Date | 新しい順の並び替え |
| `カテゴリ` | Select | 養蜂日誌、研究、技術など |

1. Bee Diaryデータベースでページを作成します。
2. 上記プロパティとカバー画像を設定します。
3. `ステータス` を `公開` にします。
4. 最大15分程度で `/diary` と `/research` に反映されます。

現在はNotion本文をサイト内へ再構築せず、カードの「全文を読む」からNotion公開ページを別タブで開きます。そのため、読者が本文を読めるようNotion側の共有設定も確認してください。

### 9.2 Tumblrで速報・会員写真を更新

- ホームの速報: `#news` を付けて投稿
- 会員ギャラリー: `#gallery` を付けて投稿

最大5分程度で反映されます。現行実装はテキストと先頭画像を安全なプレーン表示に変換します。TumblrのリッチHTMLや動画プレイヤーはサイト内へ埋め込みません。

### 9.3 問い合わせを管理

- Supabaseの `contact_submissions` を管理者権限で確認します。
- 対応時に `status` を `new`、`in_progress`、`resolved`、`spam` のいずれかへ更新します。
- 即時通知が必要なら `CONTACT_WEBHOOK_URL` を設定します。
- DBとWebhookの両方が未設定でもAPIは開発確認用に201を返すため、本番リリース前に実データが保存されることを必ずテストします。

### 9.4 IoT値を投入

```http
POST /api/iot/readings
X-UBC-Key-Id: sensor-a
X-UBC-Timestamp: <UNIX秒>
X-UBC-Idempotency-Key: <UUID>
X-UBC-Signature: v1=<HMAC-SHA-256 hex>
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

HMAC対象は `<timestamp>\n<UUID>\n<送信するJSONの生byte列>` です。`recordedAt` は必須のISO 8601形式です。値域は温度 -20〜70℃、湿度 0〜100%、重量 0〜500kg、活動量 0〜100です。成功時は204を返します。詳細と署名コード例は [`SECURITY.md`](./SECURITY.md) を参照してください。

### 9.5 ShopとSalonを解放

大学・担当教授の正式許可を取得した後だけ実施します。

1. Stripeで商品3点のPrice、月額88円のrecurring Price、会員割引用Couponを作成します。
2. Stripe Price IDとSecret keyを環境変数へ登録します。
3. Webhook URLを `https://<domain>/api/stripe/webhook` に設定します。
4. `checkout.session.completed`、`customer.subscription.updated`、`customer.subscription.deleted` を購読します。
5. Signing secret、Test/Live mode、application ID、Coupon ID、割引code用HMAC secretを設定します。
6. Supabase AuthのURL設定とMagic Linkメール送信をテストします。
7. Webhook再送、順序逆転、解約時の割引無効化を確認します。
8. 許可された機能だけFeature Flagを `true` にして再デプロイします。

```env
ENABLE_SECRET_SHOP=true
ENABLE_SALON=true
```

本番公開前にStripe Test modeで、成功、キャンセル、Webhook再送、購読更新、解約、Billing Portal、会員ギャラリー制御を一通り確認してください。

## 10. セキュリティ・アクセシビリティ・障害時動作

### 10.1 セキュリティ

- Supabase service role、Stripe secret、IoT device secretはサーバーからのみ参照します。
- 問い合わせ、認証、Shop APIには本文上限、Origin・Fetch Metadata検証、Supabase共有回数制限があります。
- 商品のPrice IDと在庫上限はサーバー側で再検証し、ブラウザ送信の金額を信用しません。
- Stripe Webhookは署名、環境、application metadata、Price、User、DB event冪等性を検証してからDBを更新します。
- `X-Frame-Options`、request nonce CSP、HSTS、`nosniff`、Referrer Policy、Permissions Policyなどを全ルートへ付与します。
- CMSの本文はHTMLとして挿入せず、プレーンテキスト化します。
- `robots.txt` は `/api/` をクロール対象外にし、シークレットURLをサイトマップへ載せません。

本番の回数制限はSupabase PostgreSQLの原子的関数で全Serverless instanceに共有します。生IP・EmailはHMAC化し、DBまたは秘密鍵が利用できない場合は503でfail closedします。詳細な脅威モデル、鍵ローテーション、インシデント対応、残余リスクは [`SECURITY.md`](./SECURITY.md) を参照してください。

### 10.2 アクセシビリティ

- スキップリンク、見出し構造、キーボードフォーカス、フォームラベル、状態通知を実装しています。
- SRS指定のクリーム、焦げ茶、淡いオレンジ、アクションオレンジをテーマ化しています。
- `prefers-reduced-motion` ではアニメーションを実質停止します。
- 画像には代替テキストを設定し、装飾要素は支援技術から隠します。

ただし、WCAG 2.1 AAまたはデジタル庁DADSへの完全準拠を保証する自動・手動監査記録はまだありません。公開前にaxe、Lighthouse、キーボード操作、スクリーンリーダー、実機での確認が必要です。

### 10.3 障害・フォールバック

- Notion、Tumblrの未設定・タイムアウト・エラー: デモ記事を表示し、サーバーログへ記録
- Supabaseセンサー値なし・取得エラー: デモ値を「最終取得データ」として表示
- WebGL初期化失敗・低性能端末・動き抑制: CSSミツバチへ切り替え
- Stripe未設定: 503と「決済は現在準備中」を返す
- Supabase認証未設定: 503と「ログイン機能は現在準備中」を返す

## 11. SRSと現行実装の差分

| SRS項目 | 現行実装 | 判定・残作業 |
|---|---|---|
| 公開5画面と厳選ナビ | 5画面を実装し、日誌・Privacy・Secret機能は補助メニューへ分離 | 実装済み |
| 温かなHero、紙、木、葉、クレヨン調ロゴ | ローカルHero画像、紙ノイズ、ツタ、葉、ハニカムロゴ、指定色を実装 | 実装済み |
| anime.jsの3フェーズ | ハニカム線画・塗り、ヘッダーのツタ・葉、ナビ・Heroのスタッガーを実装 | 一部仕様変更。ツタは各メニューへ螺旋状に絡まず、ヘッダー下の一本線。演出はセッション初回のみ |
| WebGL物理演算の群知能、カーソル・スクロール反応 | React Three Fiberで7匹の簡易群れ挙動、境界反射、近接回避、カーソル回避を実装 | 一部実装。専用物理エンジン、スクロール反応、高度なBoidsは未実装 |
| 低性能端末の軽量化 | motion設定、pointer、CPU、メモリ、WebGL失敗でCSS版へ切替 | 実装済み |
| Quick Stats | アニメーション付き数値を表示 | 実装済み。値は現状コード内の固定値 |
| Tumblr速報 | `#news` を5分キャッシュで取得 | 実装済み。動画・リッチ本文は埋め込まず、テキストと先頭画像に限定 |
| Notion長文・研究記録 | 公開記事のメタデータを取得し、日誌・研究画面へカード表示 | 一部実装。本文はサイト内レンダリングせずNotionへ外部リンク |
| リアルタイム巣箱 | Supabase最新48件を1分更新で可視化 | 一部実装。複数巣箱の選択・絞り込み、Push更新、最終実データの永続キャッシュは未実装。障害時表示はデモ値 |
| 研究紹介・沿革・教授の日常 | 静的コンテンツとNotion記事で構成 | 実装済み。正式な氏名、受賞根拠、写真等は公開前の内容確認が必要 |
| 入部・地域交流フォーム | 4分類のフォーム、DB保存、任意通知を実装 | 実装済み。管理画面やメール返信機能はなし |
| Shop | 商品一覧、カート、冪等Stripe Checkout、署名付き注文記録、Stripe Session検証済み完了画面を実装 | 基本実装済み。商品・在庫はコード内固定で、DBの原子的在庫引当や管理画面はなし |
| 月額88円Salon | Magic Link、購読、Portal、会員限定Gallery、割引コード生成・表示・失効連動を実装 | 基本実装済み。実Stripe/Supabaseを使うE2Eは未実施 |
| Secret機能の完全隠蔽 | Flag無効時にリンク非表示、画面・対象API・`/auth/callback` は404、サイトマップ除外 | 実装済み。公開前のHTTP/E2E再確認は必要 |
| WCAG 2.1 AA・DADS | コントラストを意識した色、フォーカス、動き抑制等を実装 | 監査未実施のため「準拠保証」は未完了 |
| Vercel CI/CD、SSL、独自ドメイン | Vercel向けNext.js構成と環境変数手順を用意 | 運用作業。リポジトリ内にCI workflow、Vercel接続、DNS設定の証跡はなし |
| 完全無料構成 | 各サービスの無料枠を前提 | 条件付き。無料枠上限があり、Stripe決済には取引手数料が発生するため、決済開始後の完全無料は不可 |

### 優先度の高い残作業

1. 公開前に正式コンテンツ、受賞歴、画像利用条件、Privacy文面を責任者が確認する。
2. Stripe Test modeで決済、Webhook再送・順序逆転、解約、返金をE2E確認する。
3. Dashboardを巣箱単位に絞り、実測値の最終正常データを永続的に保持する。
4. axe・Lighthouse・スクリーンリーダー・実機でアクセシビリティ監査を行う。
5. 導入済みのServerless共有レート制限を実Supabaseで確認し、集中監視とCMS/センサー停止通知を導入する。
6. Notion本文をサイト内で読む必要がある場合は、Block取得・安全なレンダリング・記事詳細ルートを実装する。

## 12. Git上の実装差分

2026-06-30確認時のGit `HEAD`（`ab50e51 Initial commit`）には `LICENSE` と2行の旧 `README.md` だけが存在します。現在のWebアプリ本体、設定、テスト、画像、Supabase migrationはワーキングツリー側で新規作成され、`README.md` は大幅更新されています。

主な追加単位は次のとおりです。

- Next.js / TypeScript / Tailwind / Vitestのプロジェクト設定
- 公開7ルート、Secret 4ルート、API 8ルート、認証Callback
- 共通UI、フォーム、チャート、3Dミツバチ、anime.js演出
- Notion、Tumblr、Supabase、Stripeのサーバー統合
- Supabase初期スキーマ、RLS Policy、Index
- セキュリティヘッダー、入力検証、Feature Flag、フォールバック
- 単体テスト、Hero画像、favicon、運用README、本書

Supabase migration、`.env.example`、本書、`SECURITY.md` はGit追跡可能です。実credentialを含む `.env.local` と、内部要件を含む `docs/SRS.md` は除外を維持しています。

コミット前には必ず次を確認してください。

```powershell
git status --short --untracked-files=all
npm run check
```

秘密鍵や `.env.local` が含まれていないこと、必要なmigrationと画像ライセンス情報が含まれていることを確認してからコミットします。

## 13. デプロイ手順

1. GitHub等のリモートリポジトリへ、必要ファイルをコミットしてPushします。
2. Vercelへリポジトリを接続し、Framework PresetにNext.jsを選びます。
3. PreviewとProductionそれぞれに環境変数を設定します。ProductionのFeature Flagは許可前なら必ず `false` にします。
4. Supabase migration、Auth URL、Stripe Webhookを設定します。
5. `npm run check` をデプロイ前の必須チェックにします。
6. Previewで公開画面、404制御、フォーム、CMS、Dashboardを確認します。
7. Secret機能を有効にする場合はStripe Test modeで確認後、Production keyへ切り替えます。
8. Vercelが示すDNSレコードを大学ネットワーク担当またはドメイン管理者へ設定依頼します。
9. SSL発行後、`NEXT_PUBLIC_SITE_URL`、Supabase Site URL、Redirect URL、Stripeの戻り先・Webhook URLがすべてHTTPSの本番ドメインになっていることを再確認します。

デプロイ後は、`/robots.txt`、`/sitemap.xml`、404、CSPエラー、CMS更新時間、IoT最終更新、問い合わせ保存、Stripe Webhook履歴を確認します。
