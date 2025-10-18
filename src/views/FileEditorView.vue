<template>
  <div class="file-editor-view">
    <div v-if="dataHandle">
      <LoadingOverlay v-if="isLoading" :m="loadingMessage" />
      <div class="action-bar">
        <input type="text" v-model="searchQuery" placeholder="テーブル内を検索..." class="search-input" />
        <div class="buttons">
          <button @click="addNewTable" class="action-button">
            <IconPlus size="1rem" />
            <span>テーブルを追加</span>
          </button>
          <button @click="saveFile" class="action-button save-button" :disabled="!isModified">
            <IconFloppyDisk size="1rem" />
            <span>保存</span>
          </button>
        </div>
      </div>

      <div class="tables-container">
        <div v-for="table in filteredTables" :key="table.id" class="table-card">
          <div class="table-header">
            <input v-model="table.name" @change="updateTableName(table)" class="table-name-input" />
            <div class="table-actions">
              <button @click="addNewAccount(table)" title="アカウントを追加">
                <IconPlus />
              </button>
              <button @click="deleteTable(table)" title="テーブルを削除">
                <IconTrash />
              </button>
            </div>
          </div>

          <div class="data-table-wrapper">
            <table class="data-table">
              <draggable v-model="columns" tag="thead" item-key="key">
                <template #item="{ element: column }">
                  <th @click="sortBy(column.key)">
                    {{ getColumnName(column.key) }}
                    <span v-if="sortKey === column.key">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
                  </th>
                </template>
              </draggable>
              <tbody>
                <tr v-for="account in sortedAccounts(table)" :key="account.serialNumber" @click="selectAccount(account)">
                  <td v-for="column in columns" :key="column.key">
                    {{ getAccountValue(account, column.key) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AccountDetailModal v-if="selectedAccount" :account="selectedAccount" @close="selectedAccount = null" @update="handleAccountUpdate" />
    </div>
    <div v-else class="no-file-selected">
      <p>ファイルが選択されていません。編集するファイルを選択または作成してください。</p>
      <router-link :to="{ name: 'Home' }">ホームに戻る</router-link>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import draggable from 'vuedraggable';
import FileSystem from '@/lib/file-system';
import IconPlus from '@/components/icons/IconPlus.vue';
import IconFloppyDisk from '@/components/icons/IconFloppyDisk.vue';
import IconTrash from '@/components/icons/IconTrash.vue';
import AccountDetailModal from '@/components/AccountDetailModal.vue';
import api from '@/lib/api';
import LoadingOverlay from '@/components/LoadingOverlay.vue';

const fs = new FileSystem();

export default {
  name: 'FileEditorView',
  components: {
    draggable,
    IconPlus,
    IconFloppyDisk,
    IconTrash,
    AccountDetailModal,
    LoadingOverlay,
  },
  data() {
    return {
      isLoading: false,
      loadingMessage: '',
      searchQuery: '',
      sortKey: 'sn',
      sortOrder: 'asc',
      selectedAccount: null,
      columns: [
        { key: 'sn', name: 'SN' },
        { key: 'it', name: 'イニシャル' },
        { key: 'nm', name: 'サービス名' },
        { key: 'ct', name: 'カテゴリ' },
        { key: 'sm', name: '概要' },
        { key: 'em_count', name: 'メール数' },
        { key: 'pw_count', name: 'パスワード数' },
      ],
    };
  },
  computed: {
    ...mapGetters(['dataHandle', 'fileHandle', 'isModified', 'clientPassword']),
    head() {
      return this.dataHandle ? this.dataHandle.getHead() : null;
    },
    body() {
      return this.dataHandle ? this.dataHandle.getBody() : null;
    },
    tables() {
      return this.dataHandle ? this.dataHandle.getBody().getTables() : [];
    },
    filteredTables() {
      if (!this.searchQuery) {
        return this.tables;
      }
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      return this.tables.filter(table => {
        return table.getAccounts().some(account => {
          return Object.values(account.getData()).some(value =>
            String(value).toLowerCase().includes(lowerCaseQuery)
          );
        });
      });
    },
  },
  methods: {
    ...mapMutations(['setModified', 'setDataHandle']),
    
    // カラム関連
    getColumnName(key) {
      const col = this.columns.find(c => c.key === key);
      // TODO: カラムエイリアスを考慮した実装
      return col ? col.name : key;
    },
    
    // データ取得関連
    getAccountValue(account, key) {
      const data = account.getData();
      if (key === 'em_count') {
        return Array.isArray(data.em) ? data.em.length : 0;
      }
      if (key === 'pw_count') {
        return Array.isArray(data.pw) ? data.pw.length : 0;
      }
      return data[key] || '';
    },

    // ソート
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    sortedAccounts(table) {
      const accounts = [...table.getAccounts()];
      return accounts.sort((a, b) => {
        let valA = this.getAccountValue(a, this.sortKey);
        let valB = this.getAccountValue(b, this.sortKey);
        
        const modifier = this.sortOrder === 'asc' ? 1 : -1;

        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
      });
    },
    
    // CRUD操作
    async addNewTable() {
      let tableName = '';
      let message = '新しいテーブル名を入力してください'
      do {
        tableName = await this.$dialog.prompt(message);
        if (!tableName) return this.$snackbar('テーブルの作成がキャンセルされました');
        tableName = tableName.trim();
        if (tableName === '') message = 'テーブル名を空にすることはできません。新しいテーブル名を入力してください';
      } while (tableName === '');
      this.body.addTable(tableName);
      this.setModified(true);
    },
    async deleteTable(table) {
      if(await this.$dialog.confirm(`テーブル「${table.name}」を削除しますか？この操作は元に戻せません`)) {
        // data-handle.jsにテーブル削除機能の実装が必要
        // this.dataHandle.getBody().deleteTable(table.id);
        this.$snackbar('テーブル削除機能は未実装です');
        // this.setModified(true);
      }
    },
    updateTableName(table) {
      // data-handle.jsにテーブル名変更機能の実装が必要
      this.$snackbar('テーブル名変更機能は未実装です');
      // this.setModified(true);
    },
    async addNewAccount(table) {
      let serviceName = '';
      let message = '新しいアカウントのサービス名を入力してください';
      do {
        serviceName = await this.$dialog.prompt(message);
        if (!serviceName) return this.$snackbar('アカウントデータの追加がキャンセルされました');
        serviceName = serviceName.trim();
        if (serviceName === '') message = 'サービス名を空にすることはできません。新しいアカウントのサービス名を入力してください';
      } while (serviceName === '');

      table.addAccount({
        nm: serviceName,
        it: serviceName.slice(0, 2).toUpperCase(),
        ct: '未分類',
        sm: '',
        st: '有効',
      });
      this.setModified(true);
    },
    selectAccount(account) {
      this.selectedAccount = account;
    },
    handleAccountUpdate() {
      this.setModified(true);
    },

    // ファイル保存
    async saveFile() {
      this.isLoading = true;
      this.loadingMessage = 'ファイルを保存しています...';

      try {
        // A. 暗号化がオンならファイルを暗号化して保存
        if (this.head.isEncrypted) {
          let clientPassword = this.clientPassword;
          let useLastPassword = false;

          // 既存のパスワードがある場合は再利用するか確認
          this.loadingMessage = 'ユーザーの確認を待っています...';
          if (clientPassword) useLastPassword = await this.$dialog.confirm(
            `ファイルの暗号化に前回と同じパスワードを使用しますか? (現在、${clientPassword.length} 桁のパスワードが使用されています)`
          );

          this.loadingMessage = 'ユーザーの入力を待っています...';

          // 既存のマスターパスワードがない、もしくは再利用しない場合は新規にマスターパスワードを入力
          if (!useLastPassword) {
            do {
              clientPassword = await this.$dialog.password('ファイルのマスターパスワードを入力してください (マスターパスワードは4桁以上にする必要があります)');
              if (!clientPassword) return this.$snackbar('マスターパスワードの入力がキャンセルされました。保存を中止します');
              clientPassword = clientPassword.trim();
            } while (clientPassword === '' || clientPassword.length < 4);

            let confirmPassword = '';
            do {
              confirmPassword = await this.$dialog.password('マスターパスワードを再入力してください');
              if (!confirmPassword) return this.$snackbar('確認用マスターパスワードの入力がキャンセルされました。保存を中止します');
              confirmPassword = confirmPassword.trim();
            } while (confirmPassword === '' || confirmPassword.length < 4);

            if (clientPassword !== confirmPassword) return this.$dialog.alert('マスターパスワードが一致しません。保存を中止します');
            this.$store.commit('setClientPassword', clientPassword);
          }

          // ワンタイムパスワードを入力
          let token;
          let message = 'お使いの認証デバイスに表示されている、6桁のワンタイムパスワードを入力してください';
          do {
            token = await this.$dialog.prompt(message, { inputType: 'number' });
            if (!token) return this.$snackbar('ワンタイムパスワードの入力がキャンセルされました。保存を中止します');
            if (String(token).length !== 6) message = 'ワンタイムパスワードは6桁でなければなりません。\nお使いの認証デバイスに表示されている、6桁のワンタイムパスワードを入力してください';
          } while (String(token).length !== 6);

          // ユーザのアクセス情報を取得して、OTP とともにサーバに送信
          this.loadingMessage = 'ワンタイムパスワードを検証しています...';
          const userNetInfo = await api.getNetInfo(); // ユーザのネットワーク情報を取得
          const totpResult = await api.post(api.TOTP_VERIFICATION, {
            file_id: this.head.fileId,
            mode: 'encrypt',
            token,
            ip_address: userNetInfo.ip,
            region: userNetInfo.timezone,
          });
          if (totpResult.status === 'error') throw new Error('ワンタイムパスワードの認証に失敗しました');

          // パスワードを結合して暗号化
          this.loadingMessage = 'ファイルデータを生成しています...';
          const fullPassword = clientPassword + totpResult.server_password;
          const expResult = await this.dataHandle.export(fullPassword);

          // サーバーに暗号情報を登録
          this.loadingMessage = '暗号化情報を保存しています...';
          let uploadResult = null;
          do {
            uploadResult = await api.post(api.KEYS_REGISTRATION, {
              file_id: this.head.fileId,
              iv_base64: expResult.ivBase64,
              salt_base64: expResult.saltBase64,
            });
          } while (uploadResult.status !== 'success');

          // 完了したら書き込み
          this.loadingMessage = 'ファイルを書き込んでいます...';
          let isSuccess = false;
          do {
            isSuccess = await fs.saveFile(this.fileHandle, expResult.xml);
          } while (!isSuccess);
        }
        // B. 暗号化がオフならファイルをそのまま保存
        else {
          this.loadingMessage = 'ファイルデータを生成しています...';
          const expResult = await this.dataHandle.export();

          this.loadingMessage = 'ファイルを書き込んでいます...';
          let isSuccess = false;
          do {
            isSuccess = await fs.saveFile(this.fileHandle, expResult.xml);
          } while (!isSuccess);
        }

        this.setModified(false);
        this.$snackbar('ファイルを保存しました');
      } catch (err) {
        console.error(err);
        this.$dialog.alert('ファイルの保存中にエラーが発生しました: ' + err.message);
      } finally {
        this.isLoading = false;
        this.loadingMessage = '';
      }
    }
  },
  mounted() {
    // dataHandle からカラム順序などをロードする処理
    const options = this.head?.getOptions();
    if(options && options.columnOrder.length > 0) {
      this.columns = options.columnOrder.map(key => this.columns.find(c => c.key === key));
    }
  }
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.file-editor-view {
  padding: 1rem;
  height: calc(100vh - 60px); // ヘッダー分を引く
  display: flex;
  flex-direction: column;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);

  .search-input {
    padding: 0.5rem 1rem;
    border: 1px solid var.$border-color;
    border-radius: 4px;
    font-size: 1rem;
    width: 300px;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid var.$border-color;
    background-color: var.$white;
    cursor: pointer;
    font-weight: bold;
    &:hover {
      background-color: #f5f5f5;
    }
    &.save-button {
      background-color: var.$button-color;
      color: white;
      border-color: var.$button-color;
      &:hover {
        background-color: var.$button-hovered-color;
      }
      &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
    }
  }
}

.tables-container {
  flex-grow: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 1rem;
}

.table-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  .table-name-input {
    font-size: 1.5rem;
    font-weight: bold;
    border: none;
    padding: 0.25rem;
    &:focus {
      outline: none;
      background-color: #f0f0f0;
    }
  }

  .table-actions {
    display: flex;
    gap: 0.5rem;
    button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      &:hover {
        background-color: #eee;
      }
    }
  }
}

.data-table-wrapper {
  overflow-x: auto;
  flex-grow: 1;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var.$border-color;
  }

  thead {
    th {
      cursor: pointer;
      user-select: none;
      position: sticky;
      top: 0;
      background-color: #f9f9f9;
      &:hover {
        background-color: #f0f0f0;
      }
    }
  }

  tbody {
    tr {
      cursor: pointer;
      transition: background-color 0.2s;
      &:hover {
        background-color: #f5f5f5;
      }
    }
  }
}

.no-file-selected {
  text-align: center;
  margin-top: 4rem;
}
</style>