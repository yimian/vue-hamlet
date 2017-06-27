import _Object$defineProperties from 'babel-runtime/core-js/object/define-properties';
/**
 * Created by zhangjinjie on 2017/5/17.
 */

import Auth from './auth';

export default {
  install: function install(Vue, options) {
    Vue.auth = new Auth(Vue, options);

    _Object$defineProperties(Vue.prototype, {
      $auth: {
        get: function get() {
          return Vue.auth;
        }
      }
    });
  }
};