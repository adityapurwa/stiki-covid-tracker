import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import VueBlinkID from "@/plugins/VueBlinkID";

Vue.config.productionTip = false;

Vue.use(VueBlinkID)

new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
