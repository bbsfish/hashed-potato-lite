import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import dialog from './plugins/dialog';
import floatingMessage from './plugins/floating-message';

createApp(App).use(dialog).use(floatingMessage).use(store).use(router).mount('#app');
