// /plugins/snackbar.js

import { h, createApp, Transition } from 'vue';

// プラグインが一度だけCSSを注入するようにするためのフラグ
let cssInjected = false;

// スナックバーのスタイルを定義
const style = `
  .snackbar-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column-reverse;
    gap: 10px;
  }
  .snackbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background-color: #333;
    color: white;
    border-radius: 4px;
    box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    min-width: 280px;
    max-width: 500px;
  }
  .snackbar-message {
    padding-right: 16px;
  }
  .snackbar-action {
    background: none;
    border: none;
    color: #bb86fc; /* Material Design風のアクセントカラー */
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    padding: 8px;
    margin: -8px 0;
  }
  /* トランジション用CSS */
  .snackbar-fade-enter-active,
  .snackbar-fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .snackbar-fade-enter-from,
  .snackbar-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }
`;

/**
 * スタイルシートを<head>に注入する関数
 */
function injectCss() {
  if (cssInjected) return;
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
  cssInjected = true;
}

/**
 * スナックバーの表示を管理する関数
 * @param {string} message - 表示するメッセージ
 * @param {string|null} actionMessage - アクションボタンのテキスト
 * @param {number} timeout - 自動で消えるまでの時間 (ミリ秒)
 * @returns {Promise<boolean>} アクションボタンが押されたらtrue, それ以外はfalse
 */
function showSnackbar(message, actionMessage = null, timeout = 4000) {
  return new Promise((resolve) => {
    // スナックバーをマウントするコンテナを取得または作成
    let container = document.getElementById('snackbar-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'snackbar-container';
      document.body.appendChild(container);
    }

    // スナックバーコンポーネントをマウントするためのDOM要素
    const mountEl = document.createElement('div');
    container.appendChild(mountEl);

    /**
     * クリーンアップ処理
     */
    const cleanup = () => {
      // Vueインスタンスをアンマウント
      if (snackbarApp) {
        snackbarApp.unmount();
      }
      // DOMから要素を削除
      if (mountEl.parentNode) {
        mountEl.parentNode.removeChild(mountEl);
      }
    };

    // スナックバーのVueコンポーネント定義
    const SnackbarComponent = {
      props: {
        message: { type: String, required: true },
        actionMessage: { type: String, default: null },
      },
      data() {
        return {
          isVisible: false,
          timeoutId: null,
        };
      },
      methods: {
        /**
         * スナックバーを閉じる
         * @param {boolean} result - Promiseが解決する値
         */
        close(result) {
          clearTimeout(this.timeoutId);
          this.isVisible = false;
          // トランジションが終わるのを待ってからクリーンアップ
          setTimeout(() => {
            cleanup();
            resolve(result);
          }, 300); // CSSのtransition時間と合わせる
        },
        /**
         * アクションボタンのクリックハンドラ
         */
        handleActionClick() {
          this.close(true);
        },
      },
      mounted() {
        // 表示アニメーションをトリガー
        this.$nextTick(() => {
          this.isVisible = true;
        });
        // タイムアウトを設定して自動で閉じる
        this.timeoutId = setTimeout(() => this.close(false), timeout);
      },
      render() {
        return h(
          Transition,
          { name: 'snackbar-fade' },
          {
            default: () => {
              if (!this.isVisible) return null;

              const children = [
                h('span', { class: 'snackbar-message' }, this.message)
              ];

              if (this.actionMessage) {
                children.push(
                  h(
                    'button',
                    {
                      class: 'snackbar-action',
                      onClick: this.handleActionClick,
                    },
                    this.actionMessage
                  )
                );
              }

              return h('div', { class: 'snackbar' }, children);
            },
          }
        );
      },
    };

    // スナックバーのVueインスタンスを作成してマウント
    const snackbarApp = createApp(SnackbarComponent, { message, actionMessage });
    snackbarApp.mount(mountEl);
  });
}


// Vueプラグインの定義
const SnackbarPlugin = {
  install: (app, options) => {
    // CSSを注入
    injectCss();
    // グローバルプロパティに$snackbarを登録
    app.config.globalProperties.$snackbar = showSnackbar;
  },
};

export default SnackbarPlugin;