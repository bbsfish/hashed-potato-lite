import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import {
  randomUUID,
  randomInt,
  pbkdf2Sync,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

// 常に配列としてパースする XML タグの一覧
const alwaysArray = [
  'root.head.options.column_alias.col',
  'root.head.options.column_order.col',
  'root.head.options.invisible_columns.col',
  'root.body.sequence.table',
  'root.body.tables.table',
  'root.body.tables.table.tbody.ac',
];

// XML パーサーとビルダーのオプション設定
const parserOptions = {
  ignoreAttributes: false,    // 属性値を有効化
  attributeNamePrefix: '_',   // 属性のプレフィックスを設定
  isArray: (_, tagPath) => {
    return alwaysArray.includes(tagPath);
  },
};
const builderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '_',
  format: true,               // 可読性の高いXMLを出力
};

// 暗号化関連の定数
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;             // GCMで推奨されるIV長 (96ビット)
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;            // AES-256 のキー長 (256ビット)
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000; // PBKDF2の反復回数

// ヘルパー関数
const getISOString = () => new Date().toISOString();
const getRandomUUID = () => randomUUID();
const getRandomInt = (min, max) => randomInt(min, max);

/**
 * @class DataHandle
 * @description XMLデータのパース、ビルド、基本操作を行うベースクラス
 */
class DataHandle {
  /**
   * @param {string} xmlString - パースする XML 文字列
   * @param {string} password - 復号に使用するパスワード
   * @param {Uint8Array} iv - 復号に使用する初期化ベクトル
   * @param {Uint8Array} salt - 復号に使用するソルト
   */
  constructor(xmlString = '', password = null, iv = null, salt = null) {
    this.parser = new XMLParser(parserOptions);
    this.builder = new XMLBuilder(builderOptions);

    if (!xmlString) {
      this.data = this._createInitialData();
      return;
    }

    this.data = this.parser.parse(xmlString);

    // is_encryptedがtrueで、復号に必要な情報がすべて提供されている場合に復号処理を実行
    if (this.data.root.head.is_encrypted && password && iv && salt) {
      try {
        const encryptedBodyB64 = this.data.root.body;
        const encryptedBodyWithAuthTag = Buffer.from(encryptedBodyB64, 'base64');
        
        // 認証タグと暗号化されたデータを分離
        const authTag = encryptedBodyWithAuthTag.slice(-AUTH_TAG_LENGTH);
        const encryptedBody = encryptedBodyWithAuthTag.slice(0, -AUTH_TAG_LENGTH);

        // パスワードからキーを導出
        const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
        
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        // AAD (追加認証データ) を設定
        decipher.setAAD(Buffer.from(this.data.root.head.file_id, 'utf8'));

        let decryptedBodyXml = decipher.update(encryptedBody, null, 'utf8');
        decryptedBodyXml += decipher.final('utf8');
        
        // 復号したXML (body部分) をパースして、元のデータにマージする
        const decryptedData = this.parser.parse(decryptedBodyXml);
        this.data.root.body = decryptedData.body;

      } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data. Check password or data integrity.');
      }
    }
  }

  /**
   * 初期データ構造を生成する
   * @private
   * @returns {object} 初期データオブジェクト
   */
  _createInitialData() {
    const now = getISOString();
    return {
      root: {
        head: {
          file_id: `HPLS-${getRandomUUID()}`,
          file_version: '1.0',
          file_title: '',
          file_description: '',
          created_at: now,
          updated_at: now,
          is_encrypted: false,
          options: {
            column_alias: { col: [] },
            column_order: { col: [] },
            invisible_columns: { col: [] },
          },
        },
        body: {
          sequence: { table: [] },
          tables: { table: [] },
        },
      },
    };
  }

  /**
   * 現在のデータを XML 文字列としてビルドする
   * @returns {string} XML 文字列
   */
  build() {
    // 更新日時を現在時刻に設定
    this.data.root.head.updated_at = getISOString();
    return this.builder.build(this.data);
  }

  /**
   * body 部分を暗号化して XML 全体をビルドする
   * @param {string} password - 暗号化に使用するパスワード
   * @returns {{xml: string, iv: Uint8Array, salt: Uint8Array}} 暗号化された XML 文字列、IV、salt
   */
  buildWithEncryption(password) {
    if (!password) {
      throw new Error('Password is required for encryption.');
    }

    // 1. 暗号化の準備 (saltとivを生成)
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // 2. パスワードからキーを導出
    const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');

    // 3. body部分のみをXML文字列としてビルド
    const bodyBuilder = new XMLBuilder({ format: false, ...builderOptions });
    const bodyXml = this.builder.build({ body: this.data.root.body });
    
    // 4. 暗号化処理
    const cipher = createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(this.data.root.head.file_id, 'utf8'));
    
    const encryptedBody = Buffer.concat([
      cipher.update(bodyXml, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    
    const encryptedBodyWithAuthTag = Buffer.concat([encryptedBody, authTag]);

    // 5. 元のデータを破壊しないように、bodyを一時的に退避・置換
    const originalBody = this.data.root.body;
    try {
      this.data.root.head.is_encrypted = true;
      this.data.root.body = encryptedBodyWithAuthTag.toString('base64');
      
      // 6. 全体をビルド (buildメソッド内でupdated_atが更新される)
      const finalXml = this.build();

      // 7. 生成したivとsaltを返却
      return {
        xml: finalXml,
        iv: new Uint8Array(iv),
        salt: new Uint8Array(salt),
      };
    } finally {
      // 8. 処理後、元のbodyオブジェクトに戻す
      this.data.root.body = originalBody;
      this.data.root.head.is_encrypted = false; // 状態を元に戻す
    }
  }

  /**
   * HeadData のインスタンスを取得する
   * @returns {HeadData}
   */
  getHead() {
    return new HeadData(this.data);
  }

  /**
   * BodyData のインスタンスを取得する
   * @returns {BodyData}
   */
  getBody() {
    return new BodyData(this.data);
  }
}

/**
 * @class HeadData
 * @description XMLのhead部分を操作するクラス
 * @extends DataHandle
 */
class HeadData extends DataHandle {
  constructor(data) {
    super();
    this.data = data;
    this.head = this.data.root.head;
  }

  // 各プロパティのゲッターとセッター
  get fileId() { return this.head.file_id; }
  get fileVersion() { return this.head.file_version; }
  set fileVersion(value) { this.head.file_version = value; }
  get fileTitle() { return this.head.file_title; }
  set fileTitle(value) { this.head.file_title = value; }
  get fileDescription() { return this.head.file_description; }
  set fileDescription(value) { this.head.file_description = value; }
  get createdAt() { return this.head.created_at; }
  get updatedAt() { return this.head.updated_at; }
  get isEncrypted() { return this.head.is_encrypted; }
  set isEncrypted(value) { this.head.is_encrypted = value; }

  // options 関連の操作
  getOptions() { return this.head.options; }
  setColumnAlias(columnId, alias) {
    // 設定が存在するかチェック
    const index = this.head.options.column_alias.col.findIndex((c) => c._id === columnId);
    // 存在しない場合は追加して、存在する場合は上書き
    if (index === -1) this.head.options.column_alias.col.push({ _id: columnId, '#text': alias });
    else this.head.options.column_alias.col[index]['#text'] = alias;
  }
  removeColumnAlias(columnId) {
    this.head.options.column_alias.col = this.head.options.column_alias.col.filter((c) => c._id !== columnId);
  }
  clearColumnAlias() { this.head.options.column_alias.col = []; }
  setColumnOrder(order) { this.head.options.column_order.col = order; }
  clearColumnOrder() { this.head.options.column_order.col = []; }
  setInvisibleColumn(columnId) {
    // 設定が存在するかチェック
    const index = this.head.options.invisible_columns.col.findIndex((c) => c._id === columnId);
    // 存在しない場合のみ追加
    if (index === -1) this.head.options.invisible_columns.col.push(columnId);
  }
  removeInvisibleColumn(columnId) {
    this.head.options.invisible_columns.col = this.head.options.invisible_columns.col.filter((c) => c._id !== columnId);
  }
  clearInvisibleColumns() { this.head.options.invisible_columns.col = []; }
}

/**
 * @class BodyData
 * @description XMLのbody部分を操作するクラス
 * @extends DataHandle
 */
class BodyData extends DataHandle {
  constructor(data) {
    super();
    this.data = data;
    this.body = this.data.root.body;
  }

  /**
   * テーブルを追加する
   * @param {string} tableName テーブル名
   * @param {string} tableSummary テーブル概要
   * @returns {TableData} 追加されたテーブルの TableData インスタンス
   */
  addTable(tableName = '', tableSummary = '') {
    const now = getISOString();

    // 一意のテーブル ID が生成されるまで繰り返す
    let tableId = '';
    do {
      tableId = `TBL-${String(getRandomInt(1000, 9999))}`;
    } while (this.body.sequence.table.some((t) => t._id === tableId));

    const newTable = {
      thead: {
        id: tableId,
        nm: tableName,
        sm: tableSummary,
        ca: now,
        ua: now,
      },
      tbody: { ac: [] },
    };

    this.body.tables.table.push(newTable);
    this.body.sequence.table.push({ _id: tableId, '#text': 0 });

    return new TableData(this.data, tableId);
  }

  /**
   * テーブル ID でテーブルを取得する
   * @param {string} tableId 
   * @returns {TableData|null}
   */
  getTableById(tableId) {
    const tableExists = this.body.sequence.table.some((t) => t._id === tableId);
    return tableExists ? new TableData(this.data, tableId) : null;
  }

  /**
   * すべてのテーブルを取得する
   * @returns {TableData[]}
   */
  getTables() {
    return this.body.sequence.table.map((t) => new TableData(this.data, t._id));
  }

  /**
   * テーブルの新しいシリアル番号を取得し、更新する
   * @param {string} tableId 
   * @returns {number}
   */
  _getNewSerialNumber(tableId) {
    const seq = this.body.sequence.table.find((t) => t._id === tableId);
    if (seq) {
      seq['#text'] += 1;
      return seq['#text'];
    }
    throw new Error(`Sequence for table ID '${tableId}' not found.`);
  }
}

/**
 * @class TableData
 * @description 特定のテーブルを操作するクラス
 * @extends BodyData
 */
class TableData extends BodyData {
  constructor(data, tableId) {
    super(data);
    this.tableId = tableId;
    this.table = this.body.tables.table.find((t) => t.thead.id === tableId);
    if (!this.table) {
      throw new Error(`Table with ID '${tableId}' not found.`);
    }
  }

  /**
   * アカウントを追加する
   * @param {object} accountInfo - アカウント情報
   * @returns {AccountData}
   */
  addAccount(accountInfo) {
    const requiredFields = ['nm', 'it', 'ct', 'sm', 'st'];
    for (const field of requiredFields) {
      if (!accountInfo.hasOwnProperty(field)) {
        throw new Error(`Missing required field in account data: ${field}`);
      }
    }

    const now = getISOString();
    const newSn = this._getNewSerialNumber(this.tableId);

    const newAccount = {
      sn: newSn,
      ca: now,
      ua: now,
      ...accountInfo
    };

    this.table.tbody.ac.push(newAccount);
    this.table.thead.ua = now; // テーブルの更新日時を更新

    return new AccountData(this.data, this.tableId, newSn);
  }

  /**
   * シリアル番号でアカウントを取得する
   * @param {number} sn 
   * @returns {AccountData|null}
   */
  getAccountBySn(sn) {
    const accountExists = this.table.tbody.ac.some((a) => a.sn === sn);
    return accountExists ? new AccountData(this.data, this.tableId, sn) : null;
  }

  /**
   * テーブル内のすべてのアカウントを取得する
   * @returns {AccountData[]}
   */
  getAccounts() {
    return this.table.tbody.ac.map((a) => new AccountData(this.data, this.tableId, a.sn)) || [];
  }

  // テーブルメタデータのゲッター
  get name() { return this.table.thead.nm; }
  get summary() { return this.table.thead.sm; }
  get id() { return this.table.thead.id; }
  get createdAt() { return this.table.thead.ca; }
  get updatedAt() { return this.table.thead.ua; }
}

/**
 * @class AccountData
 * @description 特定のアカウントを操作するクラス
 * @extends TableData
 */
class AccountData extends TableData {
  constructor(data, tableId, sn) {
    super(data, tableId);
    this.sn = sn;
    this.account = this.table.tbody.ac.find((a) => a.sn === sn);
    if (!this.account) {
      throw new Error(`Account with SN '${sn}' not found in table '${tableId}'.`);
    }
  }

  /**
   * アカウントデータを更新する
   * @param {object} newInfo - 更新する情報
   */
  update(newInfo) {
    Object.assign(this.account, newInfo);
    const now = getISOString();
    this.account.ua = now;      // アカウントの更新日時を更新
    this.table.thead.ua = now;  // テーブルの更新日時を更新
  }

  /**
   * アカウントの全データを取得する
   * @returns {object}
   */
  getData() {
    return this.account;
  }

  // 各プロパティのゲッター
  get serialNumber() { return this.account.sn; }
  get serviceName() { return this.account.nm; }
  get initial() { return this.account.it; }
  get category() { return this.account.ct; }
  get summary() { return this.account.sm; }
  get status() { return this.account.st; }
  get createdAt() { return this.account.ca; }
  get updatedAt() { return this.account.ua; }
  // ... 必要に応じて他のプロパティのゲッターを追加
}

export {
  DataHandle,
  HeadData,
  BodyData,
  TableData,
  AccountData,
};