<template>
  <div class="home">
    <h2 v-if="username">Hello, {{ username }}!</h2>
    <h2 v-else>Hello</h2>
  </div>
</template>

<script>
import Database from '@/lib/database.js';
const db = new Database();

export default {
  name: 'Home',
  data() {
    return {
      username: '',
    };
  },
  async mounted() {
    this.username = await db.getState('username');
  },
};
</script>

<style lang="scss" scoped>
h2 {
  text-align: center;
  margin: 10rem 0;
}
</style>