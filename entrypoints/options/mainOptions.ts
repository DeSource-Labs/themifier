import { createPinia } from 'pinia';

import './main.css';
import AppOptions from './AppOptions.vue';

const app = createApp(AppOptions).use(createPinia());
app.mount('#app');
