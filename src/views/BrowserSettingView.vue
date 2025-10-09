<template>
  <div class="settings-view">
    <h1>アプリケーション設定</h1>

    <div class="setting-card">
      <h2>全般</h2>
      <div class="form-group">
        <label for="username">ユーザー名</label>
        <input id="username" type="text" v-model="settings.username" placeholder="名前を入力">
      </div>
      <button @click="saveSettings" class="save-button">設定を保存</button>
    </div>

    <div class="setting-card">
      <h2>ファイルエディタの表示設定</h2>
      <div class="form-group">
        <label for="default-column-order">デフォルトの列順序</label>
        <p class="description">
          新しいテーブルを作成した際の列の表示順を設定します。キーをカンマ区切りで入力してください。
        </p>
        <textarea id="default-column-order" v-model="defaultColumnOrderStr" rows="4"></textarea>
      </div>
      
      <div class="form-group">
        <label>列のエイリアス（表示名）</label>
         <p class="description">
          テーブルヘッダーに表示される名前を自由に変更できます。
        </p>
        <div v-for="(alias, key) in settings.columnAliases" :key="key" class="alias-group">
          <span class="original-key">{{ key }}:</span>
          <input type="text" v-model="settings.columnAliases[key]" placeholder="表示名を入力">
        </div>
      </div>
      <button @click="saveSettings" class="save-button">設定を保存</button>
    </div>
    
    <div class="setting-card danger-zone">
      <h2>データ管理</h2>
      <div class="action-group">
        <p>最近使用したファイルの履歴をすべて削除します。</p>
        <button @click="clearRecentFiles" class="danger-button">履歴を削除</button>
      </div>
      <div class="action-group">
        <p>このアプリケーションのすべての設定を初期状態に戻します。（ファイルの履歴も削除されます）</p>
        <button @click="resetAllSettings" class="danger-button">すべての設定を初期化</button>
      </div>
    </div>
     <router-link :to="{ name: 'Home' }" class="back-link">ホームに戻る</router-link>
  </div>
</template>

<script>
import Database from '@/lib/database.js';
const db = new Database();

const defaultKeys = [
    'serial_number', 'service_name', 'user_id', 'website_url',
    'email_count', 'password_count', 'note', 'status', 'category', 
    'service_name_initial', 'service_description', 'created_at', 'updated_at'
];

export default {
  name: 'BrowserSettingView',
  data() {
    return {
      settings: {
        username: '',
        defaultColumnOrder: [...defaultKeys],
        columnAliases: {},
      },
    };
  },
  computed: {
    // textareaでの編集用に配列と文字列を変換
    defaultColumnOrderStr: {
      get() {
        return this.settings.defaultColumnOrder.join(', ');
      },
      set(value) {
        this.settings.defaultColumnOrder = value.split(',').map(s => s.trim());
      }
    }
  },
  methods: {
    async loadSettings() {
      const username = await db.getState('username');
      const defaultColumnOrder = await db.getState('default_column_order');
      const columnAliases = await db.getState('column_aliases');

      if (username) this.settings.username = username;
      if (defaultColumnOrder) this.settings.defaultColumnOrder = defaultColumnOrder;
      
      // エイリアス設定の初期化
      const aliases = columnAliases || {};
      const fullAliases = {};
      defaultKeys.forEach(key => {
          fullAliases[key] = aliases[key] || '';
      });
      this.settings.columnAliases = fullAliases;

    },
    async saveSettings() {
      try {
        await db.setState('username', JSON.parse(JSON.stringify(this.settings.username)));
        await db.setState('default_column_order', JSON.parse(JSON.stringify(this.settings.defaultColumnOrder)));
        await db.setState('column_aliases', JSON.parse(JSON.stringify(this.settings.columnAliases)));
        this.$dialog.alert('設定を保存しました。');
      } catch (error) {
        this.$dialog.alert('設定の保存に失敗しました。');
        console.error(error);
      }
    },
    async clearRecentFiles() {
      if (await this.$dialog.confirm('最近使用したファイルの履歴をすべて削除しますか？この操作は元に戻せません。')) {
        await db.clearFiles();
        this.$dialog.alert('履歴を削除しました。');
      }
    },
    async resetAllSettings() {
      if (await this.$dialog.confirm('本当にすべての設定を初期化しますか？ユーザー名や表示設定などがすべてリセットされます。')) {
        await db.clearFiles();
        await db.clearStates();
        // データリセット後にデフォルト値を再読み込み
        this.settings.username = '';
        this.loadSettings();
        this.$dialog.alert('すべての設定を初期化しました。');
      }
    }
  },
  async mounted() {
    await this.loadSettings();
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.settings-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;

  h1 {
    text-align: center;
    margin-bottom: 2.5rem;
  }
}

.setting-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  padding: 2rem;
  margin-bottom: 2rem;

  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.75rem;
  }
}

.form-group {
  margin-bottom: 1.5rem;
  label {
    display: block;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  input[type="text"], textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  .description {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0;
      margin-bottom: 0.5rem;
  }
}

.alias-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
    .original-key {
        font-family: var.$ff-code;
        flex-basis: 200px;
    }
}

.save-button {
  background-color: var.$button-color;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: var.$button-hovered-color;
  }
}

.danger-zone {
  border-left: 4px solid var.$danger-color;
  h2 {
    color: var.$danger-color;
  }
}
.action-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    &:not(:last-child) {
        border-bottom: 1px solid #eee;
    }
    p {
        margin: 0;
        color: #333;
    }
}
.danger-button {
    background-color: var.$danger-color;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
        opacity: 0.85;
    }
}
.back-link {
    display: block;
    text-align: center;
    margin-top: 2rem;
    color: var.$button-color;
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
}
</style>