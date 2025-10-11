import { createApp, h, ref, onMounted } from 'vue';

// --- メッセージコンポーネントの定義 ---
const FloatingMessageComponent = {
  name: 'FloatingMessageComponent',
  props: {
    message: {
      type: String,
      required: true,
    },
    onClose: {
      type: Function,
      required: true,
    },
    duration: {
      type: Number,
      default: 3000, // 3秒で自動的に閉じる
    }
  },
  setup(props) {
    const isVisible = ref(false);

    onMounted(() => {
      // 表示アニメーションのため、少し遅れてフラグを立てる
      requestAnimationFrame(() => {
        isVisible.value = true;
      });

      // 指定時間後に閉じる
      setTimeout(() => {
        isVisible.value = false;
        // トランジションが終わるのを待ってからコンポーネントを削除
        setTimeout(props.onClose, 300);
      }, props.duration);
    });

    return () =>
      h(
        'div',
        {
          class: ['floating-message-box', { 'visible': isVisible.value }],
        },
        props.message
      );
  },
};

// --- プラグイン本体 ---
let messageQueue = []; // メッセージのキュー
let isProcessing = false; // 処理中フラグ

const FloatingMessagePlugin = {
  install(app) {
    // スタイルを注入
    const style = document.createElement('style');
    style.textContent = `
      .floating-message-container {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .floating-message-box {
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .floating-message-box.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    // メッセージ表示用のコンテナをbodyに追加
    const container = document.createElement('div');
    container.className = 'floating-message-container';
    document.body.appendChild(container);

    // --- メッセージ処理関数 ---
    const processQueue = () => {
      if (messageQueue.length === 0) {
        isProcessing = false;
        return;
      }
      isProcessing = true;
      const { message, options } = messageQueue.shift();
      showMessage(message, options);
    };

    // --- メッセージ表示関数 ---
    const showMessage = (message, options = {}) => {
      const messageDiv = document.createElement('div');
      container.appendChild(messageDiv);

      const cleanup = () => {
        appInstance.unmount();
        container.removeChild(messageDiv);
        // 次のメッセージ処理へ
        processQueue();
      };

      const appInstance = createApp({
        render: () =>
          h(FloatingMessageComponent, {
            message,
            onClose: cleanup,
            duration: options.duration || 3000,
          }),
      });

      appInstance.mount(messageDiv);
    };

    // グローバルプロパティに登録
    app.config.globalProperties.$floatingmessage = {
      message(message, options = {}) {
        messageQueue.push({ message, options });
        if (!isProcessing) {
          processQueue();
        }
      },
    };
  },
};

export default FloatingMessagePlugin;