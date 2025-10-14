<template>
  <div class="home">
    <CreateFileButton />
  </div>
</template>

<script>
import CreateFileButton from '@/components/CreateFileButton.vue';

export default {
  name: 'Home',
  components: {
    CreateFileButton,
  },
};
</script>
