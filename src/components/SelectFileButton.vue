<template>
  <button class="select-file-button" @click="selectFile">
    <IconPaperClip size="1rem" />
    <span>ファイルを開く</span>
  </button>
</template>

<script>
import FileSystem from '@/lib/file-system';
import { DataHandle } from '@/lib/data-handle';
import Database from '@/lib/database';
import IconPaperClip from '@/components/icons/IconPaperClip.vue';

const fs = new FileSystem();
const db = new Database();

export default {
  name: 'SelectFileButton',
  components: {
    IconPaperClip,
  },
  methods: {
    async selectFile() {
      try {
        let fileHandle;
        let fileContent;
        let dataHandle;
        
        // ファイルピッカーでファイルを選択（失敗し、再試行が押されたら繰り返す）
        do {
          const fileHandles = await fs.pickFile({
            types: [{
              description: 'Hashed Potato Lite File',
              accept: { 'text/xml': ['.xml'] },
            }],
          });

          if (!fileHandles || fileHandles.length === 0) {
            this.$snackbar('ファイル選択がキャンセルされました');
            return;
          }
          fileHandle = fileHandles[0];
          fileContent = await fs.readFile(fileHandle);

          if (fileContent === null) {
            this.$dialog.alert('ファイルの内容の読み込みに失敗しました');
            return;
          }
        } while (await this.$dialog.alert('ファイルの内容の読み込みに失敗しました', '再試行'));

        this.$store.commit('setFileHandle', fileHandle);

        if (DataHandle.isEncryptedXml(fileContent)) {
          // ファイルが暗号化されていなければ、そのままインポート
          dataHandle = await DataHandle.import(fileContent);
        } else {
          // ファイルが暗号化されているなら、認証情報を収集

        }

        this.$store.commit('setDataHandle', dataHandle);
        this.$store.commit('setModified', false);

        // 3. IndexedDBにファイルハンドルを保存
        const head = dataHandle.getHead();
        const files = await db.getAllFiles();
        const fileIdList = files.map((f) => f.id);
        if (!fileIdList.includes(head.fileId)) {
          await db.addFile(head.fileId, fileHandle, fileHandle.name);
          this.$snackbar(`ファイル「${fileHandle.name}」を開きました`);
        }
      } catch (error) {
        console.error(error);
        if (error.message.includes('password, ivBase64 and saltBase64 are required.')) {
            this.$dialog.alert('このファイルは暗号化されています。パスワードを入力して復号してください。');
        } else {
            this.$dialog.alert('ファイルの処理中にエラーが発生しました');
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.select-file-button {
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
</style>