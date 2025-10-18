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
import { mapGetters } from 'vuex';

const fs = new FileSystem();
const db = new Database();

export default {
  name: 'CreateFileButton',
  components: {
    IconPlus,
  },
  computed: {
    ...mapGetters(['fileHandle', 'dataHandle', 'isModified'])
  },
  methods: {
    async createFile() {
      try {
        // 現在のファイル選択チェック
        let isOverwrite = false;
        if (this.fileHandle && this.isModified) {
          isOverwrite = await this.$dialog.confirm('ファイルが既に開かれており、変更されています。\nこのまま続行すると、現在のファイルに対する変更が保存されません。\nよろしいですか?');
          if (!isOverwrite) return this.$snackbar('ファイルの作成がキャンセルされました');
        }

        // ファイル名を入力
        let title;
        let message = '新しいファイルの名前を入力してください';
        do {
          title = await this.$dialog.prompt(message);
          if (title === null) return this.$snackbar('ファイルの作成がキャンセルされました');
          title = title.trim();
          if (title === '') message = 'ファイルの名前を空欄にすることはできません。新しいファイルの名前を入力してください';
        } while (title === '');

        // XML コンテンツを作成
        const dataHandle = new DataHandle();
        const head = dataHandle.getHead();
        head.fileTitle = title;
        const { xml } = await dataHandle.export();

        // ファイルを保存
        const fileHandle = await fs.pickAndSaveFile(xml, {
          types: [{
            description: 'Hashed Potato Lite File',
            accept: { 'text/xml': ['.hpl'] },
          }],
        }, `${title}.hpl`);
        if (!fileHandle) return this.$snackbar('ファイルの作成がキャンセルされました');

        // fileHandle および dataHandle をストアへ保存、ファイルの編集状態をリセット
        this.$store.commit('setDataHandle', { handle: dataHandle, isOverwrite });
        this.$store.commit('setFileHandle',  { handle: fileHandle, isOverwrite });
        this.$store.commit('setModified', false);

        // IDB にファイルハンドルを保存
        await db.addFile(head.fileId, fileHandle, fileHandle.name, title);
        
        this.$snackbar(`${fileHandle.name} を作成しました`);

      } catch (err) {
        console.error(err);
        this.$dialog.alert('ファイルの作成中にエラーが発生しました: ' + err.message);
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