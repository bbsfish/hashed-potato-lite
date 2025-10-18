<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <h2>アカウント詳細</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </header>

      <div class="tabs">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="{ active: activeTab === tab.id }">
          {{ tab.name }}
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'basic'">
          <div class="form-grid">
            <div class="form-group">
              <label>シリアル番号 (sn)</label>
              <input type="text" :value="editableAccount.sn" disabled />
            </div>
            <div class="form-group">
              <label for="serviceName">サービス名 (nm)</label>
              <input id="serviceName" type="text" v-model="editableAccount.nm" />
            </div>
            <div class="form-group">
              <label for="initial">イニシャル (it)</label>
              <input id="initial" type="text" v-model="editableAccount.it" />
            </div>
            <div class="form-group">
              <label for="category">カテゴリ (ct)</label>
              <input id="category" type="text" v-model="editableAccount.ct" />
            </div>
            <div class="form-group full-width">
              <label for="summary">概要 (sm)</label>
              <textarea id="summary" v-model="editableAccount.sm"></textarea>
            </div>
            <div class="form-group">
              <label for="status">ステータス (st)</label>
              <select id="status" v-model="editableAccount.st">
                <option value="有効">有効</option>
                <option value="無効">無効</option>
                <option value="削除済み">削除済み</option>
              </select>
            </div>
             <div class="form-group">
                <label>作成日時 (ca)</label>
                <p class="value">{{ new Date(editableAccount.ca).toLocaleString() }}</p>
            </div>
            <div class="form-group">
                <label>更新日時 (ua)</label>
                <p class="value">{{ new Date(editableAccount.ua).toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'credentials'">
           <div class="form-group">
              <label for="userId">ユーザーID (ui)</label>
              <input id="userId" type="text" v-model="editableAccount.ui" />
            </div>
            <hr>
            <div class="list-section" v-for="(pw, index) in editableAccount.pw" :key="index">
                <h4>パスワード {{ index + 1 }}</h4>
                <div class="form-group">
                    <label>パスワード (pw)</label>
                    <div class="password-input-wrapper">
                      <input :type="pw.show ? 'text' : 'password'" v-model="pw.pw" />
                      <label class="show-password-label">
                          <input type="checkbox" v-model="pw.show" />
                          表示
                      </label>
                    </div>
                    </div>
                <div class="form-group">
                    <label>概要 (sm)</label>
                    <input type="text" v-model="pw.sm" />
                </div>
                <button class="delete-item-button" @click="removeItem('pw', index)">削除</button>
            </div>
            <button class="add-item-button" @click="addItem('pw')">パスワードを追加</button>
        </div>

        <div v-if="activeTab === 'contact'">
          <div class="list-section" v-for="(email, index) in editableAccount.em" :key="index">
            <h4>メールアドレス {{ index + 1 }}</h4>
            <div class="form-group">
              <label>ラベル (nm)</label>
              <input type="text" v-model="email.nm" />
            </div>
            <div class="form-group">
              <label>メールアドレス (em)</label>
              <input type="email" v-model="email.em" />
            </div>
            <div class="form-group">
              <label>概要 (sm)</label>
              <input type="text" v-model="email.sm" />
            </div>
            <button class="delete-item-button" @click="removeItem('em', index)">削除</button>
          </div>
          <button class="add-item-button" @click="addItem('em')">メールアドレスを追加</button>
          <hr>
          <div class="form-group">
            <label for="phonenumber">電話番号 (phonenumber)</label>
            <input id="phonenumber" type="tel" v-model="editableAccount.phonenumber" />
          </div>
          <hr>
           <div class="list-section" v-for="(addr, index) in editableAccount.address" :key="index">
                <h4>住所 {{ index + 1 }}</h4>
                 <div class="form-group">
                    <label>郵便番号 (postcode)</label>
                    <input type="text" v-model="addr.postcode" />
                </div>
                <div class="form-group">
                    <label>住所 (address)</label>
                    <input type="text" v-model="addr.address" />
                </div>
                <button class="delete-item-button" @click="removeItem('address', index)">削除</button>
            </div>
            <button class="add-item-button" @click="addItem('address')">住所を追加</button>
        </div>
        
        <div v-if="activeTab === 'misc'">
          <div class="form-group">
            <label for="nickname">ニックネーム (nickname)</label>
            <input id="nickname" type="text" v-model="editableAccount.nickname" />
          </div>
           <div class="form-group">
            <label for="legal_name">本名 (legal_name)</label>
            <input id="legal_name" type="text" v-model="editableAccount.legal_name" />
          </div>
           <div class="form-group">
            <label for="birthday">誕生日 (birthday)</label>
            <input id="birthday" type="text" v-model="editableAccount.birthday" placeholder="yyyy.mm.dd" />
          </div>
          <hr>
          <div class="list-section" v-for="(site, index) in editableAccount.website" :key="index">
            <h4>ウェブサイト {{ index + 1 }}</h4>
            <div class="form-group">
              <label>ラベル (nm)</label>
              <input type="text" v-model="site.nm" />
            </div>
            <div class="form-group">
              <label>URL (url)</label>
              <input type="url" v-model="site.url" />
            </div>
            <button class="delete-item-button" @click="removeItem('website', index)">削除</button>
          </div>
          <button class="add-item-button" @click="addItem('website')">ウェブサイトを追加</button>
        </div>

      </div>

      <footer class="modal-footer">
        <button class="save-button" @click="save">保存</button>
        <button class="cancel-button" @click="$emit('close')">キャンセル</button>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccountDetailModal',
  props: {
    account: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      activeTab: 'basic',
      tabs: [
        { id: 'basic', name: '基本情報' },
        { id: 'credentials', name: '認証情報' },
        { id: 'contact', name: '連絡先' },
        { id: 'misc', name: 'その他' },
      ],
      editableAccount: {},
    };
  },
  methods: {
    save() {
      // accountオブジェクトのupdateメソッドを呼び出す
      this.account.update(this.editableAccount);
      this.$emit('update');
      this.$emit('close');
    },
    addItem(type) {
        const itemTemplates = {
            'em': { nm: '', em: '', sm: '' },
            // ▼▼▼ 修正部分 ▼▼▼
            'pw': { pw: '', sm: '', ua: new Date().toISOString(), show: false },
            // ▲▲▲ 修正部分 ▲▲▲
            'website': { nm: '', url: '' },
            'address': { postcode: '', address: '' },
        };
        if (!Array.isArray(this.editableAccount[type])) {
            this.editableAccount[type] = [];
        }
        this.editableAccount[type].push(itemTemplates[type]);
    },
    removeItem(type, index) {
        this.editableAccount[type].splice(index, 1);
    }
  },
  watch: {
    account: {
      immediate: true,
      handler(newVal) {
        const accountData = JSON.parse(JSON.stringify(newVal.getData()));
        
        const arrayKeys = ['ui', 'em', 'pw', 'nickname', 'website', 'phonenumber', 'birthday', 'address', 'legal_name', 'bank', 'credit', 'memo', 'code', 'number', 'text', 'link', 'group'];
        arrayKeys.forEach(key => {
            if (!Array.isArray(accountData[key])) {
                accountData[key] = accountData[key] ? [accountData[key]] : [];
            }
            if (typeof accountData[key] === 'undefined') {
                const simpleKeys = ['ui', 'nickname', 'phonenumber', 'birthday', 'legal_name', 'number', 'text'];
                if (simpleKeys.includes(key)) {
                    accountData[key] = '';
                }
            }
        });

        // ▼▼▼ 修正部分 ▼▼▼
        // パスワード表示切替用のプロパティを追加
        if (accountData.pw && Array.isArray(accountData.pw)) {
            accountData.pw = accountData.pw.map(p => ({ ...p, show: false }));
        }
        // ▲▲▲ 修正部分 ▲▲▲

        this.editableAccount = accountData;
      },
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var.$border-color;

  h2 {
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
}

.tabs {
  display: flex;
  border-bottom: 1px solid var.$border-color;
  padding: 0 1.5rem;
  
  button {
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    border-bottom: 2px solid transparent;

    &.active {
      font-weight: bold;
      color: var.$button-color;
      border-bottom-color: var.$button-color;
    }
  }
}

.tab-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;

  &.full-width {
    grid-column: 1 / -1;
  }

  label {
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
    font-size: 0.875rem;
  }

  input,
  textarea,
  select {
    padding: 0.6rem;
    border: 1px solid var.$border-color;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  textarea {
      min-height: 80px;
      resize: vertical;
  }

  input:disabled {
      background-color: #f5f5ff;
      color: #777;
  }

  .value {
      padding: 0.6rem;
      background-color: #f5f5f5;
      border-radius: 4px;
      min-height: 2.25rem;
  }
}

hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 1.5rem 0;
}

.list-section {
    background-color: #f9f9f9;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
    position: relative;

    h4 {
        margin-top: 0;
    }
}

.add-item-button, .delete-item-button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid var.$border-color;
    background-color: #fff;
    cursor: pointer;
    font-weight: bold;

    &:hover {
        background-color: #f5f5f5;
    }
}

.delete-item-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    border-color: var.$danger-color;
    color: var.$danger-color;
}

/* ▼▼▼ 追加したスタイル ▼▼▼ */
.password-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  input[type="password"], input[type="text"] {
    flex-grow: 1;
  }
}

.show-password-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  white-space: nowrap;
  margin-bottom: 0; 
  font-weight: normal; 
  cursor: pointer;
}
/* ▲▲▲ 追加したスタイル ▲▲▲ */


.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var.$border-color;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;

  &.save-button {
    background-color: var.$button-color;
    color: white;
    &:hover {
      background-color: var.$button-hovered-color;
    }
  }
  &.cancel-button {
    background-color: #ccc;
    &:hover {
      background-color: #bbb;
    }
  }
}
</style>