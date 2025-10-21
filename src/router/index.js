import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import PasswordGeneratorView from '@/views/PasswordGeneratorView.vue';
import DevicesView from '@/views/DevicesView.vue';
import FileConfigView from '@/views/FileConfigView.vue';
import FileEncryptionView from '@/views/FileEncryptionView.vue';
import FileEditorView from '@/views/FileEditorView.vue';
import AccountDetailsView from '@/views/AccountDetailsView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/passgen',
    name: 'PasswordGenerator',
    component: PasswordGeneratorView,
  },
  {
    path: '/devices',
    name: 'Devices',
    component: DevicesView,
  },
  {
    path: '/file-config',
    name: 'FileConfig',
    component: FileConfigView,
  },
  {
    path: '/file-encryption',
    name: 'FileEncryption',
    component: FileEncryptionView,
  },
  {
    path: '/file-editor',
    name: 'FileEditor',
    component: FileEditorView,
  },
  {
    path: '/account-details',
    name: 'AccountDetails',
    component: AccountDetailsView,
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;