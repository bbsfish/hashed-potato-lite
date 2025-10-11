<template>
  <div class="action-box">
    <span class="text-display" v-if="text">{{ text }}</span>
    <span class="icons-display">
      <IconClipboard @click="copyToClipboard" />
      <slot></slot>
    </span>
  </div>
</template>

<script>
import IconClipboard from '@/components/icons/IconClipboard.vue';

export default {
  name: 'ActionBox',
  components: {
    IconClipboard,
  },
  props: {
    // 表示文字列およびコピー対象の文字列
    text: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      isCopied: false,
    };
  },
  methods: {
    async copyToClipboard() {
      if (this.isCopied) return;

      try {
        await navigator.clipboard.writeText(this.text);
        this.isCopied = true;
        
        // 1.5 秒後にボタンを元に戻す
        setTimeout(() => {
          this.isCopied = false;
        }, 1500);
      } catch (err) {
        console.error('クリップボードへのコピーに失敗しました:', err);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.action-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f0f4f8;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
}

.text-display {
  font-family: var.$ff-code;
  font-size: 1.1rem;
  color: #333;
  word-break: break-all;
  margin-right: 1rem;
}

.icons-display {
  display: flex;
  gap: 1rem;
}
</style>
