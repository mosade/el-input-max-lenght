import Vue from 'vue';
import App from './App.vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import maxlen from './directives/maxlen';
import autoMaxlen from './plugins/auto-maxlen';

Vue.use(ElementUI);
Vue.directive('maxlen', maxlen);
Vue.use(autoMaxlen);

new Vue({
  render: h => h(App),
}).$mount('#app');