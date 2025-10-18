<template>
  <div class="file-config-view" v-if="fileHandle && dataHandle">
    <h1>ファイル設定</h1>
    <div class="settings-container">
      <div class="setting-item">
        <label>ファイルID</label>
        <p class="value">{{ head.fileId }}</p>
        <small>ファイルのユニークなIDです。変更はできません。</small>
      </div>
      <div class="setting-item">
        <label>ファイルSID</label>
        <p class="value">{{ head.fileSId }}</p>
        <small>ファイルIDから生成された、ファイルのユニークな短縮IDです。変更はできません。</small>
      </div>
      <div class="setting-item">
        <label>ファイルバージョン</label>
        <p class="value">{{ head.fileVersion }}</p>
        <small>ファイルのバージョンです。変更はできません。</small>
      </div>
      <div class="setting-item">
        <label>作成日時</label>
        <p class="value">{{ head.createdAt.toLocaleString() }}</p>
        <small>ファイルが作成された日時です。変更はできません。</small>
      </div>
      <div class="setting-item">
        <label>更新日時</label>
        <p class="value">{{ head.updatedAt.toLocaleString() }}</p>
        <small>ファイルが最後に更新された日時です。変更はできません。</small>
      </div>

      <hr />

      <div class="setting-item">
        <label for="fileTitle">ファイルタイトル</label>
        <input id="fileTitle" type="text" v-model="editableSettings.fileTitle" :disabled="!isEditing" />
        <small>ファイルのタイトルです。</small>
      </div>
      <div class="setting-item">
        <label for="fileDescription">ファイル概要</label>
        <textarea id="fileDescription" v-model="editableSettings.fileDescription" :disabled="!isEditing"></textarea>
        <small>ファイルの内容を説明する概要です。</small>
      </div>
      <div class="setting-item checkbox-item">
        <label for="isEncrypted">
          <input id="isEncrypted" type="checkbox" v-model="editableSettings.isEncrypted" :disabled="!isEditing" />
          <span>ファイルを暗号化する</span>
        </label>
        <small>このオプションを有効にすると、ファイルがパスワードで暗号化され、セキュリティが向上します。</small>
      </div>

      </div>

    <div class="actions">
      <button v-if="!isEditing" @click="isEditing = true">設定を変更する</button>
      <template v-if="isEditing">
        <button class="save-button" @click="saveSettings">設定を保存する</button>
        <button class="cancel-button" @click="cancelEdit">キャンセル</button>
      </template>
    </div>
  </div>
  <div v-else>
    <p>ファイルが選択されていません。設定するファイルを選択してください: <router-link :to="{ name: 'Home' }">選択する</router-link></p>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import FileSystem from '@/lib/file-system';
const fs = new FileSystem();

export default {
  name: 'FileConfigView',
  data() {
    return {
      isEditing: false,
      editableSettings: {
        fileTitle: '',
        fileDescription: '',
        isEncrypted: false,
      },
    };
  },
  computed: {
    ...mapGetters(['dataHandle', 'fileHandle']),
    head() {
      return this.dataHandle ? this.dataHandle.getHead() : null;
    },
  },
  methods: {
    ...mapMutations(['setModified']),
    loadSettings() {
      if (!this.dataHandle) return;
      this.editableSettings = {
        fileTitle: this.head.fileTitle,
        fileDescription: this.head.fileDescription,
        isEncrypted: this.head.isEncrypted,
      };
    },
    async saveSettings() {
      const { fileTitle, fileDescription, isEncrypted } = this.editableSettings;
      try {
        // DataHandle に変更を適用
        this.head.fileTitle = fileTitle.trim();
        this.head.fileDescription = fileDescription.trim();
        this.head.isEncrypted = isEncrypted;
        this.setModified(true);

        // 暗号化が有効になった場合、確認ダイアログを表示したのち、ファイル暗号化ページへ遷移
        if (isEncrypted && (await this.$dialog.confirm('ファイルを暗号化します。この操作は元に戻せません。よろしいですか？'))) {
          this.$router.push({ name: 'FileEncryption'});
          return;
        }

        // ユーザーがキャンセルした場合、isEncrypted を元に戻す
        this.editableSettings.isEncrypted = false;

        // ファイルに書き出す XML コンテンツを生成
        const { xml } = await this.dataHandle.export();

        // ファイルに上書き保存
        const success = await fs.saveFile(this.fileHandle, xml);

        if (success) {
          this.setModified(false);
          this.$snackbar('設定を保存しました');
          this.isEditing = false;
        } else {
          this.$dialog.alert('設定の保存に失敗しました');
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        this.$dialog.alert('設定の保存中にエラーが発生しました。');
      }
    },
    cancelEdit() {
      this.loadSettings();
      this.isEditing = false;
    },
  },
  mounted() {
    this.loadSettings();
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.file-config-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  
  label {
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #555;
  }
  
  .value {
    font-family: var.$ff-code;
    background-color: #f5f5f5;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    word-break: break-all;
  }

  input[type="text"],
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var.$border-color;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  small {
    margin-top: 0.5rem;
    color: var.$text-muted-color;
    font-size: 0.875rem;
  }
}

.checkbox-item {
  label {
    display: flex;
    align-items: center;
    cursor: pointer;

    input {
      margin-right: 0.75rem;
      width: 1.2em;
      height: 1.2em;
    }
  }
}

hr {
  border: none;
  border-top: 1px solid var.$border-color;
  margin: 1rem 0;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s;
  }

  .save-button {
    background-color: var.$button-color;
    color: white;

    &:hover {
      background-color: var.$button-hovered-color;
    }
  }

  .cancel-button {
    background-color: #ccc;
    color: #333;

    &:hover {
      background-color: #bbb;
    }
  }
}
</style>