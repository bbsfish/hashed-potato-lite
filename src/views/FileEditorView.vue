<template>
  <div class="file-editor-view">
    <h1 v-if="tableData">{{ tableData.name }}</h1>
    <h1 v-else>ファイルの編集</h1>

    <!-- ファイルが選択済みで、テーブルデータがあるなら、テーブルを表示 -->
    <div v-if="dataHandle && tableData">
        <div>
          <button>テーブルを作成</button>
          <button>テーブル名を変更</button>
          <button>テーブルを削除</button>
        </div>
        <div v-if="tableData" ref="table"></div>
    </div>

    <!-- ファイルが選択済みでも、テーブルデータがないなら、テーブルを表示しない -->
    <p v-if="dataHandle && !tableData">表示するテーブルがありません。テーブルを作成してください</p>
    <!-- ファイルが選択されていないならメッセージを表示 -->
    <p v-if="!dataHandle">ファイルが選択されていません。設定するファイルを選択してください: <router-link :to="{ name: 'Home' }">選択する</router-link></p>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import IconPenToSquare from '@/components/icons/IconPenToSquare.vue';

export default {
  name: 'FileEditorView',
  components: {
    IconPenToSquare,
  },
  data() {
    return {
      // Tabulator 用の変数
      tabulator: null,
      tableColumns: [
        { title: 'SN', field: 'sn', formatter: 'rownum' },
        { title: 'イニシャル', field: 'it', sorter: 'string' },
        { title: 'サービス名', field: 'nm', sorter: 'string' },
        { title: 'カテゴリ', field: 'ct', sorter: 'string' },
        { title: '概要', field: 'sm', sorter: 'string' },
        { title: 'メール数', field: 'em_count' },
        { title: 'パスワード数', field: 'pw_count' },
        { title: '作成日時', field: 'ca', sorter: 'date' },
        { title: '最終更新日時', field: 'ua', sorter: 'date' },
        { title: '編集', field: 'edit', width: 70, hozAlign: 'center', headerSort: false,
          formatter: this.editIconFormatter, cellClick: this.goToDetailView },
      ],
      /** @type {TableData} TableData インスタンス */
      tableData: null,
      /** @type {AccountData[]} AccountData インスタンスの配列 */
      accountDataList: [],
    }
  },
  computed: {
    ...mapGetters(['dataHandle', 'isModified', 'clientPassword', 'isClientPasswordSet']),
    // ファイルデータのハンドラ
    head() { return this.dataHandle?.getHead(); },
    body() { return this.dataHandle?.getBody(); },
    // Tabulator 用に、AccountData インスタンスからプレーンな配列を生成
    source() {
      return this.accountDataList.map((ac) => {
        const data = ac.getData();
        return {
          ...data,
          em_count: data.em?.length ?? 0,
          pw_count: data.pw?.length ?? 0,
          ua: data.ua.toLocaleString(),
          ca: data.ca.toLocaleString(),
        }
      });
    },
  },
  created() {
    // テーブルデータを取得して 0 番目を tableData にセット
    const tables = this.body?.getTables();
    if (!tables) return;
    if (tables.length > 0) {
      this.tableData = tables[0];
      this.accountDataList = this.tableData.getAccounts();
    }
  },
  async mounted() {
    // Tabulator インスタンスをセットアップ
    this.tabulator = new Tabulator(this.$refs.table, {
      data: this.source,
      reactiveData: true,
      columns: this.tableColumns,
      height: 205,
    });
  },
  methods: {
    ...mapMutations(['setModified', 'setClientPassword']),
  },
}
</script>

<style scoped>
@import "tabulator-tables/dist/css/tabulator.min.css";
</style>
<style lang="scss" scoped>
@use '@/styles/variables.scss' as var;
</style>
