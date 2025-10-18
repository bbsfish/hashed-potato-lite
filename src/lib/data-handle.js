import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// 常に配列としてパースする XML タグの一覧
const alwaysArray = [
  'root.head.options.column_alias.col',
  'root.head.options.column_order.col',
  'root.head.options.invisible_columns.col',
  'root.body.sequence.table',
  'sequence.table',
  'root.body.tables.table',
  'tables.table',
  'root.body.tables.table.tbody.ac',
  'tables.table.tbody.ac',
  'root.body.tables.table.tbody.ac.em',
  'tables.table.tbody.ac.em',
  'root.body.tables.table.tbody.ac.pw',
  'tables.table.tbody.ac.pw',
];

// XML パーサーとビルダーのオプション設定およびインスタンス
const fxp = {
  parser: new XMLParser({
    ignoreAttributes: false,    // 属性値を有効化
    attributeNamePrefix: '_',   // 属性のプレフィックスを設定
    numParseOptions:{
      leadingZeros: true,
    },
    isArray: (_, tagPath) => {
      return alwaysArray.includes(tagPath);
    },
  }),
  builder: new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '_',
    format: true,               // 可読性の高いXMLを出力
  }),
  nonFormatBuilder: new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '_',
  }),
}

// ユーティリティ関数群
const getISOString = () => new Date().toISOString();
const getRandomUUID = () => window.crypto.randomUUID();
const getRandomInt = (min, max) => Math.floor(Math.random() * (1 + max - min)) + min;

/**
 * UUID を Base58 にエンコードする
 * @param {string} uuid - エンコードする UUID
 * @returns {string} Base58 エンコードされた UUID
 */
function uuidToBase58(uuid) {
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  const bytes = (() => {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  })();

  let num = BigInt('0x' + [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  while (num > 0n) {
    const remainder = num % 58n;
    result = base58Chars[Number(remainder)] + result;
    num = num / 58n;
  }

  for (const byte of bytes) {
    if (byte === 0) result = '1' + result;
    else break;
  }

  return result;
}

/** 
 * Base64 文字列を ArrayBuffer に変換する
 * @param {string} 対象となる Base64 文字列
 * @return {ArrayBuffer} 変換された ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/** 
 * ArrayBuffer を Base64 文字列に変換する
 * @param {ArrayBuffer} 対象となる ArrayBuffer
 * @return {string} 変換された Base64 文字列
 */
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/** AES の鍵を導出する
 * @param {ArrayBuffer|TypedArray} password
 * @param {ArrayBuffer|TypedArray} salt
 * @returns {CryptoKey} AES-256-GCM の鍵
 */
async function deriveKey(password, salt) {
  console.debug('deriveKey', { password, salt });
  const passwordKey = await window.crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveKey']);
  const algorithm = {
    name: 'PBKDF2',
    salt,
    iterations: 200000,
    hash: 'SHA-256',
  }
  const derivedKeyAlgorithm = {
    name: 'AES-GCM',
    length: 256,
  }
  const key = await window.crypto.subtle.deriveKey(algorithm, passwordKey, derivedKeyAlgorithm, true, ['encrypt', 'decrypt']);
  return key;
}

/** パスワードを用いて文字列を暗号化する
 * @param {string} message 暗号化するメッセージ
 * @param {string} password パスワード
 * @param {string} additionalAuthenticatedData 追加認証データ
 * @return {{cipher: ArrayBuffer, iv: Uint8Array, salt: Uint8Array}} 暗号化データ
 */
async function encrypt(message, password, additionalAuthenticatedData) {
  console.debug('encrypt', { message, password, additionalAuthenticatedData });
  // パスワード、メッセージ、追加認証データを TypedArray に
  const msg = new TextEncoder().encode(message);
  const pwd = new TextEncoder().encode(password);
  const aad = new TextEncoder().encode(additionalAuthenticatedData);

  // 鍵導出用の salt を生成
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // パスワードと salt から鍵を導出する
  const key = await deriveKey(pwd, salt);

  // 初期ベクトルを生成
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 暗号化を実行
  const algorithm = {
    name: 'AES-GCM',
    iv: iv,
    tagLength: 128,       // GCMモードの改ざんチェック用データの長さ
    additionalData: aad,  // GCMモードのAAD（追加認証データ）
  }
  const cipher = await window.crypto.subtle.encrypt(algorithm, key, msg);

  // 初期ベクトル、salt、暗号文を出力
  return {
    iv,
    salt,
    cipher
  }
}

/** 暗号文を salt、iv、パスワードで複合化する
 * @param {ArrayBuffer} cipher 暗号化されたメッセージ
 * @param {Uint8Array} iv 初期ベクトル
 * @param {Uint8Array} salt ソルト
 * @param {string} password パスワード
 * @param {string} additionalAuthenticatedData 追加認証データ
 * @returns {string} 復号されたメッセージ
 */
async function decrypt(cipher, iv, salt, password, additionalAuthenticatedData) {
  console.debug('decrypt', { cipher, iv, salt, password, additionalAuthenticatedData });
  // パスワードおよび追加認証データを TypedArray に
  const pwd = new TextEncoder().encode(password);
  const aad = new TextEncoder().encode(additionalAuthenticatedData);

  // パスワードと salt から鍵を導出する
  const key = await deriveKey(pwd, salt);

  // 復号する
  const algorithm = {
    name: "AES-GCM",
    iv,
    tagLength: 128,
    additionalData: aad,
  }
  console.debug('decrypt', { algorithm, key, cipher });
  const buffer = await window.crypto.subtle.decrypt(algorithm, key, base64ToArrayBuffer(cipher));
  return new TextDecoder().decode(buffer);
}


/**
 * @class DataHandle
 * @description XMLデータのパース、ビルド、基本操作を行うベースクラス
 */
class DataHandle {
  /**
   * @param {object} [parsedXmlData=null] - パースされた XML データ、未指定の場合は新規作成
   * @param {Uint8Array} saltBase64 - 復号に使用するソルト
   */
  constructor(parsedXmlData = null) {
    // 新規作成時は、データを初期化して終了
    if (!parsedXmlData) {
      this.data = this._createInitialData();
      return;
    }
    // データが注入されたらそのまま代入する
    else {
      this.data = parsedXmlData;
    }
    console.debug('[DataHandle] data at creating instance:', this.data);
  }

  static isEncryptedXml(xmlString) {
    const data = fxp.parser.parse(xmlString);
    return (data?.root?.head?.is_encrypted) ? true : false;
  }

  static isPlainXml(xmlString) {
    const data = fxp.parser.parse(xmlString);
    return (data?.root?.head?.is_encrypted) ? false : true;
  }

  static getFileIdFromXml(xmlString) {
    const data = fxp.parser.parse(xmlString);
    return data?.root?.head?.file_id || null;
  }

  /**
   * XML データをインポートして、パースする
   * @param {string} xmlString XML データ
   * @param {string} [completePassword=null] 複合化のためのパスワード（暗号化してる場合に必要）
   * @param {string} [ivBase64=null] 初期ベクトル （暗号化してる場合に必要）
   * @param {string} [saltBase64=null] ソルト（暗号化してる場合に必要） 
   * @return {DataHandle} DataHandle インスタンス
   */
  static async import(xmlString, password = null, ivBase64 = null, saltBase64 = null) {
    // 1. 初回のパース
    const data = fxp.parser.parse(xmlString);
    if (Object.keys(data).length === 0) throw new Error('ファイルデータのパースに失敗しました');

    // 2-1. 暗号化がオフの場合はそのまま DataHandle インスタンスを返す
    if (!data.root.head.is_encrypted) return new DataHandle(data);

    // 2-2. 暗号化がオンでも、必要な情報が足りなかったらエラーを起こす
    else if (!password || !ivBase64 || !saltBase64) throw new Error('password, ivBase64 and saltBase64 are required');

    // 2-3. 暗号化がオンで、復号に必要な情報がすべて提供されている場合に復号処理を実行
    try {
      const iv = base64ToArrayBuffer(ivBase64);
      const salt = base64ToArrayBuffer(saltBase64);
      const bodyXml = await decrypt(data.root.body.trim(), iv, salt, password, data.root.head.file_id);

      // 復号したXML（body部分）をパースして、元のデータにマージする
      data.root.body = fxp.parser.parse(bodyXml);

      return new DataHandle(data);
    } catch (err) {
      console.error(err);
      throw new Error('データの復号に失敗しました。パスワードが正しいか確認してください');
    }
  }

  /**
   * XML データをビルドして、エクスポートする
   * @param {string} [password=null] 暗号化のためのパスワード（暗号化する場合に必要）
   * @return {{ xml: string, ivBase64: string, saltBase64: string }} エクスポート情報
   */
  async export(password = null) {
    console.debug('[DataHandle] Building data:', this.data);
    // 暗号化が有効の場合、ヘッダ情報を更新する
    if (password) this.data.root.head.is_encrypted = true;
    
    // 1-1. 更新日時およびバージョン情報を更新する
    this.data.root.head.updated_at = getISOString();
    this.data.root.head.file_version = (() => {
      const ver = this.data.root.head.file_version;
      const sysVer = ver.split('.')[0];
      const localVer = Number(ver.split('.')[1]);
      return `${sysVer}.${localVer + 1}`;
    })();

    // 2-1. 暗号化がオフの場合はそのままビルドして終了
    if (!this.data.root.head.is_encrypted) return {
      xml: fxp.builder.build(this.data),
      ivBase64: null,
      saltBase64: null,
    }

    // 2-2. 暗号化がオンでも、パスワードがなければエラーを起こす
    else if (!password) throw new Error('password is required.');

    // 2-3. 暗号化がオンで、パスワードがあれば、暗号化処理を実行
    const targetXml = fxp.nonFormatBuilder.build(this.data.root.body);
    const { iv, salt, cipher } = await encrypt(targetXml, password, this.data.root.head.file_id);

    // 3. 暗号化されたデータを含めて再度 XML をビルド
    const exportData = {
      root: {
        head: this.data.root.head,
        body: arrayBufferToBase64(cipher),
      },
    };
    const exportXml = fxp.builder.build(exportData);

    console.debug('DataHandle.data[4]', exportXml);
    // 4. XML、iv（Base64）、salt（Base64）を返す
    return {
      xml: exportXml,
      ivBase64: arrayBufferToBase64(iv),
      saltBase64: arrayBufferToBase64(salt),
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
          file_id: `HPL-${getRandomUUID()}`,
          file_version: 'v1.0',
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
    super(data);
    this.head = this.data.root.head;
    console.debug('[DataHandle.HeadData] data at creating instance:', this.data);
  }

  // 各プロパティのゲッターとセッター
  get fileId() { return this.head.file_id; }
  get fileSId() { return 'S' + uuidToBase58(this.head.file_id.replace('HPL-', '')); }
  get fileVersion() {
    const ver = String(this.data.root.head.file_version);
    // バージョン形式が X の場合は小数部分に 0 を付与して X.0 に変換
    if (ver.match(/^\d+$/)) return `${ver}.0`;
    // バージョン形式が X.Y の場合はそのまま返す
    return ver;
  }
  set fileVersion(v) { this.head.file_version = v; }
  get fileSystemVersion() { return Number(this.fileVersion.split('.')[0].replace('v', '')); }
  get fileLocalVersion() { return Number(this.fileVersion.split('.')[1]); }
  get fileTitle() { return this.head.file_title; }
  set fileTitle(v) { this.head.file_title = v; }
  get fileDescription() { return this.head.file_description; }
  set fileDescription(v) { this.head.file_description = v; }
  get createdAt() { return new Date(this.head.created_at); }
  get updatedAt() { return new Date(this.head.updated_at); }
  get isEncrypted() { return this.head.is_encrypted; }
  set isEncrypted(v) { this.head.is_encrypted = v; }

  /**
   * OptionsData のインスタンスを取得する
   * @returns {OptionsData}
   */
  getOptions() {
    return new OptionsData(this.data);
  }
}

/**
 * @class OptionsData
 * @description XML の head.options 部分を操作するクラス
 * @extends HeadData
 */
class OptionsData extends HeadData {
  constructor(data) {
    super(data);
    this.options = this.data.root.head.options;
  }

  get columnAlias() {
    // column_alias が設定されている場合、既定の形式にフォーマットして返す
    if (this.options.column_alias.col) {
      return this.options.column_alias.col.map((c) => ({ id: c._id, alias: c['#text'] }));
    };
    // それ以外は空配列を返す
    return [];
  }
  get columnOrder() {
    // column_order が設定されている場合はそのまま返す。それ以外は空配列を返す
    return this.options.column_order.col || [];
  }
  get invisibleColumns() {
    // invisible_columns が設定されている場合はそのまま返す。それ以外は空配列を返す
    return this.options.invisible_columns.col || [];
  }

  /**
   * エイリアス名を設定する
   * @param {{id: string, alias: string}} data 設定するカラム ID とエイリアス 
   */
  setColumnAlias({ id, aliasText }) {
    // 設定が存在するかチェック
    const index = this.columnAlias.findIndex((c) => c.id === id);
    // 存在しない場合は追加して、存在する場合は上書き
    if (index === -1) this.head.options.column_alias.col.push({ _id: id, '#text': aliasText });
    else this.head.options.column_alias.col[index]['#text'] = aliasText;
  }

  /**
   * エイリアス名を削除する
   * @param {string} id 削除するカラム ID 
   */
  removeColumnAlias(id) {
    this.head.options.column_alias.col = this.columnAlias.filter((c) => c.id !== id);
  }

  /**
   * エイリアス名を全て削除する
   */
  clearColumnAlias() { this.head.options.column_alias.col = []; }

  /**
   * カラムの順番を設定する
   * @param {string[]} order カラム ID の配列
   */
  setColumnOrder(order) { this.head.options.column_order.col = order; }

  /**
   * カラムの順番設定をすべて削除する
   */
  clearColumnOrder() { this.head.options.column_order.col = []; }

  /**
   * 非表示カラムを設定する
   * @param {string} id 非表示にするカラム ID
   */
  setInvisibleColumn(id) {
    // 設定が存在するかチェック
    const index = this.invisibleColumns.findIndex((c) => c === id);
    // 存在しない場合のみ追加
    if (index === -1) this.head.options.invisible_columns.col.push(id);
  }

  /**
   * カラムの非表示設定を削除する
   * @param {string} id 再表示にするカラム ID
   */
  removeInvisibleColumn(id) {
    this.head.options.invisible_columns.col = this.invisibleColumns.filter((c) => c !== id);
  }

  /**
   * 非表示カラムの設定をすべて削除する
   */
  clearInvisibleColumns() { this.head.options.invisible_columns.col = []; }
}

/**
 * @class BodyData
 * @description XMLのbody部分を操作するクラス
 * @extends DataHandle
 */
class BodyData extends DataHandle {
  constructor(data) {
    super(data);
    this.body = this.data.root.body;
    console.debug('[DataHandle.BodyData] data at creating instance:', this.data);
  }

  /**
   * テーブルを追加する
   * @param {string} tableName テーブル名
   * @param {string} tableSummary テーブル概要
   * @returns {TableData} 追加されたテーブルの TableData インスタンス
   */
  addTable(tableName = '', tableSummary = '') {
    // sequence.table および tables.table が存在しない場合は初期化する
    if (!this.body.sequence) this.body.sequence = { table: [] };
    if (!this.body.sequence.table) this.body.sequence.table = [];
    if (!this.body.tables) this.body.tables = { table: [] };
    if (!this.body.tables.table) this.body.tables.table = [];

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
    return (this.body.sequence.table || []).map((t) => new TableData(this.data, t._id));
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
  set name(newName) {
    this.table.thead.nm = newName;
    this.table.thead.ua = getISOString();
  }
  get summary() { return this.table.thead.sm; }
    set summary(newSummary) {
    this.table.thead.sm = newSummary;
    this.table.thead.ua = getISOString();
  }
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
  getISOString,
  getRandomUUID,
  getRandomInt,
  uuidToBase58,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  deriveKey,
  encrypt,
  decrypt,
};