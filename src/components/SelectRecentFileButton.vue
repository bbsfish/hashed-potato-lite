<template>
  <div class="select-recent-file">
    <LoadingOverlay v-if="isLoading" :m="loadingMessage" />
    <button class="select-recent-file-button" @click="toggleFileList">
      <IconCloud size="1rem" />
      <span>最近使用したファイル</span>
    </button>
    <ul v-if="isFileListShown && recentFiles.length > 0" class="file-list">
      <li v-for="file in recentFiles" :key="file.id" @click="openFile(file)">
        {{ file.name }}
      </li>
    </ul>
    <p v-if="isFileListShown && recentFiles.length === 0" class="no-files">
      最近使用したファイルはありません
    </p>
  </div>
</template>

<script>
import api from '@/lib/api';
import Database from '@/lib/database';
import FileSystem from '@/lib/file-system';
import { DataHandle } from '@/lib/data-handle';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import IconCloud from '@/components/icons/IconCloud.vue';
const db = new Database();
const fs = new FileSystem();

export default {
  name: 'SelectRecentFileButton',
  components: {
    IconCloud,
    LoadingOverlay,
  },
  data() {
    return {
      recentFiles: [],
      isFileListShown: false,
      isLoading: false,
      loadingMessage: '',
    };
  },
  methods: {
    async toggleFileList() {
      // リストが表示されていない間に、最近使用したファイルを読み込む
      if (!this.isFileListShown) {
        try {
          const files = await db.getAllFiles();
          // 更新日時順でソート
          this.recentFiles = files.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        } catch (err) {
          console.error('Failed to load recent files:', err);
          this.$snackbar('最近使用したファイルの読み込みに失敗しました');
        }
      }
      this.isFileListShown = !this.isFileListShown;
    },
    async openFile(file) {
      const fileHandle = file.handle;
      const fileId = file.id;
      this.isFileListShown = false;
      this.isLoading = true;
      this.loadingMessage = 'ファイルを開いています...';
      try {
        // ファイルの内容を読み込む
        const xml = await fs.readFile(fileHandle);
        if (!xml) throw new Error('ファイルの内容の読み込みに失敗しました');

        let dataHandle;

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

        // Vuex ストアに DataHandle と FileHandle を保存
        this.$store.commit('setFileHandle', fileHandle);
        this.$store.commit('setDataHandle', dataHandle);
        this.$store.commit('setModified', false);

        this.$snackbar(`ファイル「${fileHandle.name}」を開きました`);
      } catch (err) {
        console.error('Error opening file:', err);
        this.$dialog.alert(err.message || 'ファイルのオープンに失敗しました');
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

.select-recent-file {
  position: relative;
  display: inline-block;
}

.select-recent-file-button {
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

.file-list {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  list-style: none;
  padding: 0.5rem 0;
  margin: 0.25rem 0 0;
  background-color: var.$white;
  border: 1px solid var.$border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 250px;

  li {
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }
  }
}

.no-files {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  padding: 0.75rem 1.5rem;
  margin: 0.25rem 0 0;
  background-color: var.$white;
  border: 1px solid var.$border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: var.$text-muted-color;
}
</style>