<template>
  <header class="app-header" :class="{ 'is-hidden': isHidden }">
    <div class="header-content">
      <div class="logo"><router-link :to="{ name: 'Home' }">Hashed Potato Lite</router-link></div>
      <nav>
        <router-link :to="{ name: 'PasswordGenerator' }">パスワード生成</router-link>
        <router-link :to="{ name: 'Devices' }">デバイス登録</router-link>
        <router-link v-if="dataHandle" :to="{ name: 'FileConfig' }">ファイル設定</router-link>
        <router-link v-if="dataHandle" :to="{ name: 'FileEditor' }">ファイル編集</router-link>
      </nav>
    </div>
    <div class="toggle-button" @click="toggleHeader" title="ヘッダーの表示切り替え">
      <IconChevronUp class="chevron" size="1rem" />
    </div>
  </header>
</template>

<script>
import { mapGetters } from 'vuex';
import IconChevronUp from '@/components/icons/IconChevronUp.vue';
import IconGear from '@/components/icons/IconGear.vue';

export default {
  name: 'AppHeader',
  components: {
    IconChevronUp,
    IconGear,
  },
  emits: ['hidden', 'open'],
  data() {
    return {
      isHidden: false,
    };
  },
  computed: {
    ...mapGetters(['dataHandle']),
  },
  methods: {
    toggleHeader() {
      this.isHidden = !this.isHidden;
      if (this.isHidden) this.$emits('hidden');
      else this.$emits('open');
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as var;

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: var.$header-bg;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 100;
  transition: top 0.4s ease-in-out;
  border-bottom: 1px solid var.$border-color;

  &.is-hidden {
    top: -60px;
  }
}

.header-content {
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-family: "IBM Plex Mono", monospace;
  font-weight: 700;
  font-style: normal;
  font-size: 1.5rem;
  color: var.$text-color;
  a {
    text-decoration: none;
  }
}

nav {
  display: flex;
  gap: 1.5rem;
  a {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: var.$text-muted-color;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: var.$text-color;
    }

    &.router-link-exact-active {
      color: var.$button-color;
      font-weight: bold;
    }
  }
}

.icon-gear {
  &:hover {
    transform: rotate(45deg);
  }
}

.toggle-button {
  position: absolute;
  top: 60px;
  right: 30px;
  bottom: -15px;
  width: 50px;
  height: 30px;
  background-color: var.$header-bg;
  border: 1px solid var.$border-color;
  border-top: none;
  border-radius: 0 0 25px 25px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform-origin: top center;
  transition: transform 0.4s ease-in-out, background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  .app-header.is-hidden & {
    .chevron {
      transform: rotate(180deg);
    }
  }
}
</style>