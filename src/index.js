/**
 * Created by zhangjinjie on 2017/5/17.
 */

import Auth from './auth';

export default {
  install(Vue, options) {
    Vue.auth = new Auth(Vue, options);

    Object.defineProperties(
      Vue.prototype,
      {
        $auth: {
          get() {
            return Vue.auth;
          },
        },
      },
    );
  },
};
