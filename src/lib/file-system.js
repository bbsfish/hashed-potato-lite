/**
 * @typedef {object} FileSystemPickerOptions
 * @property {boolean} [multiple=false] - 複数のファイルを選択できるかどうか
 * @property {boolean} [excludeAcceptAllOption=false] - 「すべてのファイル」オプションを除外するかどうか
 * @property {Array<object>} [types] - 許可するファイルタイプの配列
 * @property {string} [types.description] - ファイルタイプの説明
 * @property {object} [types.accept] - MIMEタイプとファイル拡張子のペア
 */

class FileSystem {
  constructor() {
    this.isSupported = 'showOpenFilePicker' in window;
  }

  /**
   * ファイルピッカーを表示して、ユーザーに1つまたは複数のファイルを選択させる
   * @param {FileSystemPickerOptions} [options] - ファイルピッカーのオプション
   * @returns {Promise<FileSystemFileHandle[]|null>} 選択されたファイルのハンドル配列、またはnull
   */
  async pickFile(options = {}) {
    if (!this.isSupported) {
      console.error('File System Access API is not supported in this browser.');
      return null;
    }
    try {
      const handles = await window.showOpenFilePicker(options);
      return handles;
    } catch (error) {
      console.error('Error picking file:', error);
      return null;
    }
  }

  /**
   * ファイルハンドルからファイルの内容を読み込む
   * @param {FileSystemFileHandle} handle - ファイルハンドル
   * @returns {Promise<string|null>} ファイルの内容、またはnull
   */
  async readFile(handle) {
    if (!handle) return null;
    try {
      const file = await handle.getFile();
      const contents = await file.text();
      return contents;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  /**
   * ファイル保存ピッカーを表示して、ファイルに内容を書き込む
   * @param {string} content - 保存するコンテンツ
   * @param {FileSystemPickerOptions} [options] - ファイルピッカーのオプション
   * @param {string} [fileName] - デフォルトのファイル名
   * @returns {Promise<FileSystemFileHandle|null>} 保存されたファイルのハンドル、またはnull
   */
  async pickAndSaveFile(content, options = {}, fileName = 'untitled.txt') {
    if (!this.isSupported) {
      console.error('File System Access API is not supported in this browser.');
      return null;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        ...options,
      });
      await this.saveFile(handle, content);
      return handle;
    } catch (error) {
      console.error('Error saving file:', error);
      return null;
    }
  }

  /**
   * 指定されたファイルハンドルに内容を書き込む
   * @param {FileSystemFileHandle} handle - ファイルハンドル
   * @param {string} content - 書き込むコンテンツ
   * @returns {Promise<boolean>} 書き込みが成功したかどうか
   */
  async saveFile(handle, content) {
    if (!handle) return false;
    try {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (error) {
      console.error('Error writing to file:', error);
      return false;
    }
  }
}

export default FileSystem;