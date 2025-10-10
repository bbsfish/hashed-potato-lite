<template>
  <div class="file-viewer">
    <div v-if="!fileHandle" class="file-selection-container">
      <h1>ファイルビューア</h1>
      <div class="button-group">
        <button @click="selectFile" class="action-button">ファイルを開く</button>
      </div>
      <div class="recent-files">
        <h2>最近使ったファイル</h2>
        <ul v-if="recentFiles.length > 0">
          <li v-for="file in recentFiles" :key="file.id" @click="openRecentFile(file.handle)">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-date">最終アクセス: {{ new Date(file.updated_at).toLocaleString() }}</span>
          </li>
        </ul>
        <p v-else>最近使ったファイルはありません。</p>
      </div>
    </div>

    <div v-else class="viewer-container">
      <div class="header">
        <h1>{{ fileName }}</h1>
        <div class="actions">
          <button @click="closeFile" class="close-button">ビューアを閉じる</button>
        </div>
      </div>

      <div class="table-controls">
        <select v-if="tables.length > 0" v-model="selectedTableId" class="table-selection">
          <option disabled value="">テーブルを選択してください</option>
          <option v-for="table in tables" :key="table.thead.table_id" :value="table.thead.table_id">
            {{ table.thead.table_name }}
          </option>
        </select>
      </div>

      <div v-if="selectedTable" class="data-container">
        <div class="search-controls">
          <select v-model="searchKey">
            <option value="service_name_initial">イニシャル</option>
            <option value="service_name">サービス名</option>
            <option value="serial_number">シリアルナンバー</option>
            <option value="category">カテゴリ</option>
          </select>
          <input type="text" v-model="searchQuery" placeholder="検索..." />
        </div>

        <div class="data-grid-container">
          <table class="data-grid">
            <thead @dragover.prevent @drop.prevent="onColumnDrop">
              <tr>
                <th
                  v-for="(key, index) in orderedColumns"
                  :key="key"
                  draggable="true"
                  @dragstart="onColumnDragStart(index)"
                  @dragenter="onColumnDragEnter(index)"
                  @dragend="onColumnDragEnd"
                  @click="sortBy(key)"
                  :class="[{ 'drag-over': index === dragOverIndex }, { 'sortable': true }, { 'sorted': sortKey === key }]"
                >
                  {{ getColumnAlias(key) }}
                  <span v-if="sortKey === key">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in filteredAndSortedAccounts" :key="account.serial_number" @click="showDetails(account)">
                <td v-for="key in orderedColumns" :key="key">{{ account[key] }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="filteredAndSortedAccounts.length === 0" class="no-data-message">
            表示するデータがありません。
          </p>
        </div>
      </div>
      <p v-else-if="tables.length > 0 && !selectedTable" class="no-data-message">テーブルを選択してください。</p>
      <p v-else class="no-data-message">表示できるデータがありません。</p>
    </div>

     <FileDataEditor
      v-if="isDetailVisible"
      title="アカウント情報の詳細"
      :account-data="selectedAccount"
      :email-data="selectedEmails"
      :password-data="selectedPasswords"
      :readonly="true"
      :column-aliases="columnAliases" @close="isDetailVisible = false"
    />
  </div>
</template>

<script>
import FileSystem from '@/lib/file-system.js';
import Database from '@/lib/database.js';
import DataHandle from '@/lib/data-handle.js';
// FileDataEditorをインポート
import FileDataEditor from '@/components/FileDataEditor.vue';

const fs = new FileSystem();
const db = new Database();

export default {
  name: 'FileViewerView',
  // componentsに登録
  components: {
    FileDataEditor,
  },
  data() {
    return {
      dataHandler: new DataHandle(),
      recentFiles: [],
      selectedTableId: null,
      tableData: null,
      searchQuery: '',
      searchKey: 'service_name_initial',
      sortKey: '',
      sortOrder: 'asc',
      draggedIndex: null,
      dragOverIndex: null,
      columnAliases: {},
      localColumnOrder: [],
      // 詳細表示用のデータを追加
      isDetailVisible: false,
      selectedAccount: null,
      selectedEmails: [],
      selectedPasswords: [],
    };
  },
  computed: {
    // computedプロパティは変更なし
    fileHandle: {
      get() { return this.$store.state.fileHandle; },
      set(handle) { this.$store.commit('setFileHandle', handle); },
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
    allAccountKeys() {
        const defaultKeys = [
            'serial_number', 'service_name', 'user_id', 'website_url', 'note',
            'status', 'category', 'service_name_initial', 'service_description',
            'created_at', 'updated_at'
        ];
        return ['email_count', 'password_count', ...defaultKeys];
    },
    orderedColumns() {
      if (!this.selectedTable?.thead) return [];
      if (this.localColumnOrder.length > 0) return this.localColumnOrder;

      const order = this.selectedTable.thead.column_order?.col;
      if (order && Array.isArray(order)) {
        const currentKeys = this.allAccountKeys;
        const ordered = order.filter(key => currentKeys.includes(key));
        const newKeys = currentKeys.filter(key => !order.includes(key));
        return [...ordered, ...newKeys];
      }
      return this.allAccountKeys;
    },
    displayedAccounts() {
      if (!this.selectedTable || !this.selectedTable.tbody?.accounts?.account_data) return [];
      
      const accounts = this.selectedTable.tbody.accounts.account_data;
      const emails = this.selectedTable.tbody.emails?.email_data || [];
      const passwords = this.selectedTable.tbody.passwords?.password_data || [];

      return accounts.map(acc => {
        const email_count = emails.filter(e => e.serial_number === acc.serial_number).length;
        const password_count = passwords.filter(p => p.serial_number === acc.serial_number).length;
        return { ...acc, email_count, password_count };
      });
    },
    filteredAndSortedAccounts() {
      let accounts = [...this.displayedAccounts];

      if (this.searchQuery) {
        accounts = accounts.filter(account => {
          const value = account[this.searchKey];
          return value && value.toString().toLowerCase().includes(this.searchQuery.toLowerCase());
        });
      }

      if (this.sortKey) {
        accounts.sort((a, b) => {
          const valA = a[this.sortKey];
          const valB = b[this.sortKey];
          if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return accounts;
    }
  },
  methods: {
    // showDetailsメソッドを追加
    showDetails(account) {
      this.selectedAccount = account;
      const table = this.selectedTable;
      if (table && table.tbody) {
          const sn = account.serial_number;
          // 生データから関連情報をフィルタリング
          this.selectedEmails = JSON.parse(JSON.stringify(
              table.tbody.emails?.email_data?.filter(e => e.serial_number === sn) || []
          ));
          this.selectedPasswords = JSON.parse(JSON.stringify(
              table.tbody.passwords?.password_data?.filter(p => p.serial_number === sn) || []
          ));
      }
      this.isDetailVisible = true;
    },

    // 既存のメソッド (変更なし)
    getColumnAlias(key) {
      return this.columnAliases[key] || key;
    },
    async selectFile() {
      const handles = await fs.pickFile({
        types: [{ description: 'XML Files', accept: { 'application/xml': ['.xml'] } }]
      });
      if (handles && handles.length > 0) this.openFile(handles[0]);
    },
    async openRecentFile(handle) {
      if (await handle.queryPermission({ mode: 'read' }) !== 'granted') {
        if (await handle.requestPermission({ mode: 'read' }) !== 'granted') {
          this.$dialog.alert('ファイルへのアクセスが許可されませんでした。');
          return;
        }
      }
      this.openFile(handle);
    },
    async openFile(handle) {
      this.fileHandle = handle;
      this.columnAliases = await db.getState('column_aliases') || {};
      const content = await fs.readFile(handle);
      if (content) {
        this.dataHandler.importXml(content);
        this.tableData = this.dataHandler.jsonData;
        
        this.dataHandler.updateLastAccessed();
        try {
            await db.addFile(handle.name, handle, handle.name);
        } catch (e) {
            await db.updateFile(handle.name, { handle, name: handle.name });
        }

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
      this.fileHandle = null;
      this.tableData = null;
      this.selectedTableId = null;
      this.localColumnOrder = [];
    },
    async loadRecentFiles() {
      this.recentFiles = (await db.getAllFiles()).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    onColumnDragStart(index) {
      this.draggedIndex = index;
    },
    onColumnDragEnter(index) {
      this.dragOverIndex = index;
    },
    onColumnDragEnd() {
      this.draggedIndex = null;
      this.dragOverIndex = null;
    },
    onColumnDrop() {
      if (this.draggedIndex !== null && this.dragOverIndex !== null && this.draggedIndex !== this.dragOverIndex) {
        const newOrder = [...this.orderedColumns];
        const [draggedItem] = newOrder.splice(this.draggedIndex, 1);
        newOrder.splice(this.dragOverIndex, 0, draggedItem);
        this.localColumnOrder = newOrder;
      }
      this.onColumnDragEnd();
    },
  },
  watch: {
    selectedTableId(newId, oldId) {
        if (newId !== oldId) {
            this.localColumnOrder = [];
            this.sortKey = '';
        }
    }
  },
  async mounted() {
    this.columnAliases = await db.getState('column_aliases') || {};
    await this.loadRecentFiles();
    if (this.fileHandle) this.openFile(this.fileHandle);
  }
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

// tbody trにカーソルスタイルを追加
.data-grid {
    // ... 既存のスタイル ...
    tbody tr {
        cursor: pointer;
        &:hover { background-color: #f5f5f5; }
    }
}

// 他のスタイルは変更なし
.file-viewer {
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

.viewer-container {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    .actions { display: flex; gap: 1rem; }
    .close-button {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: 1px solid #ccc;
      background-color: #f0f0f0;
      color: #333;
      cursor: pointer;
    }
  }
  .table-controls {
    margin-bottom: 1.5rem;
    .table-selection {
      padding: 0.5rem;
      border-radius: 4px;
    }
  }
}

.data-container {
    .search-controls {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        input {
            flex-grow: 1;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        select {
            padding: 0.5rem;
            border-radius: 4px;
        }
    }
}

.data-grid-container {
  overflow-x: auto;
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
  thead th { 
    background-color: #f2f2f2; 
    position: sticky;
    top: 0;
    &.sortable {
        cursor: pointer;
    }
    &.sorted {
        background-color: #e0e0e0;
    }
    &.drag-over {
      background-color: #cce5ff;
    }
    span {
        margin-left: 0.5rem;
        font-size: 0.8em;
    }
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