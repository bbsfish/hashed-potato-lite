import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import dialog from './plugins/dialog';

createApp(App).use(dialog).use(store).use(router).mount('#app');
