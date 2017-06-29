import Vue from 'vue';
import Router from 'vue-router';
import Login from '@/views/auth/Login';

Vue.use(Router);

const routes = [
  {
    path: '/login',
    component: Login,
  },
];
export default new Router({
  routes,
  mode: 'history',
});
