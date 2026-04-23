# BYTE BREACH UI 実装メモ v1

## 作成物
- ui_digits_8x8.png
- ui_labels_minimal.png
- ui_icon_life_8x8.png
- ui_panel_3slice_16x16.png

## 直近ワークスルー
### 最小プレイアブルで使うもの
- SCORE
- digits 0-9
- GAME OVER
- RETRY
- panel 3slice

### Codex接続順
1. スコア整数を digits で描画
2. 上部HUDの下地に panel 3slice を横連結
3. GAME OVER 表示
4. RETRY 表示
5. 必要なら life icon を左上に配置

## 中期ワークスルー
- HI-SCORE 常設表示
- START タイトル導線
- 点滅アニメ版ラベル
- 危険時に HUD 赤点灯
- コンボ / ボーナス数値演出

## 長期ワークスルー
- UIスキン差分
- 多言語ラベル差し替え
- 実績 / チャレンジ表示
- ミニマップ風パネル
- タイトル / リザルト画面専用UI

## 実装注意
- digits は 1文字 8x8
- labels は横並び文字列をそのまま描画
- panel は left + mid*n + right で可変長にできる
- 文字描画色は固定利用でも良いが、将来はパレット差し替え前提にしておくと拡張しやすい
