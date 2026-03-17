const Vue = require("vue");
const App = require("./App.vue");
const maxlen = require("./directives/maxlen");
const autoMaxlen = require("./plugins/auto-maxlen");

Vue.directive("maxlen", maxlen);
Vue.use(autoMaxlen);

new Vue({ render: h => h(App) }).$mount("#app");
