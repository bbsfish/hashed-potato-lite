<template>
  <div class="file-data-editor-overlay" @click.self="close">
    <div class="editor-modal">
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <section class="form-section">
            <h3>基本情報</h3>
            <form @submit.prevent="save" class="editor-form">
            <div v-for="(value, key) in localAccountData" :key="key" class="form-group">
                <label :for="`account-${key}`">{{ getColumnAlias(key) }}</label>
                 <div class="input-wrapper">
                    <input
                    :id="`account-${key}`"
                    v-model="localAccountData[key]"
                    :disabled="isFieldDisabled(key)"
                    type="text"
                    />
                    <IconClipboard
                        v-if="isFieldDisabled(key) && !readonly"
                        @click="copyToClipboard(localAccountData[key])"
                        class="copy-icon"
                    />
                 </div>
            </div>
            </form>
        </section>

        <section class="form-section">
            <div class="sub-header">
                <h3>メールアドレス</h3>
                <button v-if="!readonly" @click="addEmail" class="btn-add">+</button>
            </div>
            <div v-for="(email, index) in localEmailData" :key="index" class="sub-form-group">
                <div class="form-group">
                    <label>メールアドレス</label>
                    <input type="email" v-model="email.mail_address" :disabled="readonly">
                </div>
                <div class="form-group">
                    <label>概要</label>
                    <input type="text" v-model="email.summary" :disabled="readonly">
                </div>
                <div class="form-group">
                    <label>ノート</label>
                    <textarea v-model="email.note" :disabled="readonly"></textarea>
                </div>
                <button v-if="!readonly" @click="removeEmail(index)" class="btn-remove">削除</button>
            </div>
        </section>

        <section class="form-section">
            <div class="sub-header">
                <h3>パスワード</h3>
                <button v-if="!readonly" @click="addPassword" class="btn-add">+</button>
            </div>
            <div v-for="(password, index) in localPasswordData" :key="index" class="sub-form-group">
                 <div class="form-group">
                    <label>パスワード</label>
                    <input type="text" v-model="password.password" :disabled="readonly">
                </div>
                <div class="form-group">
                    <label>概要</label>
                    <input type="text" v-model="password.summary" :disabled="readonly">
                </div>
                <div class="form-group">
                    <label>ノート</label>
                    <textarea v-model="password.note" :disabled="readonly"></textarea>
                </div>
                <button v-if="!readonly" @click="removePassword(index)" class="btn-remove">削除</button>
            </div>
        </section>
      </div>
      <div class="modal-footer">
        <button @click="close" class="btn-cancel">閉じる</button>
        <button v-if="!readonly" @click="save" class="btn-save">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import IconClipboard from './icons/IconClipboard.vue';

export default {
  name: 'FileDataEditor',
  components: {
    IconClipboard,
  },
  props: {
    title: {
      type: String,
      default: 'アカウント情報の編集'
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    accountData: {
      type: Object,
      required: true,
    },
    emailData: {
        type: Array,
        default: () => [],
    },
    passwordData: {
        type: Array,
        default: () => [],
    },
    columnAliases: {
      type: Object,
      default: () => ({}),
    }
  },
  emits: ['close', 'save'],
  data() {
    return {
      localAccountData: JSON.parse(JSON.stringify(this.accountData)),
      localEmailData: JSON.parse(JSON.stringify(this.emailData)),
      localPasswordData: JSON.parse(JSON.stringify(this.passwordData)),
    };
  },
  methods: {
    getColumnAlias(key) {
        return this.columnAliases[key] || key;
    },
    isFieldDisabled(key) {
        return this.readonly || key === 'serial_number' || key === 'created_at' || key === 'updated_at';
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.$dialog.alert('クリップボードにコピーしました。');
      } catch (err) {
        this.$dialog.alert('コピーに失敗しました。');
        console.error('Failed to copy: ', err);
      }
    },
    close() {
      this.$emit('close');
    },
    save() {
      this.$emit('save', {
          account: this.localAccountData,
          emails: this.localEmailData,
          passwords: this.localPasswordData,
      });
    },
    addEmail() {
        this.localEmailData.push({
            mail_address: '',
            summary: '',
            note: '',
        });
    },
    removeEmail(index) {
        this.localEmailData.splice(index, 1);
    },
    addPassword() {
        this.localPasswordData.push({
            password: '',
            summary: '',
            note: '',
        });
    },
    removePassword(index) {
        this.localPasswordData.splice(index, 1);
    }
  },
  watch: {
    accountData(newData) {
      this.localAccountData = JSON.parse(JSON.stringify(newData));
    },
    emailData(newData) {
      this.localEmailData = JSON.parse(JSON.stringify(newData));
    },
    passwordData(newData) {
      this.localPasswordData = JSON.parse(JSON.stringify(newData));
    }
  }
};
</script>

<style lang="scss" scoped>
.file-data-editor-overlay {
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

.editor-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 90%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #888;
  }
}

.modal-body {
  padding: 0 1.5rem;
  overflow-y: auto;
  max-height: 75vh;
}

.form-section {
    margin: 1.5rem 0;
    h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.5rem;
    }
}

.editor-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;

  label {
    margin-bottom: 0.5rem;
    font-weight: bold;
    font-size: 0.9rem;
    color: #555;
  }

  .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      .copy-icon {
          position: absolute;
          right: 10px;
          cursor: pointer;
          color: #888;
      }
  }

  input, textarea {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;

    &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
    }
  }
  textarea {
      min-height: 80px;
      resize: vertical;
  }
}

.sub-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .btn-add {
        border-radius: 50%;
        width: 28px;
        height: 28px;
        border: 1px solid #28a745;
        background-color: #28a745;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
    }
}
.sub-form-group {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
    position: relative;
    .btn-remove {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: #d9534f;
        color: white;
        border: none;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;
    }
}


.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  .btn-cancel, .btn-save {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
  }
  .btn-cancel {
      background-color: #f0f0f0;
  }
  .btn-save {
      background-color: #007bff;
      color: white;
  }
}
</style>