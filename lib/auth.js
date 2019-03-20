import _Promise from 'babel-runtime/core-js/promise';
import _typeof from 'babel-runtime/helpers/typeof';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
/**
 * Created by zhangjinjie on 2017/5/17.
 */
import store from './store';
import * as types from './store/types';

var Auth = function () {
  function Auth(Vue) {
    var _this2 = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Auth);

    // check Vue-resource, Vue-router, Vuex used
    if (!Vue.http) {
      console.error('Vue resource must be set first');
      return;
    }

    if (!Vue.router) {
      console.error('Vue router 2.x must be set first');
      return;
    }

    if (!Vue.store) {
      console.error('Vuex must be used first');
      return;
    }

    // set variables;
    this._Vue = Vue;
    this._http = Vue.http;
    this._store = Vue.store;
    this._router = Vue.router;
    // fetch用户信息后，变为true，开始刷新；退出时，置为false；
    this._loaded = false;

    // options
    var defaultOptions = {
      appKey: '',
      authType: 'Bearer',
      hamletPrefix: '/api/auth',
      authRedirect: '/login',
      refreshInterval: 10, // mins
      forbiddenRedirect: '/403',
      notFoundRedirect: '/404',
      allowThirdpartyLogin: false
    };
    this.options = _Object$assign({}, defaultOptions, options);
    this.options.fetchUser = this.options.fetchUser || this.url('me');

    // register store
    Vue.store.registerModule('auth', store);

    // app key
    if (!this.options.appKey) {
      console.error('must set app key first');
      return;
    }
    this._store.commit(types.SET_APPKEY, options.appKey); // 必须在register store后面执行

    // register http interceptors
    Vue.http.interceptors.push(function (request, next) {
      // 判断是否是hamlet请求，如果是添加app_key
      if (request.url.indexOf(_this2.options.hamletPrefix) !== -1) {
        var appKey = _this2._store.state.auth.appKey;
        if (['POST', 'PUT'].indexOf(request.method) !== -1) {
          request.body = _Object$assign(request.body || {}, { app_key: appKey });
        } else if (['GET'].indexOf(request.method) !== -1) {
          request.params = _Object$assign(request.params || {}, { app_key: appKey });
        }
      }

      // 判断是否包含token，如果有，则加到header里面
      var token = _this2._store.state.auth.token;
      if (token) {
        request.headers.set('Authorization', _this2.options.authType + ' ' + token);
      }

      next(function (res) {
        // 当发现返回码为401时，跳转到登陆页面
        if (res.status === 401 && !request._noauth) {
          console.debug('unauthorized, jump to login page');
          _this2._router.push(_this2.options.authRedirect);
        }
      });
    });

    // 注册路由，实现当跳转到需要验证的url时，自动检查认证状态，如果失败，跳转到登录页面
    Vue.router.beforeEach(function (to, from, next) {
      if (to.query && to.query.tk) {
        var token = to.query.tk;
        localStorage.setItem('token', token);
        _this2._store.commit(types.SET_TOKEN, token);
      }

      // not matched route redirect to notFound route
      console.log('>>>> to: ', to);
      if (to.matched.length === 0) {
        next(_this2.options.notFoundRedirect);
      }

      var auth = false;
      var authRoutes = to.matched.filter(function (route) {
        return 'auth' in route.meta;
      });
      if (authRoutes.length) {
        auth = authRoutes[authRoutes.length - 1].meta.auth;
      }

      // 当用户通过第三方登录时,拿到URL中的token和access_token, 存入localstorage, 重定向至去除token信息的URL
      if (_this2.options.allowThirdpartyLogin && to.query.thirdparty_connect_access_token && to.query.thirdparty_connect_refresh_token) {
        _this2._store.commit(types.SET_TOKEN, to.query.thirdparty_connect_access_token);
        _this2._store.commit(types.SET_REFRESH_TOKEN, to.query.thirdparty_connect_refresh_token);
        next({ path: to.path });
      }

      // 当用户绑定第三方账号时, 重定向至去除绑定成功信息的URL
      if (_this2.options.allowThirdpartyLogin && to.query.thirdparty_connect_ok) {
        next({ path: to.path });
      }

      // 需要认证时，检查权限是否满足
      if (auth) {
        // 未获得token
        if (!_this2._store.state.auth.token) {
          // 当路由重定向到登陆页面， 附带重定向的页面值
          next({ path: _this2.options.authRedirect, query: { redirectedFrom: to.redirectedFrom || to.path } });
        } else {
          _this2.fetch().then(function () {
            var user = _this2.user();
            if ((typeof auth === 'undefined' ? 'undefined' : _typeof(auth)) === 'object' && auth.constructor === Array) {
              if (auth.indexOf(user.role) !== -1) {
                next();
              } else {
                next(_this2.options.forbiddenRedirect);
              }
            } else if (auth === user.role) {
              next();
            } else if (auth === true) {
              next();
            } else {
              next(_this2.options.authRedirect);
            }
          }, function () {
            // 获取用户信息失败，跳转到登录页面
            next(_this2.options.authRedirect);
          });
        }
      } else if (_this2._store.state.auth.token) {
        // 不需要认证时，如果存在token，则更新一次用户信息
        _this2.fetch().then(function () {
          // token有效，跳转
          next();
        }).catch(function () {
          // token失效，清除token
          _this2._store.commit(types.CLEAR_TOKENS);
          next();
        });
      } else {
        next();
      }
    });

    // refresh
    setInterval(function () {
      if (_this2._loaded) {
        _this2.refresh();
      }
    }, this.options.refreshInterval * 60 * 1000);
  }

  _createClass(Auth, [{
    key: 'url',
    value: function url(relative) {
      var prefix = this.options.hamletPrefix;
      if (prefix.charAt(prefix.length - 1) === '/') {
        prefix = prefix.slice(0, -1);
      }
      if (relative.charAt(0) === '/') {
        relative = relative.slice(1);
      }
      return prefix + '/' + relative;
    }
  }, {
    key: 'ready',
    value: function ready() {
      if (this._store.state.auth.user) {
        return true;
      }
      return false;
    }
  }, {
    key: 'login',
    value: function login(_ref) {
      var username = _ref.username,
          password = _ref.password;

      var url = this.url('login');
      var _this = this;
      var __randNum = Math.random();
      return this._http.post(url, { username: username, password: password }, { params: { __randNum: __randNum } }).then(function (res) {
        if (res.body.ok) {
          _this._store.commit(types.SET_TOKEN, res.body.data.access_token);
          _this._store.commit(types.SET_REFRESH_TOKEN, res.body.data.refresh_token);
          // 登录时自动获取user信息
          return _this.fetch();
        }
        return _Promise.reject(res);
      });
    }
  }, {
    key: 'user',
    value: function user() {
      return this._store.state.auth.user || {};
    }
  }, {
    key: 'token',
    value: function token() {
      return this._store.state.auth.token;
    }
  }, {
    key: 'fetch',
    value: function fetch() {
      var url = this.options.fetchUser;
      var _this = this;
      var __randNum = Math.random();
      return this._http.get(url, {
        before: function before(req) {
          req._noauth = true;
        },

        params: { __randNum: __randNum }
      }).then(function (res) {
        if (res.body.ok) {
          _this._store.commit(types.SET_USER, res.body.data.user);
          _this._loaded = true;
          return res;
        }
        return _Promise.reject(res);
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      var url = this.url('logout');
      var _this = this;
      var __randNum = Math.random();
      return this._http.post(url, {}, { params: { __randNum: __randNum } }).then(function () {
        _this._store.commit(types.CLEAR_TOKENS);
        _this._loaded = false;
      }, function (res) {
        console.warn('logout failed', res);
      });
    }
  }, {
    key: 'refresh',
    value: function refresh() {
      var url = this.url('refresh');
      var _this = this;
      var __randNum = Math.random();
      return this._http.get(url, {
        params: {
          refresh_token: _this._store.state.auth.refresh_token,
          __randNum: __randNum
        }
      }).then(function (res) {
        if (res.body.ok) {
          _this._store.commit(types.SET_TOKEN, res.body.data.access_token);
          return res;
        }
        return _Promise.reject(res);
      }, function (res) {
        console.warn('refresh token failed,', res);
      });
    }
  }]);

  return Auth;
}();

export default Auth;