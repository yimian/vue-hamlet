import _typeof from 'babel-runtime/helpers/typeof';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _Promise from 'babel-runtime/core-js/promise';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
/**
 * Created by zhangjinjie on 2017/5/17.
 */
import store from './store';
import * as types from './store/types';
import consts from './consts';

var Auth = function () {
  function Auth(Vue) {
    var _this2 = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Auth);

    // check Axios, Vue-router, Vuex used
    if (!Vue.$http && !Vue.prototype.$http) {
      console.error('Axios must be set first');
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
    var instance = (Vue.$http || Vue.prototype.$http).create({
      headers: {
        'content-type': options.contentType || 'application/json;charset=utf-8'
      }
    });

    this._http = instance;
    this._store = Vue.store;
    this._router = Vue.router;
    this._$locale = Vue.$locale || Vue.prototype.$locale;

    // fetch 用户信息后，变为 true，开始刷新；退出时，置为 false；
    this._loaded = false;

    // options
    var defaultOptions = {
      appKey: '',
      authType: 'Bearer',
      hamletPrefix: '/api/auth',
      authRedirect: '/login',

      // mins
      refreshInterval: 10,
      forbiddenRedirect: '/403',
      notFoundRedirect: '/404',
      allowThirdpartyLogin: false,

      // 获取当前用户在当前 APP 中的 token 信息
      readAppToken: '/thirdparty/ym_app/token',

      //  父应用 URL，只有 parentOrigin 包含的 URL 才会通过父应用的 token 去获取当前应用的 token
      parentOrigin: {
        oneview: 'https://oneview.yimian.com.cn',
        'oneview-test': 'http://oneview.test.yimian.com.cn'
      },

      // 当前应用语言国际化时存储在 localStorage 里的 key
      langKey: 'VUE-HAMLET_LANGUAGE'
    };
    this.options = _Object$assign({}, defaultOptions, options);
    this.options.fetchUser = this.options.fetchUser || this.url('me');

    // add consts
    this.consts = consts;

    // register store
    Vue.store.registerModule('auth', store);

    // app key
    if (!this.options.appKey) {
      console.error('must set app key first');
      return;
    }

    // 必须在 register store 后面执行
    this._store.commit(types.SET_APPKEY, options.appKey);

    // register http interceptors
    this._http.interceptors.request.use(function (request) {
      // console.log('request', request);
      // 判断是否是 hamlet 请求，如果是添加 app_key
      if (request.url.indexOf(_this2.options.hamletPrefix) !== -1) {
        var appKey = _this2._store.state.auth.appKey;
        var method = request.method && request.method.toUpperCase();
        if (['POST', 'PUT'].indexOf(method) !== -1) {
          request.data = _Object$assign(request.data || {}, { app_key: appKey });
        } else if (['GET'].indexOf(method) !== -1) {
          request.params = _Object$assign(request.params || {}, { app_key: appKey });
        }
      }

      // 判断是否包含 token，如果有，则加到 header 里面
      var token = _this2._store.state.auth.token;

      if (token) {
        request.headers.Authorization = _this2.options.authType + ' ' + token;
        // this._http.defaults.headers.common['Authorization'] = `${this.options.authType} ${token}`;
      }

      return request;
    });

    this._http.interceptors.response.use(function (res) {
      // console.log('response', res);
      // 当发现返回码为 401 时，跳转到登陆页面
      if (res.status === 401 && (!res.config || !res.config.headers || !res.config.headers._noauth)) {
        console.debug('unauthorized, jump to login page');
        _this2._router.push(_this2.options.authRedirect);
      }

      return _Promise.resolve(res);
    }, function (error) {
      console.error('error', error);
      return _Promise.reject(error);
    });

    // 注册路由，实现当跳转到需要验证的 URL 时，自动检查认证状态，如果失败，跳转到登录页面
    Vue.router.beforeEach(function (to, from, next) {
      // not matched route redirect to notFound route
      console.log('>>>> to: ', to);
      var query = to.query;

      // console.log('query---', query);
      // console.log('hamlet---document.referrer', document.referrer);
      // console.log('hamlet---parent.location.href', parent.location.href);
      // 嵌入到 iFrame，此时 `document.referrer` 不为空
      var turl = document.referrer;
      // console.log('hamlet---turl', turl);
      if (turl) {
        // console.log('this.options.parentOrigin--obj---', this.options.parentOrigin);
        var keys = _Object$keys(_this2.options.parentOrigin || {});
        var flag = false;

        for (var i = 0, len = keys.length; i < len; i += 1) {
          var re = new RegExp('^' + _this2.options.parentOrigin[keys[i]], 'g');
          if (turl.match(re)) {
            flag = true;
            break;
          }
        }

        if (flag) {
          // console.log('---vue-hamlet-location', JSON.parse(JSON.stringify(location)));
          try {
            // 嵌入了父应用的 token、app_key，就先获取这个用户在当前 APP（如果存在）的 token 信息
            if (query.token && query.parent_app_key) {
              _this2._store.commit(types.SET_TOKEN, query.token);

              // langKey 为空：不使用「语言切换」
              if (_this2.options.langKey) {
                var lang = query.lang === 'en' ? 'en' : 'zh-CN';
                _this2._$locale.use(lang);
                localStorage.setItem(_this2.options.langKey, lang);
              }

              return _this2.readAppUserToken({
                app_key: query.parent_app_key,
                child_app_key: _this2.options.appKey
              }).then(function (val) {
                var data = val.data.data;
                // console.log('>>>>>>data>>>', data);

                _this2._store.commit(types.SET_TOKEN, data.access_token);
                _this2._store.commit(types.SET_REFRESH_TOKEN, data.refresh_token);
                next();
              }).catch(function (res) {
                console.log('Failed to get token', res);
                next(_this2.options.notFoundRedirect);
              });
            }
          } catch (err) {
            console.log('err', err);
            next(_this2.options.notFoundRedirect);
          }
        }
      }

      if (!to.matched.length) {
        next(_this2.options.notFoundRedirect);
      }

      var auth = false;
      var authRoutes = to.matched.filter(function (route) {
        return 'auth' in route.meta;
      });

      if (authRoutes.length) {
        auth = authRoutes[authRoutes.length - 1].meta.auth;
      }

      // 当用户通过第三方登录时,拿到 URL 中的 token 和 access_token, 存入 localstorage, 重定向至去除 token 信息的 URL
      if (_this2.options.allowThirdpartyLogin && query.thirdparty_connect_access_token && query.thirdparty_connect_refresh_token) {
        _this2._store.commit(types.SET_TOKEN, query.thirdparty_connect_access_token);
        _this2._store.commit(types.SET_REFRESH_TOKEN, query.thirdparty_connect_refresh_token);
        next({ path: to.path });
      }

      // 当用户绑定第三方账号时, 重定向至去除绑定成功信息的 URL
      if (_this2.options.allowThirdpartyLogin && query.thirdparty_connect_ok) {
        next({ path: to.path });
      }

      // 需要认证时，检查权限是否满足
      if (auth) {
        // 未获得 token
        if (!_this2._store.state.auth.token) {
          // 当路由重定向到登陆页面，附带重定向的页面值
          var fullPath = to.path;
          if (query && fullPath) {
            var _keys = _Object$keys(query);
            for (var _i = 0, _len = _keys.length; _i < _len; _i += 1) {
              fullPath = '' + fullPath + (_i === 0 ? '?' : '&') + _keys[_i] + '=' + query[_keys[_i]];
            }
          }
          next({ path: _this2.options.authRedirect, query: { redirectedFrom: to.redirectedFrom || fullPath } });
        } else {
          _this2.fetch().then(function () {
            var user = _this2.user();
            if ((typeof auth === 'undefined' ? 'undefined' : _typeof(auth)) === 'object' && auth.constructor === Array) {
              if (!user.role && !auth.length || auth.indexOf(user.role) !== -1) {
                next();
              } else {
                next(_this2.options.forbiddenRedirect);
              }
            } else if (auth === user.role || auth === true) {
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
        // 不需要认证时，如果存在 token，则更新一次用户信息
        _this2.fetch().then(function () {
          // token 有效，跳转
          next();
        }).catch(function () {
          // token 失效，清除 token
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
      return !!this._store.state.auth.user;
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
        // console.log('login successful', res);
        var data = res.data;


        if (data.ok) {
          _this._store.commit(types.SET_TOKEN, data.data.access_token);
          _this._store.commit(types.SET_REFRESH_TOKEN, data.data.refresh_token);

          // 登录时自动获取 user 信息
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
        transformRequest: function transformRequest(req, headers) {
          headers._noauth = true;
          return req;
        },

        params: { __randNum: __randNum }
      }).then(function (res) {
        if (res.data.ok) {
          _this._store.commit(types.SET_USER, res.data.data.user);
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
        if (res.data.ok) {
          _this._store.commit(types.SET_TOKEN, res.data.data.access_token);
          return res;
        }

        return _Promise.reject(res);
      }, function (res) {
        console.warn('refresh token failed,', res);
      });
    }
  }, {
    key: 'changePassword',
    value: function changePassword(_ref2) {
      var current_password = _ref2.current_password,
          password = _ref2.password,
          confirm_password = _ref2.confirm_password;

      var url = this.url('change_password');
      var __randNum = Math.random();
      return this._http.post(url, { current_password: current_password, password: password, confirm_password: confirm_password }, { params: { __randNum: __randNum } }).then(function (res) {
        console.log('changePassword successfully', res);
        if (res.data.ok) {
          return res;
        }

        return _Promise.reject(res);
      });
    }
  }, {
    key: 'readAppUserToken',
    value: function readAppUserToken(params) {
      var url = this.options.readAppToken;
      var __randNum = Math.random();
      return this._http.post(url, params, { params: { __randNum: __randNum } }).then(function (res) {
        console.log('readAppUserToken successfully', res);
        if (res.data.ok) {
          return res;
        }

        return _Promise.reject(res);
      });
    }
  }]);

  return Auth;
}();

export default Auth;