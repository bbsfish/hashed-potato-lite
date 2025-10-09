import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import PasswordGeneratorView from '@/views/PasswordGeneratorView.vue';
import FileViewerView from '@/views/FileViewerView.vue';
import FileEditorView from '@/views/FileEditorView.vue';

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
    path: '/file-viewer',
    name: 'FileViewer',
    component: FileViewerView,
  },
  {
    path: '/file-editor',
    name: 'FileEditor',
    component: FileEditorView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
