import { createRouter, createWebHistory } from 'vue-router';
import PasswordGeneratorView from '@/views/PasswordGeneratorView.vue';
import FileEditorView from '@/views/FileEditorView.vue';
import FileViewerView from '@/views/FileViewerView.vue';
import BrowserSettingView from '@/views/BrowserSettingView.vue';
import HomeView from '@/views/HomeView.vue';

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
    path: '/settings',
    name: 'BrowserSetting',
    component: BrowserSettingView,
  },
  {
    path: '/file-editor',
    name: 'LocalFileEditor',
    component: FileEditorView,
  },
  {
    path: '/file-viewer',
    name: 'LocalFileViewer',
    component: FileViewerView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;