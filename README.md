# BYTE BREACH

GitHub Pages でそのまま遊べる、HTML / CSS / JavaScript + Canvas 2D だけで構築した 1 画面スコアアタック型収集アクションです。既存の BYTE BREACH アセットをそのまま利用し、静的ホスティングだけで完結する構成にしています。

## プレイ内容

- WASD / 矢印キーで移動
- Space / Enter で開始・リトライ
- `datachip` を回収してスコア獲得
- `energycell` は高得点ボーナス
- patrol drone は固定ルート巡回
- chase drone は時間経過で増援出現
- hazard タイルと敵接触でゲームオーバー
- ハイスコアは `localStorage` に保存

## フォルダ構成

```text
.
├─ index.html
├─ css/
│  └─ styles.css
├─ js/
│  └─ game.js
├─ .github/workflows/
│  └─ pages.yml
├─ *.png
└─ BYTE_BREACH_*.{md,json,csv}
```

- 既存 PNG アセットはリポジトリ直下のまま保持
- HTML / CSS / JS だけを追加し、相対パスで GitHub Pages 配下でも壊れないようにしています
- ビルド工程や外部依存はありません

## ローカル起動

任意の静的ファイルサーバーで起動できます。例:

```bash
cd /path/to/FreeGame_github_pages
python3 -m http.server 8000
```

その後、`http://127.0.0.1:8000/` を開いてください。

## GitHub Pages デプロイ手順

1. リポジトリの `Settings > Pages` を開く
2. `Build and deployment` の `Source` を **GitHub Actions** に設定する
3. デフォルトブランチ（通常は `main`）へこの変更をマージする
4. `.github/workflows/pages.yml` が実行される
5. Actions 完了後、表示された Pages URL からプレイ可能

### デプロイ内容

- `index.html`
- `css/`
- `js/`
- ルート直下の PNG アセット一式

## 実装メモ

- 画面サイズは 320x240 の固定キャンバスを CSS で拡大表示
- タイルは 16x16 ベース
- タイトル / gameplay / game over の 3 状態を実装
- FX / UI / プレイヤー / 敵アニメーションは既存シートを使用
- GitHub Pages のリポジトリ名配下でも動くよう、すべて相対参照で読み込み

## 参照ドキュメント

- `BYTE_BREACH_integration_guide_v1.md`
- `BYTE_BREACH_roadmap_v1.md`
- `BYTE_BREACH_ui_notes_v1.md`
- `BYTE_BREACH_fx_notes_v1.md`
- `BYTE_BREACH_asset_manifest_v1.json`
- `BYTE_BREACH_asset_manifest_v1.csv`
