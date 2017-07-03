import Vue from 'vue';
import Router from 'vue-router';
import Index from '@/views/Index';
import Admin from '@/views/admin/Admin';
import Account from '@/views/admin/Account';
import Login from '@/views/auth/Login';

Vue.use(Router);

const routes = [
  {
    path: '/',
    name: 'index',
    component: Index,
  },
  {
    path: '/admin',
    name: 'admin',
    component: Admin,
    meta: {
      auth: ['admin'],
    },
  },
  {
    path: '/account',
    name: 'account',
    component: Account,
    meta: {
      auth: ['admin', 'test'],
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
