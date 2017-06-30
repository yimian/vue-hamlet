# Vue Hamlet
vue-hamlet is used as authentication for frontend.

## Index
* [Install](#install)
* [Demo](#demo)

## Install
Install repository into your project.
~~~
> npm install yimian/vue-hamlet --save-dev
~~~
Configure setting in your project main.js
~~~
import VueResource from 'vue-resource';
import { sync } from 'vuex-router-sync';
import auth from 'vue-hamlet';
import router from './router';
import store from './store';

Vue.use(VueResource);
Vue.store = store;
Vue.router = router;

Vue.use(auth, {
  fetchUser: '',
  appKey: '',
});

sync(store, router);
~~~

## Demo
Run demo project with following procedures:
~~~
cd demo/
~~~
~~~
npm install
~~~
~~~
npm run dev
~~~
