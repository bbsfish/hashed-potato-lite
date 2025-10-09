class Crypto {
  constructor() {
    this.algorithm = {
      name: 'RSA-OAEP',
      modulusLength: 2048, // 鍵の長さ (ビット)
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    };
  }

  /**
   * Base64文字列をArrayBufferに変換する
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * ArrayBufferをBase64文字列に変換する
   * @private
   */
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * RSA-OAEPの公開鍵と秘密鍵のペアを生成する
   * @returns {Promise<CryptoKeyPair>} { publicKey, privateKey } を含むオブジェクト
   */
  async generateKeys() {
    const keys = await window.crypto.subtle.generateKey(
      this.algorithm,
      true, // 鍵がエクスポート可能かどうか
      ['encrypt', 'decrypt'] // 鍵の用途
    );
    return keys;
  }

  /**
   * 公開鍵を使用して文字列を暗号化する
   * @param {string} text - 暗号化する平文の文字列
   * @param {CryptoKey} publicKey - generateKeysで生成した公開鍵
   * @returns {Promise<string>} 暗号化され、Base64でエンコードされた文字列
   */
  async encrypt(text, publicKey) {
    // 文字列をArrayBufferに変換
    const encodedText = new TextEncoder().encode(text);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      encodedText
    );

    // 暗号化されたArrayBufferをBase64文字列に変換して返す
    return this._arrayBufferToBase64(encryptedBuffer);
  }

  /**
   * 秘密鍵を使用して暗号文を復号する
   * @param {string} encryptedBase64 - 暗号化されたBase64文字列
   * @param {CryptoKey} privateKey - generateKeysで生成した秘密鍵
   * @returns {Promise<string>} 復号された元の文字列
   */
  async decrypt(encryptedBase64, privateKey) {
    // Base64文字列をArrayBufferに変換
    const encryptedBuffer = this._base64ToArrayBuffer(encryptedBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedBuffer
    );

    // 復号されたArrayBufferを文字列に変換して返す
    return new TextDecoder().decode(decryptedBuffer);
  }

  /**
   * CryptoKeyオブジェクトをJWK(JSON Web Key)形式にエクスポートする
   * @param {CryptoKey} key - エクスポートするキー (公開鍵または秘密鍵)
   * @returns {Promise<object>} JWK形式のプレーンなJavaScriptオブジェクト
   */
  async exportKeyAsJwk(key) {
    return window.crypto.subtle.exportKey('jwk', key);
  }

  /**
   * JWKオブジェクトからCryptoKeyオブジェクトをインポート(復元)する
   * @param {object} jwk - インポートするJWKオブジェクト
   * @param {string[]} keyUsages - キーの用途 (例: ['encrypt'] or ['decrypt'])
   * @returns {Promise<CryptoKey>} 復元されたCryptoKeyオブジェクト
   */
  async importJwkAsKey(jwk, keyUsages) {
     return window.crypto.subtle.importKey(
      'jwk',
      jwk,
      this.algorithm,
      true,
      keyUsages
    );
  }
}

export default Crypto;
