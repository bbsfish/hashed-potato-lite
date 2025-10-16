import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import PasswordGeneratorView from '@/views/PasswordGeneratorView.vue';
import DevicesView from '@/views/DevicesView.vue';

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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;