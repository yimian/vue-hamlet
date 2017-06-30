import Vue from 'vue';
import Router from 'vue-router';
import Index from '@/views/admin/Index';
import Login from '@/views/auth/Login';

Vue.use(Router);

const routes = [
  {
    path: '/',
    name: 'index',
    component: Index,
    meta: {
      auth: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
];
export default new Router({
  routes,
  mode: 'history',
});
