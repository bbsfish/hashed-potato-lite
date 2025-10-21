<template>
  <div class='account-details-view' v-if='accData'>
    <header class='view-header'>
      <h1>アカウント詳細</h1>
      <div class='actions'>
        <button class='save-button' @click='saveData' title='保存'>
          <IconFloppyDisk size='1rem' />
          <span>保存</span>
        </button>
        <button class='delete-button' @click='deleteData' title='削除'>
          <IconTrash size='1rem' />
          <span>削除</span>
        </button>
        <button class='cancel-button' @click='goBack' title='キャンセル'>
          <span>キャンセル</span>
        </button>
      </div>
    </header>

    <form class='details-form' @submit.prevent='saveData'>
      
      <section class='form-section'>
        <h2>基本情報</h2>
        
        <div class='form-grid'>
          <div class='form-group readonly'>
            <label>シリアル番号 (SN)</label>
            <p>{{ accData.sn }}</p>
          </div>
          
          <div class='form-group required'>
            <label for='nm'>サービス名</label>
            <input id='nm' type='text' v-model='accData.nm' required>
          </div>
          
          <div class='form-group required'>
            <label for='it'>イニシャル</label>
            <input id='it' type='text' v-model='accData.it' required>
          </div>
          
          <div class='form-group required'>
            <label for='ct'>カテゴリ</label>
            <input id='ct' type='text' v-model='accData.ct' required>
          </div>
          
          <div class='form-group'>
            <label for='sct'>サブカテゴリ</label>
            <input id='sct' type='text' v-model='accData.sct'>
          </div>
          
          <div class='form-group required'>
            <label for='st'>ステータス</label>
            <input id='st' type='text' v-model='accData.st' required>
          </div>
        </div>

        <div class='form-group required'>
          <label for='sm'>概要</label>
          <textarea id='sm' v-model='accData.sm' required></textarea>
        </div>
        
        <div class='form-grid readonly-grid'>
          <div class='form-group readonly'>
            <label>作成日時</label>
            <p>{{ new Date(accData.ca).toLocaleString() }}</p>
          </div>
          <div class='form-group readonly'>
            <label>更新日時</label>
            <p>{{ new Date(accData.ua).toLocaleString() }}</p>
          </div>
        </div>
      </section>

      <section class='form-section'>
        <h2>認証情報</h2>
        <DynamicList :items='accData.ui' @update:items='accData.ui = $event' title='ユーザーID' field-name='ui' />
        
        <DynamicList v-model:items='accData.pw' title='パスワード' field-name='pw'>
          <template #item='{ item }'>
            <div class='nested-item-grid'>
              <div class='form-group'>
                <label>パスワード</label>
                <ActionBox :text='item.pw' />
              </div>
              <div class='form-group'>
                <label>概要</label>
                <input type='text' v-model='item.sm'>
              </div>
              <div class='form-group readonly'>
                <label>更新日時</label>
                <p>{{ new Date(item.ua).toLocaleString() }}</p>
              </div>
            </div>
          </template>
        </DynamicList>
      </section>

      <section class='form-section'>
        <h2>連絡先・個人情報</h2>
        <DynamicList v-model:items='accData.em' title='メールアドレス' field-name='em'>
          <template #item='{ item }'>
            <div class='nested-item-grid'>
              <div class='form-group'>
                <label>ラベル</label>
                <input type='text' v-model='item.nm'>
              </div>
              <div class='form-group'>
                <label>メールアドレス</label>
                <input type='email' v-model='item.em'>
              </div>
              <div class='form-group'>
                <label>概要</label>
                <input type='text' v-model='item.sm'>
              </div>
            </div>
          </template>
        </DynamicList>
        
        <DynamicList :items='accData.nickname' @update:items='accData.nickname = $event' title='ニックネーム' field-name='nickname' />
        <DynamicList :items='accData.phonenumber' @update:items='accData.phonenumber = $event' title='電話番号' field-name='phonenumber' />
        <DynamicList :items='accData.birthday' @update:items='accData.birthday = $event' title='誕生日 (yyyy.mm.dd)' field-name='birthday' />
        <DynamicList :items='accData.legal_name' @update:items='accData.legal_name = $event' title='本名' field-name='legal_name' />

        <DynamicList v-model:items='accData.address' title='住所' field-name='address'>
          <template #item='{ item }'>
            <div class='nested-item-grid'>
              <div class='form-group'>
                <label>郵便番号</label>
                <input type='text' v-model='item.postcode'>
              </div>
              <div class='form-group'>
                <label>住所</label>
                <input type='text' v-model='item.address'>
              </div>
            </div>
          </template>
        </DynamicList>
      </section>

      <section class='form-section'>
        <h2>金融情報</h2>
        <DynamicList v-model:items='accData.bank' title='銀行口座' field-name='bank'>
          <template #item='{ item }'>
            <div class='nested-item-grid bank-grid'>
              <div class='form-group'>
                <label>銀行名</label>
                <input type='text' v-model='item.nm'>
              </div>
              <div class='form-group'>
                <label>金融コード</label>
                <input type='text' v-model='item.financial_code'>
              </div>
              <div class='form-group'>
                <label>支店名</label>
                <input type='text' v-model='item.branch.nm'>
              </div>
              <div class='form-group'>
                <label>支店コード</label>
                <input type='text' v-model='item.branch.branch_code'>
              </div>
              <div class='form-group'>
                <label>口座番号</label>
                <input type='text' v-model='item.account_number'>
              </div>
              <div class='form-group'>
                <label>概要</label>
                <input type='text' v-model='item.sm'>
              </div>
            </div>
          </template>
        </DynamicList>
        
        <DynamicList v-model:items='accData.credit' title='クレジットカード' field-name='credit'>
          <template #item='{ item }'>
            <div class='nested-item-grid credit-grid'>
              <div class='form-group'>
                <label>カード名</label>
                <input type='text' v-model='item.nm'>
              </div>
              <div class='form-group'>
                <label>ステータス</label>
                <input type='text' v-model='item.st'>
              </div>
              <div class='form-group'>
                <label>ブランド</label>
                <input type='text' v-model='item.brand'>
              </div>
              <div class='form-group'>
                <label>セキュリティコード</label>
                <input type='text' v-model='item.sec_code'>
              </div>
              <div class='form-group'>
                <label>有効期限 (mm.yy)</label>
                <input type='text' v-model='item.expiration'>
              </div>
            </div>
            <DynamicList v-model:items='item.related_numbers' title='関連番号' field-name='related_numbers' :is-nested='true'>
              <template #item='{ item: subItem }'>
                <div class='nested-item-grid'>
                  <div class='form-group'>
                    <label>ラベル</label>
                    <input type='text' v-model='subItem.nm'>
                  </div>
                  <div class='form-group'>
                    <label>番号</label>
                    <input type='text' v-model='subItem.text'>
                  </div>
                </div>
              </template>
            </DynamicList>
          </template>
        </DynamicList>
      </section>

      <section class='form-section'>
        <h2>その他</h2>
        <DynamicList v-model:items='accData.website' title='ウェブサイト' field-name='website'>
          <template #item='{ item }'>
            <div class='nested-item-grid'>
              <div class='form-group'>
                <label>ラベル</label>
                <input type='text' v-model='item.nm'>
              </div>
              <div class='form-group'>
                <label>URL</label>
                <input type='url' v-model='item.url'>
              </div>
            </div>
          </template>
        </DynamicList>
        
        <DynamicList v-model:items='accData.memo' title='メモ' field-name='memo'>
          <template #item='{ item }'>
            <div class='nested-item-grid'>
              <div class='form-group'>
                <label>ラベル</label>
                <input type='text' v-model='item.nm'>
              </div>
              <div class='form-group'>
                <label>テキスト</label>
                <textarea v-model='item.text'></textarea>
              </div>
            </div>
          </template>
        </DynamicList>
        
        <DynamicList v-model:items='accData.code' title='コード' field-name='code'>
          <template #item='{ item }'>
            <div class='nested-item-grid'>
              <div class='form-group'>
                <label>ラベル</label>
                <input type='text' v-model='item.nm'>
              </div>
              <div class='form-group'>
                <label>ステータス</label>
                <input type='text' v-model='item.st'>
              </div>
              <div class='form-group'>
                <label>テキスト</label>
                <textarea v-model='item.text'></textarea>
              </div>
            </div>
          </template>
        </DynamicList>
        
        <DynamicList v-model:items='accData.link' title='リンク' field-name='link'>
          <template #item='{ item }'>
            <div class='nested-item-grid'>
              <div class='form-group'>
                <label>テーブルID</label>
                <input type='text' v-model='item.table'>
              </div>
              <div class='form-group'>
                <label>シリアル番号 (SN)</label>
                <input type='number' v-model.number='item.sn'>
              </div>
            </div>
          </template>
        </DynamicList>

        <DynamicList :items='accData.number' @update:items='accData.number = $event' title='数値' field-name='number' />
        <DynamicList :items='accData.text' @update:items='accData.text = $event' title='テキスト' field-name='text' />
      </section>

    </form>
  </div>
  <div v-else class='no-data'>
    <p>アカウントデータが選択されていません。</p>
    <button @click='goBack'>エディタに戻る</button>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import IconFloppyDisk from '@/components/icons/IconFloppyDisk.vue';
import IconTrash from '@/components/icons/IconTrash.vue';
import ActionBox from '@/components/ActionBox.vue';

// 動的リストコンポーネントを内部で定義
const DynamicList = {
  name: 'DynamicList',
  props: {
    items: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    fieldName: {
      type: String,
      required: true
    },
    // 単純な文字列配列 (ui, nickname など) かどうか
    isSimple: {
      type: Boolean,
      default: false
    },
    isNested: {
      type: Boolean,
      default: false,
    }
  },
  emits: ['update:items'],
  methods: {
    addItem() {
      const newItems = [...this.items];
      // fieldName に基づいてデフォルトのオブジェクトを作成
      let newItem;
      switch(this.fieldName) {
        case 'ui':
        case 'nickname':
        case 'phonenumber':
        case 'birthday':
        case 'legal_name':
        case 'number':
        case 'text':
          newItem = ''; // 単純な文字列
          break;
        case 'em':
          newItem = { nm: '', em: '', sm: '' };
          break;
        case 'pw':
          newItem = { pw: '', sm: '', ua: new Date().toISOString() };
          break;
        case 'website':
          newItem = { nm: '', url: '' };
          break;
        case 'address':
          newItem = { postcode: '', address: '' };
          break;
        case 'bank':
          newItem = { nm: '', sm: '', financial_code: '', branch: { nm: '', branch_code: '' }, account_number: '' };
          break;
        case 'credit':
          newItem = { nm: '', st: '', brand: '', sec_code: '', expiration: '', related_numbers: [] };
          break;
        case 'related_numbers': // クレジットカード内のネスト
          newItem = { nm: '', text: '' };
          break;
        case 'memo':
          newItem = { nm: '', text: '' };
          break;
        case 'code':
          newItem = { nm: '', st: '', text: '' };
          break;
        case 'link':
          newItem = { table: '', sn: null };
          break;
        default:
          newItem = {};
      }
      newItems.push(newItem);
      this.$emit('update:items', newItems);
    },
    removeItem(index) {
      const newItems = [...this.items];
      newItems.splice(index, 1);
      this.$emit('update:items', newItems);
    },
    updateItem(index, value) {
      const newItems = [...this.items];
      newItems[index] = value;
      this.$emit('update:items', newItems);
    }
  },
  template: `
    <div class='dynamic-list' :class='{ "is-nested": isNested }'>
      <h3 class='list-title'>
        <span>{{ title }}</span>
        <button type='button' @click='addItem' class='add-item-btn'>+</button>
      </h3>
      <ul v-if='items.length > 0' class='item-list'>
        <li v-for='(item, index) in items' :key='index' class='list-item'>
          <button type='button' @click='removeItem(index)' class='remove-item-btn'>×</button>
          
          <div v-if='isSimple' class='form-group simple-item'>
            <input type='text' :value='item' @input='updateItem(index, $event.target.value)'>
          </div>
          
          <slot v-else name='item' :item='item' :index='index'></slot>
        </li>
      </ul>
      <p v-else class='no-items'>データがありません</p>
    </div>
  `
};


export default {
  name: 'AccountDetailsView',
  components: {
    IconFloppyDisk,
    IconTrash,
    ActionBox,
    DynamicList
  },
  data() {
    return {
      accData: null,
      accDataHandle: null,
    };
  },
  computed: {
    ...mapGetters(['dataHandle', 'isModified', 'dataSubHandles']),
    tableDataHandle() {
      return this.dataSubHandles.table;
    }
  },
  created() {
    // コンポーネント作成時にデータをロード
    this.loadData();

    if (!this.accDataHandle) {
      this.$snackbar('アカウント情報が読み込めませんでした。エディタに戻ります');
      this.goBack();
    }
  },
  methods: {
    ...mapMutations(['setModified', 'setDataSubHandles']),
    /**
     * ストアのハンドルからデータをロードし、ローカルにディープコピーする
     */
    loadData() {
      if (!this.tableDataHandle) return;
      // アカウントデータハンドルがあるときは、編集モード
      const accDataHandle = this.dataSubHandles.account;
      if (accDataHandle) {
        this.accDataHandle = accDataHandle;
        this.accData = this.accDataHandle.getData();
        // const fields = [
        //   'ui', 'em', 'pw', 'nickname', 'website', 'phonenumber', 'birthday', 
        //   'address', 'legal_name', 'bank', 'credit', 'memo', 'code', 'number', 'text', 'link'
        // ];
      }
      // アカウントデータハンドルがないときは、作成モード
      else {
        this.accData = { nm: null, it: null, ct: null, sm: null, st: null };
        this.accDataHandle = this.tableDataHandle.addAccount(this.accData);
      }
    },
    /**
     * 変更を保存する
     */
    async saveData() {
      if (!this.accDataHandle || !this.accData) {
        this.$dialog.alert('保存対象のデータが見つかりません。');
        return;
      }

      try {
        // accData インスタンスの update メソッドを呼び出す
        // update メソッドが内部で更新日時や modified フラグを処理すると仮定
        this.accDataHandle.update(this.accData);
        
        this.$store.commit('setModified', true);
        this.$snackbar('アカウント情報を更新しました');
        this.goBack();

      } catch (error) {
        console.error('アカウントの保存に失敗しました:', error);
        this.$dialog.alert(`保存エラー: ${error.message}`);
      }
    },

    /**
     * アカウントを削除する
     */
    async deleteData() {
      if (!this.accDataHandle) {
        this.$dialog.alert('削除対象のデータが見つかりません。');
        return;
      }

      const confirm = await this.$dialog.confirm(
        `アカウント「${this.accDataHandle.serviceName}」を削除しますか？\nこの操作は元に戻せません。`
      );
      if (!confirm) return;

      try {
        // data-handle.js の TableData に removeAccount(sn) がないため、
        // accData ハンドルが持つ親テーブルの配列を直接操作する
        
        const snToDelete = this.accDataHandle.serialNumber;
        // this.accDataHandle.table は TableData の生のテーブルオブジェクト
        const accountsArray = this.accDataHandle.table.tbody.ac; 
        
        const indexToDelete = accountsArray.findIndex(a => a.sn === snToDelete);

        if (indexToDelete > -1) {
          accountsArray.splice(indexToDelete, 1);
          
          // 変更日時を手動で更新 (data-handle.js に getISOString があるがインポートできないため)
          const now = new Date().toISOString();
          this.accDataHandle.table.thead.ua = now; // 親テーブルの更新日時
          this.accDataHandle.data.root.head.updated_at = now; // ファイル全体の更新日時
          
          this.$store.commit('setModified', true);
          this.$snackbar('アカウントを削除しました');
          
          // ストアのハンドルをクリア
          this.$store.commit('setDataSubHandles', { name: 'account', handle: null });
          
          this.goBack();
        } else {
          this.$dialog.alert('削除対象のアカウントがテーブル内で見つかりませんでした。');
        }
      } catch (error) {
        console.error('アカウントの削除に失敗しました:', error);
        this.$dialog.alert(`削除エラー: ${error.message}`);
      }
    },

    /**
     * 前のビュー（ファイルエディタ）に戻る
     */
    goBack() {
      // ストアのハンドルをクリア
      this.$store.commit('setDataSubHandles', { name: 'account', handle: null });
      
      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        // 履歴がない場合（例: 直アクセス）、FileEditor にフォールバック
        this.$router.push({ name: 'FileEditor' });
      }
    }
  },
  watch: {
    // ストアのハンドルが外部から変更された場合（通常はないが念のため）
    accDataHandle(newHandle) {
      if (newHandle) {
        this.loadData();
      } else {
        this.accData = null;
      }
    }
  },
};
</script>

<style lang='scss' scoped>
@use '@/styles/variables.scss' as var;

.account-details-view {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: var.$white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var.$border-color;
  padding-bottom: 1rem;
  margin-bottom: 2rem;

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 4px;
    border: 1px solid var.$border-color;
    background-color: var.$white;
    color: var.$text-color;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }
  }

  .save-button {
    background-color: var.$button-color;
    color: white;
    border-color: var.$button-color;
    svg { fill: white; }
    &:hover { background-color: var.$button-hovered-color; }
  }

  .delete-button {
    background-color: var.$danger-color;
    color: white;
    border-color: var.$danger-color;
    svg { fill: white; }
    &:hover { background-color: darken(var.$danger-color, 10%); }
  }
}

.details-form {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.form-section {
  h2 {
    font-size: 1.3rem;
    color: var.$button-color;
    margin-top: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  &.readonly-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;

  label {
    font-weight: bold;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }
  
  &.required label::after {
    content: ' *';
    color: var.$danger-color;
  }

  input[type='text'],
  input[type='email'],
  input[type='url'],
  input[type='number'],
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
    min-height: 80px;
    resize: vertical;
  }

  p {
    margin: 0;
    padding: 0.75rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    font-size: 1rem;
    word-break: break-all;
  }
}

/* 動的リストのスタイル */
:deep(.dynamic-list) {
  margin-bottom: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  
  &.is-nested {
    margin-top: 1rem;
    border: 1px dashed #ccc;
  }
  
  .list-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f9f9f9;
    padding: 0.75rem 1rem;
    margin: 0;
    font-size: 1rem;
    font-weight: bold;
    border-bottom: 1px solid #eee;
    border-radius: 8px 8px 0 0;
  }
  
  .add-item-btn {
    font-size: 1.5rem;
    font-weight: bold;
    color: var.$button-color;
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.5rem;
    &:hover { color: var.$button-hovered-color; }
  }

  .item-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .list-item {
    position: relative;
    padding: 1rem 1rem 1rem 3rem;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }

  .remove-item-btn {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: var.$danger-color;
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 0.25rem;
    &:hover { color: darken(var.$danger-color, 10%); }
  }

  .no-items {
    padding: 1rem;
    color: var.$text-muted-color;
    text-align: center;
    margin: 0;
  }
  
  .simple-item {
    padding-top: 0.5rem; // remove-item-btn との高さを合わせる
  }
}

/* ネストされたアイテムのグリッド */
:deep(.nested-item-grid) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  .form-group {
    label { font-size: 0.85rem; }
    input, textarea, p { font-size: 0.95rem; padding: 0.5rem; }
    textarea { min-height: 60px; }
  }

  // 3列レイアウト
  &.bank-grid, &.credit-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

.no-data {
  text-align: center;
  margin-top: 3rem;
  p {
    font-size: 1.2rem;
    color: var.$text-muted-color;
  }
  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid var.$border-color;
    background-color: var.$white;
  }
}
</style>