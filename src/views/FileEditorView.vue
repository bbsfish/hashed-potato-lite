<template>
  <div class='file-editor-view'>
    <div v-if="dataHandle">
      <div class='header-controls'>
        <div class='table-info'>
          <h1 v-if='tableData'>{{ tableData.name }}</h1>
          <h1 v-else>テーブルがありません</h1>
        </div>

        <div class='actions'>
          <button @click='saveFile' :disabled='!isModified' class='action-button save-button' title='保存'>
            <IconFloppyDisk size='1rem' />
            <span>保存</span>
          </button>
          
          <DropdownMenu title="表示するテーブルを選択" width="250px">
            <template #button>
              <IconBars size='1rem' />
              <span>テーブル選択</span>
            </template>
            <template #list>
              <li class="dropdown-menu" v-for='table in tables' :key='table.id' @click='selectTable(table.id)'>
                {{ table.name }} ({{ table.id }})
              </li>
            </template>
          </DropdownMenu>


          <DropdownMenu title="アクション" width="250px">
            <template #button>
              <IconEllipsisVertical size='1rem' />
            </template>
            <template #list>
              <li class="dropdown-menu" @click='createTable'>
                <IconPlus size='1rem' />
                <span>新しいテーブルを作成</span>
              </li>
              <hr class="dropdown-menu" v-if='tableData' />
              <li class="dropdown-menu" v-if='tableData' @click='renameTable'>
                <IconPenToSquare size='1rem' />
                <span>名前を変更</span>
              </li>
              <li class="dropdown-menu danger" v-if='tableData' @click='deleteTable'>
                <IconTrash size='1rem' />
                <span>テーブルを削除</span>
              </li>
            </template>
          </DropdownMenu>
        </div>
      </div>

      <div v-if='tableData'>
        <div ref='table'></div>
      </div>
      
      <p v-if='!tableData' class='no-table-message'>
        表示するテーブルがありません。「アクション」メニューから新しいテーブルを作成してください。
      </p>

      <button v-if='tableData' @click='addAccount' class='fab' title='アカウントを追加'>
        <IconPlus size='1.5rem' />
      </button>
    </div>

    <p v-if='!dataHandle' class='no-file-message'>
      ファイルが選択されていません。
      <router-link :to="{ name: 'Home' }">ホーム</router-link>
      からファイルを選択または作成してください。
    </p>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { TabulatorFull as Tabulator, InteractionModule } from 'tabulator-tables';
import FileSystem from '@/lib/file-system';
import IconPenToSquare from '@/components/icons/IconPenToSquare.vue';
import IconPlus from '@/components/icons/IconPlus.vue';
import IconFloppyDisk from '@/components/icons/IconFloppyDisk.vue';
import IconTrash from '@/components/icons/IconTrash.vue';
import IconEllipsisVertical from '@/components/icons/IconEllipsisVertical.vue';
import IconBars from '@/components/icons/IconBars.vue';
import DropdownMenu from '@/components/DropdownMenu.vue';
// import AccountDetailsModal from '@/components/AccountDetailsModal.vue'; // 未実装

export default {
  name: 'FileEditorView',
  components: {
    IconPenToSquare,
    IconPlus,
    IconFloppyDisk,
    IconTrash,
    IconEllipsisVertical,
    IconBars,
    DropdownMenu,
    // AccountDetailsModal, // 未実装
  },
  data() {
    return {
      tabulator: null, // Tabulator インスタンス
      tableData: null, // 現在表示中の TableData インスタンス
      accountDataList: [], // 現在表示中のテーブルのアカウントリスト
      fs: new FileSystem(), // FileSystem API
      selectedRowSn: null, // 選択中の行のSN
    };
  },
  computed: {
    ...mapGetters(['dataHandle', 'fileHandle', 'isModified', 'clientPassword', 'dataSubHandles']),
    /** @return {HeadData} */
    head() { return this.dataHandle?.getHead(); },
    /** @return {BodyData} */
    body() { return this.dataHandle?.getBody(); },
    /** @returns {TableData[]} */
    tables() {
      return this.body?.getTables() || [];
    },
    // Tabulator 用のデータソース
    source() {
      if (!this.accountDataList) return [];
      return this.accountDataList.map((ac) => {
        const data = ac.getData();
        return {
          ...data,
          em_count: data.em?.length ?? 0,
          pw_count: data.pw?.length ?? 0,
          ua: data.ua.toLocaleString(),
          ca: data.ca.toLocaleString(),
        };
      });
    },
    // Tabulator のカラム定義
    tableColumns() {
      // IconPenToSquare.vue の SVG パスデータを使用
      const iconPath = 'M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z';
      const formatterForEdit = () => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640' width='1.3rem' height='1.3rem' style='cursor: pointer;'><path d='${iconPath}' /></svg>`;

      return [
        { title: 'SN', field: 'sn', width: 60, resizable: false, formatter: 'rownum' },
        { title: 'イニシャル', field: 'it', sorter: 'string', width: 100 },
        { title: 'サービス名', field: 'nm', sorter: 'string', minWidth: 150 },
        { title: 'カテゴリ', field: 'ct', sorter: 'string', width: 120 },
        { title: '概要', field: 'sm', sorter: 'string', minWidth: 200, tooltip: true },
        { title: 'メール', field: 'em_count', width: 80, hozAlign: 'center' },
        { title: 'PW', field: 'pw_count', width: 80, hozAlign: 'center' },
        { title: '作成日時', field: 'ca', sorter: 'datetime', sorterParams: { format: 'yyyy/MM/dd HH:mm:ss' }, width: 160 },
        { title: '最終更新日時', field: 'ua', sorter: 'datetime', sorterParams: { format: 'yyyy/MM/dd HH:mm:ss' }, width: 160 },
        { 
          title: '編集', 
          field: 'edit', 
          width: 70, 
          hozAlign: 'center', 
          headerSort: false,
          resizable: false,
          formatter: formatterForEdit, 
          cellClick: (e, cell) => {
            const sn = cell.getRow().getData().sn;
            this.setDataSubHandles({ name: 'account', handle: this.tableData.getAccountBySn(sn) });
            this.setDataSubHandles({ name: 'table', handle: this.tableData });
            this.$router.push({ name: 'AccountDetails' });
          } 
        },
      ];
    },
  },
  created() {
    // コンポーネント作成時にデータ初期化を試みる
    if (!this.body) return;
    // テーブルリストを取得
    const tables = this.body.getTables();
    if (tables.length > 0) {
      // 最初のテーブルを選択状態にする
      this.tableData = tables[0];
      this.loadAccountData();
    } else {
      this.tableData = null;
      this.accountDataList = [];
    }
  },
  methods: {
    ...mapMutations(['setModified', 'setDataSubHandles']),
    /**
     * 選択中のテーブルのアカウント情報を読み込む
     */
    loadAccountData() {
      if (!this.tableData) return;
      this.accountDataList = this.tableData.getAccounts();
    },
    /**
     * Tabulator インスタンスをセット
     */
    setupTabulator() {
      if (!this.$refs.table) return; // マウント前なら何もしない
      if (this.tabulator) {
        // 既存インスタンスがあればデータを更新
        this.tabulator.setData(this.source);
      } else {
        // 新規インスタンスを作成
        this.tabulator = new Tabulator(this.$refs.table, {
          data: this.source,
          reactiveData: true,
          columns: this.tableColumns,
          layout: 'fitData',
          height: 'calc(100vh - 200px)', // ヘッダー分を引いた高さ
          selectable: 1, // 1行だけ選択可能
        });
        this.tabulator.on('rowClick', this.handleRowClick);
      }
    },
    /**
     * 行が選択されたときのイベントハンドラ
     * @param e イベントオブジェクト
     * @param row 行コンポーネント
     */
    handleRowClick(e, row) {
      const sn = row.getData().sn;
      console.log('sn', sn);
      if (this.selectedRowSn !== sn) {
        // 1回目のクリック (または違う行のクリック)
        this.selectedRowSn = sn;
      } else {
        // 2回目のクリックのとき、AccountDetailsへ遷移
        this.setDataSubHandles({ name: 'account', handle: this.tableData.getAccountBySn(sn) });
        this.setDataSubHandles({ name: 'table', handle: this.tableData });
        this.$router.push({ name: 'AccountDetails' });
      }
    },
    /**
     * テーブルの作成・更新・削除・選択
     */
    async createTable() {
      let tableName;
      let message  = '新しいテーブル名を入力してください';
      do {
        tableName = await this.$dialog.prompt(message);
        if (!tableName) return this.$snackbar('テーブルの作成をキャンセルしました');
        tableName = tableName.trim();
        if (tableName === '') message = 'テーブル名を空にすることはできません。新しいテーブル名を入力してください';
      } while (tableName === '');
      
      try {
        const newTable = this.body.addTable(tableName);
        this.setModified(true);
        this.tableData = newTable; // 新しく作成したテーブルに切り替え
        this.$snackbar(`テーブル「${tableName}」を作成しました`);
      } catch (err) {
        this.$dialog.alert(`テーブルの作成に失敗しました: ${err.message}`);
      }
    },
    async renameTable() {
      if (!this.tableData) return;
      let tableName;
      let message  = '新しいテーブル名を入力してください';
      do {
        tableName = await this.$dialog.prompt(message);
        if (!tableName) return this.$snackbar('テーブルの作成をキャンセルしました');
        tableName = tableName.trim();
        if (tableName === '') message = 'テーブル名を空にすることはできません。新しいテーブル名を入力してください';
      } while (tableName === '');

      try {
        this.tableData.name = tableName;
        this.setModified(true);
        this.$snackbar('テーブル名を変更しました');
      } catch (err) {
        this.$dialog.alert(`名前の変更に失敗しました: ${err.message}`);
      }
    },
    async deleteTable() {
      if (!this.tableData) return;
      const confirm = await this.$dialog.confirm(`テーブル「${this.tableData.name}」を削除しますか？\nこの操作は元に戻せません`);
      if (!confirm) return this.$snackbar('テーブルの削除がキャンセルされました');

      try {
        this.body.removeTable(this.tableData.id);
        this.setModified(true);
        this.$snackbar(`テーブル「${this.tableData.name}」を削除しました`);
        // データを再初期化（テーブルリストから削除し、別のテーブルを選択）
        this.initializeData();
      } catch (err) {
        this.$dialog.alert(`テーブルの削除に失敗しました: ${err.message}`);
      }
    },
    selectTable(tableId) {
      const newTable = this.body.getTableById(tableId);
      if (newTable) this.tableData = newTable;
    },
    /**
     * アカウントの作成・編集・削除
     */
    addAccount() {
      if (!this.tableData) return;
      // 新規アカウント追加モードでAccountDetailsViewへ遷移
      this.setDataSubHandles({ name: 'account', handle: null }); // 新規モード
      this.$router.push({ name: 'AccountDetails' });
    },
    editAccount(sn) {
      // アカウント更新モードでAccountDetailsViewへ遷移
      const handle = this.tableData.getAccountBySn(sn);
      this.setDataSubHandles({ name: 'account', handle }); // 更新モード
      this.$router.push({ name: 'AccountDetails' });
    },
    async deleteAccount(sn) {
      const confirm = await this.$dialog.confirm(`SN: ${sn} のアカウントを削除します。これには、このアカウントに含まれるすべてのデータが含まれます。もとには戻せません。よろしいですか?`);
      if (!confirm) return this.$snackbar('アカウントの削除がキャンセルされました');

      try {
        this.tableData.removeAccount(sn);
      } catch(err) {
        this.$dialog.alert(`アカウントの削除に失敗しました: ${err.message}`);
      }
    },
    /**
     * ファイルの保存
     */
    async saveFile() {
      if (!this.dataHandle || !this.fileHandle) return;

      try {
        const password = this.dataHandle.getHead().isEncrypted ? this.clientPassword : null;
        const { xml } = await this.dataHandle.export(password);
        const success = await this.fs.saveFile(this.fileHandle, xml);

        if (success) {
          this.setModified(false);
          this.$snackbar('ファイルを保存しました');
        } else {
          this.$dialog.alert('ファイルの保存に失敗しました');
        }
      } catch (error) {
        console.error('Error saving file:', error);
        this.$dialog.alert(`ファイルの保存中にエラーが発生しました: ${error.message}`);
      }
    },
  },
  watch: {
    // 表示するテーブルが切り替わったらデータをロードし、Tabulatorを更新
    tableData(newTable) {
      if (newTable) {
        this.loadAccountData();
        if (this.tabulator) {
          this.tabulator.setData(this.source);
        } else {
          // mountedより先にtableDataがセットされた場合
          this.$nextTick(() => {
            this.setupTabulator();
          });
        }
      } else {
        // テーブルが削除された場合など
        if (this.tabulator) {
          this.tabulator.destroy();
          this.tabulator = null;
        }
      }
    },
  },
  beforeUnmount() {
    // コンポーネント破棄時にTabulatorインスタンスを破棄
    if (this.tabulator) {
      this.tabulator.destroy();
      this.tabulator = null;
    }
  },
};
</script>

<style lang='scss' scoped>
@use '@/styles/variables.scss' as var;
@import 'tabulator-tables/dist/css/tabulator_simple.min.css';

.file-editor-view {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 1rem;
  box-sizing: border-box;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem 1rem 1rem;
  border-bottom: 1px solid var.$border-color;
  margin-bottom: 1rem;
}

.table-info h1 {
  margin: 0;
  font-size: 1.8rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

li.dropdown-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  svg {
    fill: var.$text-color;
  }

  &.danger {
    color: var.$danger-color;
    svg {
      fill: var.$danger-color;
    }
    &:hover {
      background-color: #fdd;
    }
  }
}

hr.dropdown-menu {
  border: none;
  border-top: 1px solid var.$border-color;
  margin: 0.5rem 0;
}

.save-button {
  background-color: var.$button-color;
  color: white;
  border-color: var.$button-color;

  svg {
    fill: white;
  }

  &:hover {
    background-color: var.$button-hovered-color;
  }

  &:disabled {
    background-color: #ccc;
    border-color: #ccc;
    cursor: not-allowed;
  }
}

// Tabulator スタイル調整
:deep(.tabulator) {
  border: 1px solid var.$border-color;
  border-radius: 8px;
}

:deep(.tabulator-header) {
  background-color: #f9f9f9;
  border-bottom: 2px solid var.$border-color;
}

:deep(.tabulator-row) {
  &:hover {
    background-color: #f0f4f8;
  }
  &.tabulator-selected {
    background-color: #e0eafc;
  }
}

.no-file-message,
.no-table-message {
  text-align: center;
  font-size: 1.2rem;
  color: var.$text-muted-color;
  margin-top: 3rem;
}

// FAB (Floating Action Button)
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var.$button-color;
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;

  svg {
    fill: white;
  }

  &:hover {
    background-color: var.$button-hovered-color;
    transform: scale(1.05);
  }
}
</style>
