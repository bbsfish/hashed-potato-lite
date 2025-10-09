import { createApp, h, ref } from 'vue';

// --- ダイアログコンポーネントの定義 ---
const DialogComponent = {
  name: 'DialogComponent',
  props: {
    // 表示モード ('alert', 'confirm', 'prompt')
    mode: {
      type: String,
      default: 'confirm',
    },
    // 表示メッセージ
    message: {
      type: String,
      required: true,
    },
    // 戻り値のnull強制
    forceNull: {
      type: Boolean,
      default: false,
    },
    // ダイアログを閉じる際のコールバック
    onClose: {
      type: Function,
      required: true,
    },
  },
  emits: ['close'],
  
  // promptモードでの入力値を保持
  setup() {
    const inputValue = ref('');
    return { inputValue };
  },

  render() {
    // --- 子要素の動的な構築 ---
    const children = [
      // メッセージ
      h('p', { class: 'dialog-message' }, this.message),
    ];

    // promptモードの場合、input要素を追加
    if (this.mode === 'prompt') {
      children.push(
        h('input', {
          class: 'dialog-input',
          type: 'text',
          value: this.inputValue,
          onInput: (event) => (this.inputValue = event.target.value),
          // ref属性はrender関数内ではこのように扱う
          ref: 'promptInput' 
        })
      );
    }
    
    // --- ボタンの動的な構築 ---
    const buttons = [];
    // confirmまたはpromptモードの場合、キャンセルボタンを追加
    if (this.mode === 'confirm' || this.mode === 'prompt') {
      buttons.push(
        h('button', { class: 'dialog-button cancel', onClick: this.handleCancel }, 'キャンセル')
      );
    }
    // OKボタンは常に追加
    buttons.push(
        h('button', { class: 'dialog-button confirm', onClick: this.handleConfirm }, 'OK')
    );

    children.push(h('form', { method: 'dialog', class: 'dialog-buttons' }, buttons));
    
    // --- コンポーネント全体の構築 ---
    return h('dialog', { class: 'dialog-overlay', onClick: this.handleOverlayClick }, [
      h('div', { class: 'dialog-box' }, children),
    ]);
  },
  
  methods: {
    // OKボタンの処理
    handleConfirm() {
      const result = (() => {
        let r = true;
        if (this.mode === 'prompt' && this.forceNull && this.inputValue === '') return null;
        else if (this.mode === 'prompt') return this.inputValue;
        return true;
      })();
      this.onClose(result);
    },
    // キャンセルボタンの処理
    handleCancel() {
      // promptではnull、confirmではfalseを返す
      const result = (this.mode === 'prompt') ? null : false;
      this.onClose(result);
    },
    // オーバーレイのクリック処理
    handleOverlayClick(event) {
      if (event.target === event.currentTarget) {
        this.handleCancel();
      }
    },
    // キーボードイベントの処理
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.handleCancel();
      }
      if (e.key === 'Enter' && this.mode === 'prompt') {
        this.handleConfirm();
      }
    },
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
    // promptモードの場合、inputに自動でフォーカスを当てる
    if (this.mode === 'prompt') {
        this.$refs.promptInput.focus();
    }
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
};

// --- ダイアログを生成するヘルパー関数 ---
function createDialog(mode, { message, forceNull }) {
  return new Promise(resolve => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const cleanup = (result) => {
      dialogApp.unmount();
      document.body.removeChild(container);
      resolve(result);
    };

    const dialogApp = createApp({
      render() {
        return h(DialogComponent, {
          mode,
          message,
          forceNull,
          onClose: cleanup,
        });
      },
    });

    dialogApp.mount(container);
  });
}

// --- プラグイン本体 ---
const DialogPlugin = {
  install(app) {
    app.config.globalProperties.$dialog = {
      /**
       * アラートダイアログを表示します。
       * @param {string} message - 表示するメッセージ
       * @returns {Promise<boolean>} 常にtrueを返します
       */
      alert(message) {
        return createDialog('alert', { message });
      },

      /**
       * 確認ダイアログを表示します。
       * @param {string} message - 表示するメッセージ
       * @returns {Promise<boolean>} OKでtrue, キャンセルでfalseを返します
       */
      confirm(message) {
        return createDialog('confirm', { message });
      },

      /**
       * 入力ダイアログを表示します。
       * @param {string} message - 表示するメッセージ
       * @param {string} forceNull - 入力値が空の場合、OKを押してもnullを返します
       * @returns {Promise<string|null>} OKで入力文字列, キャンセルでnullを返します
       */
      prompt(message, forceNull = false) {
        return createDialog('prompt', { message, forceNull });
      },
    };

    // --- スタイルの注入 (prompt用のスタイルを追加) ---
    const style = document.createElement('style');
    style.textContent = `
      .dialog-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex; justify-content: center; align-items: center; z-index: 1000;
      }
      .dialog-box {
        background-color: white; padding: 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 320px; max-width: 90%; text-align: center;
      }
      .dialog-message {
        margin: 0 0 20px; font-size: 16px; color: #333;
      }
      .dialog-input { /* prompt用inputのスタイル */
        display: block; width: 100%; padding: 8px; margin-bottom: 20px;
        font-size: 16px; border: 1px solid #ccc; border-radius: 4px;
        box-sizing: border-box;
      }
      .dialog-buttons {
        display: flex; justify-content: flex-end; gap: 12px;
      }
      .dialog-button {
        border: none; border-radius: 4px; padding: 8px 16px;
        font-size: 14px; cursor: pointer; transition: background-color 0.2s;
      }
      .dialog-button.cancel {
        background-color: #f0f0f0; color: #333;
      }
      .dialog-button.cancel:hover { background-color: #e0e0e0; }
      .dialog-button.confirm {
        background-color: #007bff; color: white;
      }
      .dialog-button.confirm:hover { background-color: #0056b3; }
    `;
    document.head.appendChild(style);
  },
};

export default DialogPlugin;
