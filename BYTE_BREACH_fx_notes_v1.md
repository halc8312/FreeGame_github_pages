# BYTE BREACH FX 実装メモ v1

## 作成物
- fx_pickup_sheet.png
- fx_hit_spark_sheet.png
- fx_explosion_sheet.png
- fx_spawn_sheet.png

## 直近ワークスルー
### 最小プレイアブルで使うもの
- pickup: データチップ / エネルギーセル取得時
- hit spark: プレイヤー被弾時
- explosion: ドローン破壊やダウン演出補助
- spawn: アイテム出現 / 敵出現 / 開始地点演出

### 推奨
- pickup: 4f / 10-14 fps
- hit spark: 4f / 12-16 fps
- explosion: 5f / 10-14 fps
- spawn: 4f / 8-12 fps

## 中期ワークスルー
- warning blink を追加して危険予告を明確化
- laser charge effect を追加して読み合いを強化
- combo popup と連携して気持ちよさを増幅
- 取得時の色違いで通常 / 高得点アイテムを見分けやすくする

## 長期ワークスルー
- ボス級ギミック用の大型FX
- 施設テーマ別の色差分
- UI演出と同期する全画面フラッシュ
- BGM/SE同期の拍点滅

## 実装注意
- すべて 16x16 ベース、背景透過
- pickup / spawn は加算風に扱うと相性が良い
- hit / explosion は短命で素早く消す
- プレイヤー down 演出と explosion を重ねても使える
