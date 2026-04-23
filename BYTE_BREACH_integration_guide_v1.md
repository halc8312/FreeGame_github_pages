# BYTE BREACH 統合ガイド v1

## 直近ゴール
最小プレイアブルを成立させる。

### 必要シーン
- title (簡易でも可)
- gameplay
- game over

### 必要ループ
1. プレイヤーを spawn_pad 近辺に配置
2. datachip を一定間隔で出現
3. patrol drone を常時1-2体
4. chase drone を時間経過で追加
5. 取得で score 加算
6. 被弾で game over
7. retry で即再開

## Codex 実装順
1. タイルマップ表示
2. プレイヤー idle/move 接続
3. datachip 取得処理
4. patrol drone の巡回ロジック
5. chase drone の追尾ロジック
6. UI score / game over / retry
7. pickup / hit / explosion / spawn FX
8. ハイスコア保存

## 中期ワークスルー
### 面白さを作る追加
- danger timer を上げて敵増加
- hazard tile を点灯式のダメージ床にする
- energy cell を高得点 or 一時無敵に転用
- spawn fx を敵/アイテム登場に共通利用
- hit spark + explosion の重ね掛けで体感を強くする

### UI/UX
- HI-SCORE 常設
- START / RETRY の点滅
- 危険時 HUD 赤警告
- 連続取得コンボ表示

## 長期ワークスルー
### 拡張テーマ
- 赤警報区画
- 冷却区画
- 停電区画

### 拡張アセット
- タレット系敵
- レーザーゲート
- warning blink / charge FX
- タイトル画面
- リザルト画面
- コンボ / 実績 UI

## 重要メモ
- 今回のパックで最小プレイアブルは十分着手可能
- プレイヤーは今回 native raw sheet を追加した
- image generation 由来の大判PNGは参考資料として扱い、実装は native sheet を優先する
