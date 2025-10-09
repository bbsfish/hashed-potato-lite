<template>
	<div class="loading-spinner">
    <div class="spinner"></div>
    <p v-if="m">{{ m }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    m: {
      type: String,
      default: null,
    },
  },
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as var;

.loading-spinner {
  .spinner {
    margin: 2rem auto;
    border: 4px solid #f3f3f3;
    border-top: 4px solid var.$green;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>