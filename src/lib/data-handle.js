import { XMLParser, XMLBuilder } from 'fast-xml-parser';

class DataHandle {
  constructor() {
    const alwaysArray = [
      'root.body.tables.table_data',
      'root.body.tables.table_data.tbody.accounts.account_data',
      'root.body.tables.table_data.tbody.emails.email_data',
      'root.body.tables.table_data.tbody.passwords.password_data',
    ];
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      isArray: (name, jpath) => alwaysArray.includes(jpath),
    });
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });
    this.jsonData = null;
  }

  /**
   * XMLデータをインポートしてJSONデータに変換する
   * @param {string} xmlData - XML形式の文字列データ
   */
  importXml(xmlData) {
    try {
      this.jsonData = this.parser.parse(xmlData);
      // last_accessed_at を更新
      this.updateLastAccessed();
    } catch (error) {
      console.error('XML parsing error:', error);
      this.jsonData = null;
    }
  }

  /**
   * 現在のJSONデータをXML文字列としてエクスポートする
   * @returns {string|null} XML形式の文字列データ、またはデータがない場合はnull
   */
  exportXml() {
    if (!this.jsonData) return null;
    try {
      return this.builder.build(this.jsonData);
    } catch (error) {
      console.error('XML building error:', error);
      return null;
    }
  }

  /**
   * 新しいデータ構造を作成する
   * @param {boolean} encryptionEnabled - 暗号化が有効かどうか
   */
  createNewData(encryptionEnabled = false) {
    const now = new Date().toISOString();
    this.jsonData = {
      root: {
        head: {
          file_id: `STR-${crypto.randomUUID()}`,
          created_at: now,
          updated_at: now,
          last_accessed_at: now,
          encryption_enabled: encryptionEnabled,
        },
        body: {
          tables: {
            table_data: [],
          },
        },
      },
    };
  }

  /**
   * ファイルの更新日時と最終アクセス日時を更新する
   * @private
   */
  _updateTimestamps() {
    const now = new Date().toISOString();
    this.jsonData.root.head.updated_at = now;
    this.jsonData.root.head.last_accessed_at = now;
  }

  /**
   * 最終アクセス日時を更新する
   */
  updateLastAccessed() {
    if (this.jsonData && this.jsonData.root && this.jsonData.root.head) {
      this.jsonData.root.head.last_accessed_at = new Date().toISOString();
    }
  }

  /**
   * 新しいテーブルを作成する
   * @param {string} tableName - 新しいテーブルの名前
   * @param {boolean} encryptionEnabled - 暗号化が有効かどうか
   * @returns {string|null} 作成されたテーブルのID、または失敗した場合はnull
   */
  createTable(tableName, encryptionEnabled = false) {
    if (!this.jsonData) return null;

    // table_dataが配列であることを保証する
    if (!this.jsonData.root.body.tables) {
        this.jsonData.root.body.tables = { table_data: [] };
    } else if (!Array.isArray(this.jsonData.root.body.tables.table_data)) {
        this.jsonData.root.body.tables.table_data = [];
    }

    const now = new Date().toISOString();
    const tableId = `TBL-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const newTable = {
      thead: {
        table_name: tableName,
        table_id: tableId,
        created_at: now,
        updated_at: now,
        encryption_enabled: encryptionEnabled,
      },
      tbody: {
        accounts: { account_data: [] },
        emails: { email_data: [] },
        passwords: { password_data: [] },
      },
    };

    this.jsonData.root.body.tables.table_data.push(newTable);
    this._updateTimestamps();
    return tableId;
  }

  /**
   * テーブルを更新する
   * @param {string} tableId - 更新するテーブルのID
   * @param {object} updates - 更新する情報（例: { table_name: '新しい名前' }）
   * @returns {boolean} 成功した場合はtrue、失敗した場合はfalse
   */
  updateTable(tableId, updates) {
    const table = this._findTable(tableId);
    if (!table) return false;

    Object.assign(table.thead, updates);
    table.thead.updated_at = new Date().toISOString();
    this._updateTimestamps();
    return true;
  }

  /**
   * テーブルを削除する
   * @param {string} tableId - 削除するテーブルのID
   * @returns {boolean} 成功した場合はtrue、失敗した場合はfalse
   */
  deleteTable(tableId) {
    if (!this.jsonData) return false;
    const tables = this.jsonData.root.body.tables.table_data;
    const index = tables.findIndex(t => t.thead.table_id === tableId);

    if (index === -1) return false;

    tables.splice(index, 1);
    this._updateTimestamps();
    return true;
  }

  /**
   * 新しいアカウントデータを追加する
   * @param {string} tableId - 追加先のテーブルID
   * @param {object} accountData - 追加するアカウントデータ
   * @returns {number|null} 作成されたアカウントのシリアルナンバー、または失敗した場合はnull
   */
  createAccount(tableId, accountData) {
    const table = this._findTable(tableId);
    if (!table) return null;

    // Defensive checks to ensure the data structure exists
    if (!table.tbody) {
        table.tbody = { accounts: { account_data: [] }, emails: { email_data: [] }, passwords: { password_data: [] } };
    }
    if (!table.tbody.accounts) {
        table.tbody.accounts = { account_data: [] };
    }
    if (!Array.isArray(table.tbody.accounts.account_data)) {
        table.tbody.accounts.account_data = [];
    }

    const accounts = table.tbody.accounts.account_data;
    const serialNumber = accounts.length > 0 ? Math.max(...accounts.map(a => a.serial_number)) + 1 : 1;
    const now = new Date().toISOString();

    const newAccount = {
      serial_number: serialNumber,
      ...accountData,
      created_at: now,
      updated_at: now,
    };

    accounts.push(newAccount);
    table.thead.updated_at = now;
    this._updateTimestamps();
    return serialNumber;
  }

  /**
   * アカウントデータを更新する
   * @param {string} tableId - テーブルID
   * @param {number} serialNumber - アカウントのシリアルナンバー
   * @param {object} updates - 更新する情報
   * @returns {boolean} 成功した場合はtrue、失敗した場合はfalse
   */
  updateAccount(tableId, serialNumber, updates) {
    const account = this._findAccount(tableId, serialNumber);
    if (!account) return false;

    Object.assign(account, updates);
    account.updated_at = new Date().toISOString();
    this._findTable(tableId).thead.updated_at = new Date().toISOString();
    this._updateTimestamps();
    return true;
  }

  /**
   * アカウントデータを削除する
   * @param {string} tableId - テーブルID
   * @param {number} serialNumber - 削除するアカウントのシリアルナンバー
   * @returns {boolean} 成功した場合はtrue、失敗した場合はfalse
   */
  deleteAccount(tableId, serialNumber) {
    const table = this._findTable(tableId);
    if (!table) return false;

    const accounts = table.tbody.accounts.account_data;
    const index = accounts.findIndex(a => a.serial_number === serialNumber);

    if (index === -1) return false;

    accounts.splice(index, 1);

    // 関連するemailとpasswordも削除
    table.tbody.emails.email_data = table.tbody.emails.email_data.filter(e => e.serial_number !== serialNumber);
    table.tbody.passwords.password_data = table.tbody.passwords.password_data.filter(p => p.serial_number !== serialNumber);

    table.thead.updated_at = new Date().toISOString();
    this._updateTimestamps();
    return true;
  }

  // 同様に、createEmail, updateEmail, deleteEmail, createPassword, updatePassword, deletePassword を実装
  /**
   * メールアドレスデータを追加する
   * @param {string} tableId - テーブルID
   * @param {object} emailData - 追加するメールアドレスデータ
   * @returns {boolean}
   */
  createEmail(tableId, emailData) {
    const table = this._findTable(tableId);
    if (!table) return false;
    table.tbody.emails.email_data.push(emailData);
    this._updateTimestamps();
    return true;
  }

  /**
   * パスワードデータを追加する
   * @param {string} tableId - テーブルID
   * @param {object} passwordData - 追加するパスワードデータ
   * @returns {boolean}
   */
  createPassword(tableId, passwordData) {
    const table = this._findTable(tableId);
    if (!table) return false;
    const now = new Date().toISOString();
    const newPassword = {
      ...passwordData,
      created_at: now,
      updated_at: now,
    };
    table.tbody.passwords.password_data.push(newPassword);
    this._updateTimestamps();
    return true;
  }


  /**
   * テーブルをIDで検索する
   * @private
   * @param {string} tableId - 検索するテーブルのID
   * @returns {object|undefined} 見つかったテーブルオブジェクト
   */
  _findTable(tableId) {
    if (!this.jsonData) return undefined;
    if (!this.jsonData.root.body.tables.table_data) return undefined;
    return this.jsonData.root.body.tables.table_data.find(
      t => t.thead.table_id === tableId
    );
  }

  /**
   * アカウントをシリアルナンバーで検索する
   * @private
   * @param {string} tableId - テーブルID
   * @param {number} serialNumber - 検索するアカウントのシリアルナンバー
   * @returns {object|undefined} 見つかったアカウントオブジェクト
   */
  _findAccount(tableId, serialNumber) {
    const table = this._findTable(tableId);
    if (!table || !table.tbody || !table.tbody.accounts || !table.tbody.accounts.account_data) return undefined;
    return table.tbody.accounts.account_data.find(
      a => a.serial_number === serialNumber
    );
  }
}

export default DataHandle;