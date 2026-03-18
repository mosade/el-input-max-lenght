import Vue from 'vue';
import App from './App.vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import maxlen from './directives/maxlen';
import autoMaxlen from './plugins/auto-maxlen';
import overrideMaxlength from './plugins/override-maxlength';

Vue.use(ElementUI);
Vue.directive('maxlen', maxlen);
Vue.use(autoMaxlen);
Vue.use(overrideMaxlength);

new Vue({
  render: h => h(App),
}).$mount('#app');
