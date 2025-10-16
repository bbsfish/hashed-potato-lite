<template>
  <div class="select-recent-file">
    <button class="select-recent-file-button" @click="toggleFileList">
      <IconCloud size="1rem" />
      <span>最近使用したファイル</span>
    </button>
    <ul v-if="showFileList && recentFiles.length > 0" class="file-list">
      <li v-for="file in recentFiles" :key="file.id" @click="openFile(file)">
        {{ file.name }}
      </li>
    </ul>
    <p v-if="showFileList && recentFiles.length === 0" class="no-files">
      最近使用したファイルはありません。
    </p>
  </div>
</template>

<script>
import Database from '@/lib/database';
import FileSystem from '@/lib/file-system';
import { DataHandle } from '@/lib/data-handle';
import IconCloud from '@/components/icons/IconCloud.vue';

const db = new Database();
const fs = new FileSystem();

export default {
  name: 'SelectRecentFileButton',
  components: {
    IconCloud,
  },
  data() {
    return {
      recentFiles: [],
      showFileList: false,
    };
  },
  methods: {
    async loadRecentFiles() {
      try {
        const files = await db.getAllFiles();
        // 更新日時順でソート
        this.recentFiles = files.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      } catch (err) {
        console.error('Failed to load recent files:', err);
        this.$snackbar('最近使用したファイルの読み込みに失敗しました');
      }
    },
    toggleFileList() {
      if (!this.showFileList) this.loadRecentFiles();
      this.showFileList = !this.showFileList;
    },
    async openFile(file) {
      this.showFileList = false;
      const fileHandle = file.handle;

      try {
        const fileContent = await fs.readFile(fileHandle);
        if (fileContent === null) return this.$dialog.alert('ファイルの内容の読み込みに失敗しました');

        let dataHandle;
        if (DataHandle.isEncryptedXml(fileContent)) {
          // 暗号化されたファイルの復号処理は、現状の実装では省略されています
          this.$dialog.alert('暗号化されたファイルを開く機能は未実装です。');
          return;
        } else {
          dataHandle = await DataHandle.import(fileContent);
        }

        this.$store.commit('setFileHandle', fileHandle);
        this.$store.commit('setDataHandle', dataHandle);
        this.$store.commit('setModified', false);
        this.$snackbar(`ファイル「${fileHandle.name}」を開きました`);

      } catch (error) {
        console.error('Error opening file:', error);
        this.$dialog.alert('ファイルの処理中にエラーが発生しました');
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