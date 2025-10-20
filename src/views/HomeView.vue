<template>
  <div class="home-view">
    <CreateFileButton />
    <SelectFileButton />
    <SelectRecentFileButton />
  </div>
</template>

<script>
import CreateFileButton from '@/components/CreateFileButton.vue';
import SelectFileButton from '@/components/SelectFileButton.vue';
import SelectRecentFileButton from '@/components/SelectRecentFileButton.vue';

export default {
  name: 'Home',
  components: {
    CreateFileButton,
    SelectFileButton,
    SelectRecentFileButton,
  },
};
</script>
