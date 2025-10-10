import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import PasswordGeneratorView from '@/views/PasswordGeneratorView.vue';
import FileEditorView from '@/views/FileEditorView.vue';
import BrowserSettingView from '@/views/BrowserSettingView.vue';
import FileViewerView from '@/views/FileViewerView.vue'; 

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
    path: '/file-editor',
    name: 'FileEditor',
    component: FileEditorView,
  },
  {
    path: '/file-viewer',
    name: 'FileViewer',
    component: FileViewerView,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: BrowserSettingView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;