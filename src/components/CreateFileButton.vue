<template>
  <button class="create-file-button" @click="createFile">
    <IconPlus size="1rem" />
    <span>新しいファイルを作成</span>
  </button>
</template>

<script>
import FileSystem from '@/lib/file-system';
import { DataHandle } from '@/lib/data-handle';
import Database from '@/lib/database';
import IconPlus from '@/components/icons/IconPlus.vue'; // Note: You need to create this icon component.

const fs = new FileSystem();
const db = new Database();

export default {
  name: 'CreateFileButton',
  components: {
    IconPlus,
  },
  methods: {
    async createFile() {
      try {
        // 1. ダイアログでファイル名を入力
        const title = await this.$dialog.prompt('新しいファイルの名前を入力してください', true);
        if (!title) {
          this.$floatingmessage.message('ファイル作成がキャンセルされました');
          return;
        }

        // 2. DataHandleを使用して初期XMLコンテンツを作成
        const dataHandle = new DataHandle();
        const head = dataHandle.getHead();
        head.fileTitle = title;
        const initialContent = dataHandle.export();
        
        // 3. ファイルを保存
        const handle = await fs.pickAndSaveFile(initialContent, {
          types: [{
            description: 'Hashed Potato Lite File',
            accept: { 'text/xml': ['.xml'] },
          }],
        }, `${title}.xml`);

        if (handle) {
          this.$store.commit('setDataHandle', )
          // 4. IndexedDBにファイルハンドルを保存
          await db.addFile(head.fileId, handle, handle.name);
          this.$floatingmessage.message(`ファイル「${handle.name}」を作成しました`);
        } else {
          this.$floatingmessage.message('ファイル作成がキャンセルされました');
        }

      } catch (error) {
        this.$dialog.alert('ファイルの作成中にエラーが発生しました');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.create-file-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  background-color: var.$button-color;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var.$button-hovered-color;
  }
}
</style>