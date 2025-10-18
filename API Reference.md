## TOTP Registration
ユーザデバイスを登録する。アクセス情報の保存、秘密鍵の生成・保存・更新を行う。
### エンドポイント
`https://script.google.com/macros/s/AKfycbzH3DaV3YEHev05MGCn7zHUllL_srldkn54T6K4PHuUDhq1mdOCYW-2jwDsSPT1rB0jCw/exec`
### パラメータ
+ `file_id`*: ローカルファイルを一意に識別する `HPL` から始まる UUID 文字列
+ `ip_address`*: 接続元の IP アドレス文字列
+ `region`*: 接続元の地域文字列
+ `is_key_update`: 任意。サーバに保存された秘密鍵を更新するかどうか
+ `user_label`: 任意。認証アプリに表示されるユーザ名
### 戻り値
+ `status`: 処理結果。成功時には`success`が、失敗時には`error`が入る
+ `otpauth_url`: 成功時にのみ入る。ユーザデバイス登録用の URL 文字列
+ `message`: 失敗時にのみ入る。エラーメッセージ文字列

## TOTP Verification
ユーザデバイスに表示されたワンタイムパスワードを検証する。検証に成功したら該当する暗号化パスワードを返す。アクセス情報の保存、トークンの検証、暗号化パスワードの取得を行う。
### エンドポイント
`https://script.google.com/macros/s/AKfycbzi-lNq1i57E04iEB00tY7b7Q67SxGZFvFS_4W0prxZzbEppQqYPGl5TLl7kmDz0XVClA/exec`
### パラメータ
+ `file_id`*: ローカルファイルを一意に識別する `HPL` から始まる UUID 文字列
+ `mode`*: 動作モード。`encrypt`または`decrypt`を入れる
+ `token`*: ワンタイムパスワード
+ `ip_address`*: 接続元の IP アドレス文字列
+ `region`*: 接続元の地域文字列
### 戻り値
+ `status`: 処理結果。成功時には`success`が、失敗時には`error`が入る
+ `server_password`: 成功時にのみ入る。暗号化のためのサーバーパスワード文字列
+ `iv_base64`: 成功時にのみ入る。暗号化のためのサーバーパスワード文字列
+ `salt_base64`: 成功時にのみ入る。暗号化のためのサーバーパスワード文字列
+ `message`: 失敗時にのみ入る。エラーメッセージ文字列

## Cipher Registration
ローカルファイルに紐づいた暗号情報を保存する
### エンドポイント
`https://script.google.com/macros/s/AKfycbxJAaOwe97IjZ7jCUbB8LZJY7w91q_gqOb22ly7Z6lWaS7n7_4oKG3l_0S5ir7tI9qMaQ/exec`
### パラメータ
+ `file_id`*: ローカルファイルの UUID 文字列
+ `iv_base64`*: Base64 エンコードされた暗号化初期ベクトル
+ `salt_base64`*: Base64 エンコードされた暗号化ソルト
### 戻り値
+ `status`: 処理結果。成功時には`success`が、失敗時には`error`が入る
+ `message`: 失敗時にのみ入る。エラーメッセージ文字列

## Send Mail
### エンドポイント
`https://script.google.com/macros/s/AKfycbx8u4yx0xKVSVPSeqNaW1KoBmj75GJLBZt09XhYutkNQHDCq5qZObjKH16Pftdjor_Ojg/exec`
### パラメータ
+ `token`*: ローカルファイルの UUID 文字列
+ `file_id`*: ローカルファイルの UUID 文字列
+ `subject`*: ローカルファイルの UUID 文字列
+ `message`*: ローカルファイルの UUID 文字列
### 戻り値