<template>
  <div class="file-data-editor-overlay" @click.self="close">
    <div class="editor-modal">
      <div class="modal-header">
        <h2>アカウント情報の編集</h2>
        <button @click="close" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="save" class="editor-form">
          <div v-for="(value, key) in localAccountData" :key="key" class="form-group">
            <label :for="key">{{ key }}</label>
            <input
              :id="key"
              v-model="localAccountData[key]"
              :disabled="key === 'serial_number' || key === 'created_at' || key === 'updated_at'"
              type="text"
            />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button @click="close" class="btn-cancel">閉じる</button>
        <button @click="save" class="btn-save">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileDataEditor',
  props: {
    accountData: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'save'],
  data() {
    return {
      // 編集用にデータをローカルにコピー
      localAccountData: JSON.parse(JSON.stringify(this.accountData)),
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
    save() {
      // 変更されたデータを親に渡す
      this.$emit('save', this.localAccountData);
    },
  },
  watch: {
    // 親コンポーネントから渡されるデータが変更されたら、ローカルデータも更新
    accountData(newData) {
      this.localAccountData = JSON.parse(JSON.stringify(newData));
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
  max-width: 600px;
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
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 70vh;
}

.editor-form {
  display: flex;
  flex-direction: column;
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

  input {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;

    &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
    }
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