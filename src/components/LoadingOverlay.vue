<template>
  <div class="loading-overlay">
    <LoadingSpinner />
    <p>{{ m }}</p>
  </div>
</template>

<script>
import LoadingSpinner from '@/components/LoadingSpinner.vue';

export default {
  name: 'LoadingOverlay',
  components: {
    LoadingSpinner,
  },
  props: {
    m: {
      type: String,
      default: '読み込み中...',
    },
  },
}
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  p {
    text-align: center;
  }
}
</style>