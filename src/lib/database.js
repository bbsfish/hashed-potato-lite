/**
 * @typedef {object} State
 * @property {string} key - キー
 * @property {any} value - 値
 */

class Database {
  /**
   * @param {string} dbName データベース名
   * @param {number} version データベースのバージョン
   */
  constructor(dbName = 'webchat.db', version = 2) { // バージョンを2に更新
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  /**
   * データベースへの接続を開き、初期化する
   * @returns {Promise<IDBDatabase>} データベースインスタンス
   */
  async open() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // messages オブジェクトストア
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
        }
        // clients オブジェクトストア
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }
        // state オブジェクトストア
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * 指定されたオブジェクトストアでトランザクションを実行する
   * @private
   * @param {string} storeName オブジェクトストア名
   * @param {'readonly' | 'readwrite'} mode トランザクションモード
   * @param {(store: IDBObjectStore) => IDBRequest} callback 実行する処理
   * @returns {Promise<any>} 処理結果
   */
  async _execute(storeName, mode, callback) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('Transaction error:', request.error);
        reject(request.error);
      };
    });
  }

  // --- State ---

  /**
   * アプリケーションの状態を保存/更新する
   * @param {string} key - 状態のキー
   * @param {any} value - 保存する値
   * @returns {Promise<void>}
   */
  async setState(key, value) {
    return this._execute('state', 'readwrite', store => store.put({ key, value }));
  }

  /**
   * アプリケーションの状態を取得する
   * @param {string} key - 状態のキー
   * @returns {Promise<any | undefined>} 状態の値
   */
  async getState(key) {
    const result = await this._execute('state', 'readonly', store => store.get(key));
    return result ? result.value : undefined;
  }

  /**
   * stateストアのすべてのキーを取得する
   * @returns {Promise<IDBValidKey[]>}
   */
  async getKeys() {
    return this._execute('state', 'readonly', store => store.getAllKeys());
  }

  /**
   * stateストアのすべてのデータを削除する
   * @returns {Promise<void>}
   */
  async clearStates() {
    return this._execute('state', 'readwrite', store => store.clear());
  }
}

export default Database;