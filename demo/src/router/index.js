import Vue from 'vue';
import Router from 'vue-router';
import Index from '@/views/Index';
import Admin from '@/views/admin/Admin';
import Account from '@/views/admin/Account';
import Login from '@/views/auth/Login';

import Forbidden from '@/components/403';
import NotFound from '@/components/404';

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
  {
    path: '/403',
    name: 'forbidden',
    component: Forbidden,
  },
  {
    path: '/404',
    name: 'notFound',
    component: NotFound,
  },
];
export default new Router({
  routes,
  mode: 'history',
});
