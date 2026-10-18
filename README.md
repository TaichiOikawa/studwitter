# Studwitter

Googleアカウントで利用できる学習カードアプリです。Next.js 16（vinext）、Cloudflare Workers / D1、Prisma 7、Better Authを使用しています。

## ローカル開発

依存関係をインストールし、環境変数を用意します。

```bash
yarn install
cp .env.example .dev.vars
```

`.dev.vars` に次の値を設定してください。

- `BETTER_AUTH_SECRET`: 32文字以上のランダム文字列
- `BETTER_AUTH_URL`: ローカルでは `http://localhost:3000`
- `GOOGLE_CLIENT_ID`: Google OAuthクライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuthクライアントシークレット
- `ADMIN_EMAIL`: 管理ページへアクセスできるGoogleアカウントのメールアドレス

Google Cloud Consoleの承認済みリダイレクトURIには、ローカル用として次を追加します。

```text
http://localhost:3000/api/auth/callback/google
```

DBを準備して開発サーバーを起動します。

```bash
yarn db:migrate:local
yarn dev
```

管理者でログインすると、`/admin` の管理ページへアクセスできます。

## Cloudflareへの反映

本番URLの `/api/auth/callback/google` もGoogle Cloud Consoleの承認済みリダイレクトURIに追加してください。各環境変数はソースへ書かず、Cloudflare secretとして設定します。

```bash
yarn wrangler secret put BETTER_AUTH_SECRET
yarn wrangler secret put BETTER_AUTH_URL
yarn wrangler secret put GOOGLE_CLIENT_ID
yarn wrangler secret put GOOGLE_CLIENT_SECRET
yarn wrangler secret put ADMIN_EMAIL
yarn db:migrate:remote
yarn deploy
```

`BETTER_AUTH_URL` には、末尾のスラッシュなしで本番オリジンを設定します。

## ハッシュタグで復習

本文の先頭、または空白・改行の後に `#英語` や `#苦手` を入力すると、カードを分類できます。
ホームのタグ欄で複数選ぶと、選んだタグすべてが付いたカードだけがランダムに表示されます。
本文のタグからも選択に追加でき、「すべて」で解除できます。再読み込みすると選択は解除されます。

タグ名の英字の大小・全角半角は区別しません。開始記号は半角 `#` のみです。
タグと重なる目隠しはタグ部分だけ解除されます。注釈はタグの認識対象外です。
新規サンプルには教科タグが付きますが、既存サンプルへの自動追記は行いません。

## 検証

Node.js 24で自動テストを実行できます。

```bash
node --test tests/*.test.mjs
yarn lint
yarn tsc --noEmit
yarn build
```
