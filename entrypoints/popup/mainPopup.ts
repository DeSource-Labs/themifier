import { createPinia } from 'pinia';

import './main.css';
import AppPopup from './AppPopup.vue';

const app = createApp(AppPopup).use(createPinia());

app.mount('#app');
