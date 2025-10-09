/**
 * @typedef {object} State
 * @property {string} key - キー
 * @property {any} value - 値
 */

/**
 * @typedef {object} FileData
 * @property {string} id - 一意のID
 * @property {FileSystemFileHandle} handle - FileSystemAccess APIのファイルハンドル
 * @property {string} name - ファイル名
 * @property {Date} created_at - 作成日時
 * @property {Date} updated_at - 更新日時
 */

class Database {
  /**
   * @param {string} dbName データベース名
   * @param {number} version データベースのバージョン
   */
  constructor(dbName = 'hashed-potato-lite.db', version = 1) {
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
        // state オブジェクトストア
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'key' });
        }
        // files オブジェクトストア (新規追加)
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
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

  // --- Files (新規追加) ---

  /**
   * すべてのファイルデータを取得する
   * @returns {Promise<FileData[]>}
   */
  async getAllFiles() {
    return this._execute('files', 'readonly', store => store.getAll());
  }

  /**
   * 新しいファイルデータを追加する (IDの重複チェック付き)
   * @param {string} id - 一意のID
   * @param {FileSystemFileHandle} handle - ファイルハンドル
   * @param {string} name - ファイル名
   * @returns {Promise<string>} 追加されたデータのID
   */
  async addFile(id, handle, name) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          reject(new Error(`File with id "${id}" already exists.`));
          transaction.abort();
          return;
        }

        const now = new Date();
        const newFile = { id, handle, name, created_at: now, updated_at: now };
        const addRequest = store.add(newFile);
        addRequest.onsuccess = () => resolve(addRequest.result);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }
  
  /**
   * ファイルデータを更新する
   * @param {string} id - 更新するデータのID
   * @param {Partial<Pick<FileData, 'name' | 'handle'>>} updates - 更新する情報
   * @returns {Promise<string>} 更新されたデータのID
   */
  async updateFile(id, updates) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('files', 'readwrite');
        const store = transaction.objectStore('files');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const existingData = getRequest.result;
            if (!existingData) {
                reject(new Error(`File with id "${id}" not found.`));
                transaction.abort();
                return;
            }

            const updatedData = {
                ...existingData,
                ...updates,
                updated_at: new Date(),
            };

            const putRequest = store.put(updatedData);
            putRequest.onsuccess = () => resolve(putRequest.result);
        };

        transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 指定したIDのファイルデータを削除する
   * @param {string} id - 削除するデータのID
   * @returns {Promise<void>}
   */
  async deleteFile(id) {
    return this._execute('files', 'readwrite', store => store.delete(id));
  }

  /**
   * すべてのファイルデータを削除する
   * @returns {Promise<void>}
   */
  async clearFiles() {
    return this._execute('files', 'readwrite', store => store.clear());
  }
}

export default Database;