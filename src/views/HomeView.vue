<template>
  <div class="home">
    <CreateFileButton />
    <SelectFileButton />
  </div>
</template>

<script>
import CreateFileButton from '@/components/CreateFileButton.vue';
import SelectFileButton from '@/components/SelectFileButton.vue';

export default {
  name: 'Home',
  components: {
    CreateFileButton,
    SelectFileButton,
  },
};
</script>
