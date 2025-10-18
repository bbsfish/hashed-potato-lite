import { createApp, h, ref } from 'vue';
import IconEye from '@/components/icons/IconEye.vue';
import IconEyeSlash from '@/components/icons/IconEyeSlash.vue';

// --- ダイアログコンポーネントの定義 ---
const DialogComponent = {
  name: 'DialogComponent',
  props: {
    // 表示モード ('alert', 'confirm', 'prompt', 'password')
    mode: {
      type: String,
      default: 'confirm',
    },
    // 表示メッセージ
    message: {
      type: String,
      required: true,
    },
    // prompt モードでの戻り値の null 強制
    forceNull: {
      type: Boolean,
      default: false,
    },
    // prompt モードでの input タイプ
    inputType: {
      type: String,
      default: 'text',
    },
    // ダイアログを閉じる際のコールバック
    onClose: {
      type: Function,
      required: true,
    },
  },
  emits: ['close'],
  
  setup() {
    const inputValue = ref('');
    const isPasswordVisible = ref(false);
    return { inputValue, isPasswordVisible };
  },

  render() {
    // --- 子要素の動的な構築 ---
    // メッセージを \n で改行する
    const lines = this.message.split('\n');
    const separater = h('br');
    const messageNodes = lines.map((ln, i) => [i*2, ln])
      .concat(
        Array.from({length: lines.length - 1}).map((_, i) => [i*2+1, separater])
      )
      .sort().map((tuple=>tuple[1]));

    const children = [
      // メッセージ
      h('p', { class: 'dialog-message' }, messageNodes),
    ];

    // promptまたはpasswordモードの場合、input要素を追加
    if (this.mode === 'prompt' || this.mode === 'password') {
      const inputType = this.mode === 'password' && !this.isPasswordVisible
          ? 'password'
          : 'text';
          
      const inputNode = h('input', {
        class: 'dialog-input',
        type: inputType,
        value: this.inputValue,
        onInput: (event) => (this.inputValue = event.target.value),
        ref: 'promptInput' 
      });

      // passwordモードの場合、表示切替アイコンを追加
      if (this.mode === 'password') {
        const iconComponent = this.isPasswordVisible ? IconEyeSlash : IconEye;
        const toggleIcon = h(iconComponent, {
          class: 'password-toggle-icon',
          onClick: () => (this.isPasswordVisible = !this.isPasswordVisible),
        });
        children.push(h('div', { class: 'input-wrapper' }, [inputNode, toggleIcon]));
      } else {
        // promptモードの場合はinput要素を直接追加
        children.push(h('div', { class: 'input-wrapper' }, [inputNode]));
      }
    }
    
    // --- ボタンの動的な構築 ---
    const buttons = [];
    // confirm, prompt, passwordモードの場合、キャンセルボタンを追加
    if (['confirm', 'prompt', 'password'].includes(this.mode)) {
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
        if (this.mode === 'prompt' || this.mode === 'password') {
            if(this.forceNull && this.inputValue === '') return null;
            return this.inputValue;
        }
        return true;
      })();
      this.onClose(result);
    },
    // キャンセルボタンの処理
    handleCancel() {
      // promptまたはpasswordではnull、confirmではfalseを返す
      const result = (this.mode === 'prompt' || this.mode === 'password') ? null : false;
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
      if (e.key === 'Enter' && (this.mode === 'prompt' || this.mode === 'password')) {
        // Enterキーでのサブミットを止める
        e.preventDefault();
        this.handleConfirm();
      }
    },
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
    // promptまたはpasswordモードの場合、inputに自動でフォーカスを当てる
    if (this.mode === 'prompt' || this.mode === 'password') {
        this.$refs.promptInput.focus();
    }
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  },
};

// --- ダイアログを生成するヘルパー関数 ---
function createDialog(mode, { message, forceNull, inputType }) {
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
          inputType,
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
       * @param {object} [options] - オプション
       * @param {boolean} [options.forceNull=false] - 入力値が空の場合、OKを押してもnullを返します
       * @param {string} [options.inputType='text'] - input要素のtype属性
       * @returns {Promise<string|null>} OKで入力文字列, キャンセルでnullを返します
       */
      prompt(message, { forceNull = false, inputType = 'text' } = {}) {
        return createDialog('prompt', { message, forceNull, inputType });
      },

      /**
       * パスワード入力ダイアログを表示します。
       * @param {string} message - 表示するメッセージ
       * @param {object} [options] - オプション
       * @param {boolean} [options.forceNull=false] - 入力値が空の場合、OKを押してもnullを返します
       * @returns {Promise<string|null>} OKで入力文字列, キャンセルでnullを返します
       */
      password(message, { forceNull = false } = {}) {
        return createDialog('password', { message, forceNull, inputType: 'password' });
      },
    };

    // --- スタイルの注入 (prompt用のスタイルとパスワード表示用のスタイルを追加) ---
    const style = document.createElement('style');
    style.textContent = `
      .dialog-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex; justify-content: center; align-items: center; z-index: 1000;
        border: none;
      }
      .dialog-box {
        background-color: white; padding: 24px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 320px; max-width: calc(90% - 48px);
      }
      .dialog-message {
        margin: 0 0 20px; font-size: 16px; color: #333;
      }
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        margin-bottom: 20px;
      }
      .dialog-input {
        width: 100%; padding: 8px;
        font-size: 16px; border: 1px solid #ccc; border-radius: 4px;
        box-sizing: border-box;
      }
      .input-wrapper .dialog-input {
        padding-right: 40px; /* アイコンのスペースを確保 */
      }
      .password-toggle-icon {
        position: absolute;
        right: 10px;
        cursor: pointer;
        color: #777;
        width: 1.2rem;
        height: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
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