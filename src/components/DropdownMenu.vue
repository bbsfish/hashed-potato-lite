<template>
  <OnClickOutside class="dropdown-menu" @click="isMenuOpen = !isMenuOpen" @trigger="isMenuOpen = false">
    <button @click.stop="isMenuOpen = !isMenuOpen" :title="title">
      <slot name="button"></slot>
    </button>
    <ul :style="`width: ${width};`" v-if="isMenuOpen">
      <slot name="list"></slot>
    </ul>
  </OnClickOutside>
</template>

<script>
import { OnClickOutside } from '@vueuse/components';

export default {
  name: 'DropdownMenu',
  components: {
    OnClickOutside,
  },
  props: {
    title: {
      type: String,
      default: 'アクション',
    },
    width: {
      type: String,
      default: '250px',
    },
  },
  data() {
    return {
      isMenuOpen: false,
    }
  },
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as var;

.dropdown-menu {
  position: relative;
  display: inline-block;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid var.$border-color;
  background-color: var.$white;
  color: var.$text-color;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  svg {
    fill: var.$text-color;
  }
}

ul {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  list-style: none;
  padding: 0.5rem 0;
  margin: 0.25rem 0 0;
  background-color: var.$white;
  border: 1px solid var.$border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}
</style>
