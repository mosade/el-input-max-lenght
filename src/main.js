const Vue = require("vue");
const App = require("./App.vue");
const maxlen = require("./directives/maxlen");

Vue.directive("maxlen", maxlen);

new Vue({ render: h => h(App) }).$mount("#app");
