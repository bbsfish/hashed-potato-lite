<template>
  <div class="file-viewer">
    <div v-if="!fileHandle" class="file-selection">
      <h1>ファイルを開く</h1>
      <button @click="selectFile" class="select-button">ファイルを選択</button>
      <div class="recent-files">
        <h2>最近使ったファイル</h2>
        <ul v-if="recentFiles.length > 0">
          <li v-for="file in recentFiles" :key="file.id" @click="openRecentFile(file.handle)">
            {{ file.name }}
          </li>
        </ul>
        <p v-else>最近使ったファイルはありません。</p>
      </div>
    </div>

    <div v-else class="data-display-container">
      <div class="header">
        <h1>{{ fileName }}</h1>
        <div class="actions">
          <button class="edit-button">編集する</button>
          <button @click="closeFile" class="close-button">閉じる</button>
        </div>
      </div>

      <div v-if="tables.length > 1" class="table-selection">
        <select v-model="selectedTableId">
          <option v-for="table in tables" :key="table.thead.table_id" :value="table.thead.table_id">
            {{ table.thead.table_name }}
          </option>
        </select>
      </div>

      <div v-if="selectedTable" class="data-grid-container">
        <table class="data-grid">
          <thead>
            <tr>
              <th v-for="(value, key) in selectedTable.tbody.accounts.account_data[0]" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(account, index) in selectedTable.tbody.accounts.account_data" :key="index">
              <td v-for="(value, key) in account" :key="key">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
       <p v-else-if="tables.length > 0 && !selectedTable">テーブルを選択してください。</p>
       <p v-else>表示できるデータがありません。</p>
    </div>
  </div>
</template>

<script>
import FileSystem from '@/lib/file-system';
import Database from '@/lib/database';
import DataHandle from '@/lib/data-handle.js';

const fs = new FileSystem();
const db = new Database();
const dataHandler = new DataHandle();

export default {
  name: 'FileViewerView',
  data() {
    return {
      recentFiles: [],
      selectedTableId: null,
      tableData: null,
    };
  },
  computed: {
    fileHandle() {
      return this.$store.state.fileHandle;
    },
    fileName() {
      return this.fileHandle ? this.fileHandle.name : '';
    },
    tables() {
      return this.tableData?.root.body.tables.table_data || [];
    },
    selectedTable() {
      if (!this.selectedTableId || this.tables.length === 0) return null;
      return this.tables.find(t => t.thead.table_id === this.selectedTableId);
    }
  },
  methods: {
    async selectFile() {
      const handles = await fs.pickFile();
      if (handles && handles.length > 0) {
        const handle = handles[0];
        this.$store.commit('setFileHandle', handle);
        await db.addFile(handle.name, handle, handle.name);
        this.readFileContent(handle);
      }
    },
    async loadRecentFiles() {
      this.recentFiles = await db.getAllFiles();
    },
    async openRecentFile(handle) {
        this.$store.commit('setFileHandle', handle);
        this.readFileContent(handle);
    },
    async readFileContent(handle) {
      const content = await fs.readFile(handle);
      if (content) {
        dataHandler.importXml(content);
        this.tableData = dataHandler.jsonData;

        // テーブルが1つの場合は自動選択
        if (this.tables.length === 1) {
          this.selectedTableId = this.tables[0].thead.table_id;
        }
      } else {
          this.$dialog.alert('ファイルの読み込みに失敗しました。');
          this.closeFile();
      }
    },
    closeFile() {
      this.$store.commit('setFileHandle', null);
      this.tableData = null;
      this.selectedTableId = null;
    },
  },
  async mounted() {
    await this.loadRecentFiles();
    if (this.fileHandle) {
        this.readFileContent(this.fileHandle);
    }
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.file-viewer {
  padding: 2rem;
  max-width: 1200px;
  margin: auto;
}

.file-selection {
  text-align: center;
  h1 {
    margin-bottom: 2rem;
  }
  .select-button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    background-color: var.$button-color;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    &:hover {
      background-color: var.$button-hovered-color;
    }
  }
  .recent-files {
    margin-top: 3rem;
    text-align: left;
    h2 {
      border-bottom: 1px solid #eee;
      padding-bottom: 0.5rem;
    }
    ul {
      list-style: none;
      padding: 0;
      li {
        padding: 0.75rem;
        cursor: pointer;
        border-radius: 4px;
        &:hover {
          background-color: #f0f0f0;
        }
      }
    }
  }
}

.data-display-container {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    .actions {
        display: flex;
        gap: 1rem;
    }
  }
  .table-selection {
      margin-bottom: 1rem;
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
  thead {
    background-color: #f2f2f2;
  }
}
</style>