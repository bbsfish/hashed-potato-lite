<template>
  <div class="select-file-button">
    <LoadingOverlay v-if="isLoading" :m="loadingMessage" />
    <button @click="selectFile">
      <IconPaperClip size="1rem" />
      <span>ファイルを開く</span>
    </button>
  </div>
</template>

<script>
import api from '@/lib/api';
import FileSystem from '@/lib/file-system';
import { DataHandle } from '@/lib/data-handle';
import Database from '@/lib/database';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import IconPaperClip from '@/components/icons/IconPaperClip.vue';
const fs = new FileSystem();
const db = new Database();

export default {
  name: 'SelectFileButton',
  components: {
    IconPaperClip,
    LoadingOverlay,
  },
  data() {
    return {
      isLoading: false,
      loadingMessage: '',
    };
  },
  methods: {
    async selectFile() {
      try {
        // ファイルを選択
        const fileHandles = await fs.pickFile({
          types: [{
            description: 'Hashed Potato Lite File',
            accept: { 'text/xml': ['.xml'] },
          }],
        });
        if (!fileHandles || fileHandles.length === 0) return this.$snackbar('ファイル選択がキャンセルされました');
        const fileHandle = fileHandles[0];
        this.$store.commit('setFileHandle', fileHandle);

        // ファイルの内容を読み込み
        this.isLoading = true;
        this.loadingMessage = 'ファイルを読み込んでいます...';
        const xml = await fs.readFile(fileHandle);
        if (xml === null) throw new Error('ファイルの内容の読み込みに失敗しました');

        let dataHandle;
        const fileId = DataHandle.getFileIdFromXml(xml);

        // ファイルが平文の場合はそのままインポート
        if (DataHandle.isPlainXml(xml)) dataHandle = await DataHandle.import(xml);

        // ファイルが暗号化されている場合、認証情報を収集してからインポート
        else {
          // マスターパスワードを収集
          const clientPassword = await this.$dialog.prompt(
            'このファイルは暗号化されています。マスターパスワードを入力してください',
            { inputType: 'password', forceNull: true }
          );
          if (!clientPassword) throw new Error('ファイルのオープンがキャンセルされました');

          // ワンタイムパスワードを収集してサーバーに問い合わせ
          const token = await this.$dialog.prompt(
            'ワンタイムパスワードを入力してください',
            { inputType: 'number', forceNull: true }
          );
          if (!token) throw new Error('ファイルのオープンがキャンセルされました');

          // ワンタイムパスワードをサーバーに問い合わせて検証し、暗号化情報を取得
          this.loadingMessage = 'ワンタイムパスワードを検証しています...';
          const userNetInfo = await api.getNetInfo(); // ユーザのネットワーク情報を取得
          const result = await api.post(api.TOTP_VERIFICATION, {
            file_id: fileId,
            mode: 'decrypt',
            token,
            ip_address: userNetInfo.ip,
            region: userNetInfo.timezone,
          });
          if (result.status === 'error') throw new Error('ワンタイムパスワードの検証に失敗しました');

          // サーバーから受け取った暗号化情報を使ってファイルを復号
          this.loadingMessage = 'ファイルを復号しています...';
          const fullPassword = clientPassword + result.server_password;
          dataHandle = await DataHandle.import(xml, fullPassword, result.iv_base64, result.salt_base64);
        }

        this.$store.commit('setDataHandle', dataHandle);
        this.$store.commit('setModified', false);

        // 最近のファイルにファイルハンドルを保存
        this.loadingMessage = 'ファイル情報を保存しています...';
        const head = dataHandle.getHead();
        const files = await db.getAllFiles();
        if (!files.map((f) => f.id).includes(head.fileId)) db.addFile(head.fileId, fileHandle, fileHandle.name);

        this.$snackbar(`ファイル「${fileHandle.name}」を開きました`);
      } catch (err) {
        console.error(err);
        this.$dialog.alert(err.message || '不明なエラーが発生しました');
      } finally {
        this.isLoading = false;
        this.loadingMessage = '';
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.select-file-button {
  display: inline;

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: 1px solid var.$border-color;
    background-color: var.$white;
    color: var.$text-color;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
      border-color: #ccc;
    }
  }
}
</style>