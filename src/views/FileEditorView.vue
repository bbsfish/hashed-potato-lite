<template>
  <div class="file-editor">
    <div v-if="!fileHandle" class="file-selection-container">
      <h1>ファイルエディタ</h1>
      <div class="button-group">
        <button @click="selectFile" class="action-button">ファイルを開く</button>
        <button @click="createFile" class="action-button">新規ファイル作成</button>
      </div>
      <div class="recent-files">
        <h2>最近使ったファイル</h2>
        <ul v-if="recentFiles.length > 0">
          <li v-for="file in recentFiles" :key="file.id" @click="openRecentFile(file.handle)">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-date">最終更新: {{ new Date(file.updatedAt).toLocaleString() }}</span>
          </li>
        </ul>
        <p v-else>最近使ったファイルはありません。</p>
      </div>
    </div>

    <div v-else class="editor-container">
      <div class="header">
        <h1>{{ fileName }}</h1>
        <div class="actions">
          <button @click="saveFile()" class="save-button">保存</button>
          <button @click="closeFile" class="close-button">保存せずに終了</button>
        </div>
      </div>

      <div class="table-controls">
        <select v-if="tables.length > 0" v-model="selectedTableId" class="table-selection">
            <option disabled value="">テーブルを選択してください</option>
            <option v-for="table in tables" :key="table.thead.table_id" :value="table.thead.table_id">
            {{ table.thead.table_name }}
            </option>
        </select>
        <button @click="showCreateTablePrompt" class="add-table-button">新しいテーブルを作成</button>
       </div>


      <div v-if="selectedTable" class="data-grid-container">
        <div class="table-actions">
            <button @click="addAccount" class="add-account-button">アカウントを追加</button>
        </div>
        <table class="data-grid">
          <thead>
            <tr>
              <th>操作</th>
              <th v-for="key in accountKeys" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody v-if="selectedTable.tbody && selectedTable.tbody.accounts && selectedTable.tbody.accounts.account_data">
            <tr v-for="account in selectedTable.tbody.accounts.account_data" :key="account.serial_number" @click="selectAccount(account)">
              <td>
                <button @click.stop="deleteAccount(account.serial_number)" class="delete-button">削除</button>
              </td>
              <td v-for="key in accountKeys" :key="key">{{ account[key] }}</td>
            </tr>
          </tbody>
        </table>
         <p v-if="!selectedTable.tbody || !selectedTable.tbody.accounts || !selectedTable.tbody.accounts.account_data || selectedTable.tbody.accounts.account_data.length === 0" class="no-data-message">
            データがありません。「アカウントを追加」ボタンから新しいデータを追加してください。
        </p>
      </div>
       <p v-else-if="tables.length > 0 && !selectedTable" class="no-data-message">テーブルを選択してください。</p>
       <p v-else class="no-data-message">表示できるデータがありません。「新しいテーブルを作成」ボタンからテーブルを作成してください。</p>
    </div>

    <FileDataEditor
      v-if="isEditorVisible"
      :account-data="editingAccount"
      :email-data="editingEmails"
      :password-data="editingPasswords"
      @close="closeEditor"
      @save="saveAccountDetails"
    />
  </div>
</template>

<script>
import FileSystem from '@/lib/file-system.js';
import Database from '@/lib/database.js';
import DataHandle from '@/lib/data-handle.js';
import FileDataEditor from '@/components/FileDataEditor.vue';

const fs = new FileSystem();
const db = new Database();

export default {
  name: 'FileEditorView',
  components: {
    FileDataEditor,
  },
  data() {
    return {
      dataHandler: new DataHandle(),
      recentFiles: [],
      selectedTableId: null,
      tableData: null,
      isDataChanged: false,
      isEditorVisible: false,
      editingAccount: null,
      editingEmails: [],
      editingPasswords: [],
    };
  },
  computed: {
    fileHandle: {
      get() {
        return this.$store.state.fileHandle;
      },
      set(handle) {
        this.$store.commit('setFileHandle', handle);
      },
    },
    fileName() {
      return this.fileHandle ? this.fileHandle.name : '';
    },
    tables() {
      return this.tableData?.root?.body?.tables?.table_data || [];
    },
    selectedTable() {
      if (!this.selectedTableId || this.tables.length === 0) return null;
      return this.tables.find(t => t.thead.table_id === this.selectedTableId);
    },
    accountKeys() {
        if (!this.selectedTable) return [];

        // データが存在する場合は、最初のレコードのキーを返す
        if (this.selectedTable.tbody && this.selectedTable.tbody.accounts && this.selectedTable.tbody.accounts.account_data && this.selectedTable.tbody.accounts.account_data.length > 0) {
            return Object.keys(this.selectedTable.tbody.accounts.account_data[0]);
        }
        
        // データが存在しない場合は、アカウントのデフォルト構造に基づくキーを返す
        return [
            'serial_number',
            'service_name',
            'service_name_initial',
            'service_description',
            'category',
            'user_id',
            'website_url',
            'status',
            'note',
            'created_at',
            'updated_at',
        ];
    }
  },
  methods: {
    // --- ファイル操作 ---
    async selectFile() {
      const handles = await fs.pickFile({
        types: [{ description: 'XML Files', accept: { 'application/xml': ['.xml'] } }]
      });
      if (handles && handles.length > 0) {
        this.openFile(handles[0]);
      }
    },
    async createFile() {
        const tableName = await this.$dialog.prompt('新しいテーブル名を入力してください', true);
        if (!tableName) return;
        
        const handle = await fs.pickAndSaveFile('', {
             types: [{ description: 'XML Files', accept: { 'application/xml': ['.xml'] } }]
        }, 'untitled.xml');
        if (!handle) return;
        
        this.dataHandler.createNewData();
        this.dataHandler.createTable(tableName);

        // 初回コンテンツをファイルに書き込む
        const xmlString = this.dataHandler.exportXml();
        if (xmlString) {
            const success = await fs.saveFile(handle, xmlString);
            if (!success) {
                this.$dialog.alert('ファイルの初期化に失敗しました。');
                return;
            }
        }
        
        // ファイルを開き、データベースに登録する
        this.openFile(handle);
    },
    async loadRecentFiles() {
      this.recentFiles = (await db.getAllFiles()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    async openRecentFile(handle) {
        // ハンドルの権限を要求
        if (await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
            if (await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
                this.$dialog.alert('ファイルへのアクセスが許可されませんでした。');
                return;
            }
        }
        this.openFile(handle);
    },
    async openFile(handle) {
      this.fileHandle = handle;
      const content = await fs.readFile(handle);
      if (content) {
        this.dataHandler.importXml(content);
        this.tableData = this.dataHandler.jsonData;
        this.dataHandler.updateLastAccessed();

        // データベースにファイル情報を保存/更新
        try {
            await db.addFile(handle.name, handle, handle.name);
        } catch (e) {
            await db.updateFile(handle.name, { handle, name: handle.name });
        }
        this.isDataChanged = false;

        if (this.tables.length === 1) {
          this.selectedTableId = this.tables[0].thead.table_id;
        } else {
            this.selectedTableId = null;
        }
      } else {
        this.$dialog.alert('ファイルの読み込みに失敗しました。');
        this.fileHandle = null;
      }
      this.loadRecentFiles();
    },
    async closeFile() {
        if (this.isDataChanged) {
            if (!await this.$dialog.confirm('変更が保存されていません。本当にファイルを閉じますか？')) {
                return;
            }
        }
        this.fileHandle = null;
        this.tableData = null;
        this.selectedTableId = null;
        this.isDataChanged = false;
        this.closeEditor();
    },
    async saveFile(forceSave = false, handle = this.fileHandle) {
        if (!handle) return;
        if (!this.isDataChanged && !forceSave) {
            this.$dialog.alert('変更点はありません。');
            return;
        }

        const xmlString = this.dataHandler.exportXml();
        if (xmlString) {
            const success = await fs.saveFile(handle, xmlString);
            if (success) {
                this.$dialog.alert('ファイルを保存しました。');
                this.isDataChanged = false;
                await db.updateFile(handle.name, { handle, name: handle.name }); // 更新日時を更新
                this.loadRecentFiles();
            } else {
                this.$dialog.alert('ファイルの保存に失敗しました。');
            }
        }
    },

    // --- テーブル操作 ---
    async showCreateTablePrompt() {
      const tableName = await this.$dialog.prompt('新しいテーブル名を入力してください', true);
      if (tableName) {
        const newTableId = this.dataHandler.createTable(tableName);
        if (newTableId) {
          this.selectedTableId = newTableId;
          this.isDataChanged = true;
          this.$dialog.alert(`テーブル「${tableName}」を作成しました。`);
        }
      }
    },
    
    // --- アカウント操作 ---
    addAccount() {
        if (!this.selectedTableId) return;
        // 新しいアカウントのテンプレート
        const newAccountTemplate = {
            service_name: '新しいサービス',
            service_name_initial: '',
            service_description: '',
            category: '',
            user_id: '',
            website_url: '',
            status: 'active',
            note: '',
        };
        const newSerialNumber = this.dataHandler.createAccount(this.selectedTableId, newAccountTemplate);
        if (newSerialNumber) {
            const newAccount = this.dataHandler._findAccount(this.selectedTableId, newSerialNumber);
            this.selectAccount(newAccount);
            this.isDataChanged = true;
        }
    },
    async deleteAccount(serialNumber) {
        if (await this.$dialog.confirm('このアカウントを本当に削除しますか？関連するメールとパスワードも削除されます。')) {
            const success = this.dataHandler.deleteAccount(this.selectedTableId, serialNumber);
            if (success) {
                this.isDataChanged = true;
                this.$dialog.alert('アカウントを削除しました。');
            }
        }
    },

    // --- 編集フォーム ---
    selectAccount(account) {
        this.editingAccount = JSON.parse(JSON.stringify(account));

        const table = this.selectedTable;
        if (table && table.tbody) {
            this.editingEmails = JSON.parse(JSON.stringify(
                table.tbody.emails?.email_data?.filter(e => e.serial_number === account.serial_number) || []
            ));
            this.editingPasswords = JSON.parse(JSON.stringify(
                table.tbody.passwords?.password_data?.filter(p => p.serial_number === account.serial_number) || []
            ));
        }

        this.isEditorVisible = true;
    },
    closeEditor() {
        this.isEditorVisible = false;
        this.editingAccount = null;
        this.editingEmails = [];
        this.editingPasswords = [];
    },
    saveAccountDetails({ account, emails, passwords }) {
        // アカウント情報の更新
        const accountSuccess = this.dataHandler.updateAccount(this.selectedTableId, account.serial_number, account);
        
        // Eメールとパスワードの更新
        const emailsSuccess = this.dataHandler.updateEmailsForAccount(this.selectedTableId, account.serial_number, emails);
        const passwordsSuccess = this.dataHandler.updatePasswordsForAccount(this.selectedTableId, account.serial_number, passwords);

        if (accountSuccess && emailsSuccess && passwordsSuccess) {
            this.isDataChanged = true;
        }
        this.closeEditor();
    },
  },
  async mounted() {
    await this.loadRecentFiles();
    // ストアにハンドルが残っている場合、それを開く
    if (this.fileHandle) {
        this.openFile(this.fileHandle);
    }
  }
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.file-editor {
  padding: 2rem;
  max-width: 1400px;
  margin: auto;
}

.file-selection-container {
  text-align: center;
  h1 { margin-bottom: 2rem; }
  .button-group {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 3rem;
  }
  .action-button {
      padding: 1rem 2rem;
      font-size: 1.2rem;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background-color: var.$button-color;
      &:hover { background-color: var.$button-hovered-color; }
  }
}

.recent-files {
  text-align: left;
  max-width: 800px;
  margin: auto;
  h2 {
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  ul {
    list-style: none;
    padding: 0;
    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      cursor: pointer;
      border-radius: 4px;
      &:hover { background-color: #f0f0f0; }
      .file-name { font-weight: bold; }
      .file-date { color: #888; }
    }
  }
}

.editor-container {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    .actions { display: flex; gap: 1rem; }
    .save-button, .close-button {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: 1px solid;
        cursor: pointer;
    }
    .save-button {
        background-color: var.$button-color;
        color: white;
        border-color: var.$button-color;
    }
    .close-button {
        background-color: #f0f0f0;
        color: #333;
        border-color: #ccc;
    }
  }
  .table-controls {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;
      .table-selection {
          padding: 0.5rem;
          border-radius: 4px;
      }
  }
}

.data-grid-container {
  overflow-x: auto;
  .table-actions {
      margin-bottom: 1rem;
  }
}
.add-table-button, .add-account-button {
    padding: 0.5rem 1rem;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover { background-color: #218838; }
}

.data-grid {
  width: 100%;
  border-collapse: collapse;
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    white-space: nowrap;
  }
  thead { background-color: #f2f2f2; }
  tbody tr {
      cursor: pointer;
      &:hover { background-color: #f5f5f5; }
  }
  .delete-button {
      background: none;
      border: none;
      color: var.$danger-color;
      cursor: pointer;
  }
}
.no-data-message {
    margin-top: 1rem;
    color: #888;
    text-align: center;
    padding: 2rem;
    background-color: #f9f9f9;
    border-radius: 4px;
}
</style>