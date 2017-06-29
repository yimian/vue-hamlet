// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueResource from 'vue-resource';
import { sync } from 'vuex-router-sync';
import App from './App';
import router from './router';
import store from './store';
import auth from '../../src';

Vue.use(VueResource);
Vue.config.productionTip = false;
Vue.store = store;
Vue.router = router;


Vue.use(auth, {
  fetchUser: '/api/auth/me',
  appKey: process.env.APP_KEY,
});


sync(store, router);
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App },
});
