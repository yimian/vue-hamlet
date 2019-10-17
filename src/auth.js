/**
 * Created by zhangjinjie on 2017/5/17.
 */
import store from './store';
import * as types from './store/types';
import consts from './consts';

export default class Auth {
  constructor(Vue, options = {}) {
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
    const instance = (Vue.$http || Vue.prototype.$http).create({
      headers: {
        'content-type': options.contentType || 'application/json;charset=utf-8',
      },
    });

    this._http = instance;
    this._store = Vue.store;
    this._router = Vue.router;
    this._$locale = Vue.$locale;

    // fetch 用户信息后，变为 true，开始刷新；退出时，置为 false；
    this._loaded = false;

    // options
    const defaultOptions = {
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
        'oneview-test': 'http://oneview.test.yimian.com.cn',
      },

      // 当前应用语言国际化时存储在 localStorage 里的 key
      langKey: 'VUE-HAMLET_LANGUAGE',
    };
    this.options = Object.assign({}, defaultOptions, options);
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
    this._http.interceptors.request.use((request) => {
      // console.log('request', request);
      // 判断是否是 hamlet 请求，如果是添加 app_key
      if (request.url.indexOf(this.options.hamletPrefix) !== -1) {
        const appKey = this._store.state.auth.appKey;
        const method = request.method && request.method.toUpperCase();
        if (['POST', 'PUT'].indexOf(method) !== -1) {
          request.data = Object.assign(
            request.data || {},
            { app_key: appKey },
          );
        } else if (['GET'].indexOf(method) !== -1) {
          request.params = Object.assign(
            request.params || {},
            { app_key: appKey },
          );
        }
      }

      // 判断是否包含 token，如果有，则加到 header 里面
      const token = this._store.state.auth.token;

      if (token) {
        request.headers.Authorization = `${this.options.authType} ${token}`;
        // this._http.defaults.headers.common['Authorization'] = `${this.options.authType} ${token}`;
      }

      return request;
    });

    this._http.interceptors.response.use((res) => {
      // console.log('response', res);
      // 当发现返回码为 401 时，跳转到登陆页面
      if (res.status === 401 && (!res.config || !res.config.headers || !res.config.headers._noauth)) {
        console.debug('unauthorized, jump to login page');
        this._router.push(this.options.authRedirect);
      }

      return Promise.resolve(res);
    }, (error) => {
      console.error('error', error);
      return Promise.reject(error);
    });

    // 注册路由，实现当跳转到需要验证的 URL 时，自动检查认证状态，如果失败，跳转到登录页面
    Vue.router.beforeEach((to, from, next) => {
      // not matched route redirect to notFound route
      console.log('>>>> to: ', to);
      const query = to.query;

      // console.log('query---', query);
      // console.log('hamlet---document.referrer', document.referrer);
      // console.log('hamlet---parent.location.href', parent.location.href);
      // 嵌入到 iFrame，此时 `document.referrer` 不为空
      const turl = document.referrer;
      // console.log('hamlet---turl', turl);
      if (turl) {
        // console.log('this.options.parentOrigin--obj---', this.options.parentOrigin);
        const keys = Object.keys(this.options.parentOrigin || {});
        let flag = false;

        for (let i = 0, len = keys.length; i < len; i += 1) {
          const re = new RegExp(`^${this.options.parentOrigin[keys[i]]}`, 'g');
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
              this._store.commit(types.SET_TOKEN, query.token);
              const lang = query.lang === 'en' ? 'en' : 'zh-CN'
              this._$locale.use(lang);
              localStorage.setItem(this.options.langKey, lang);

              return this.readAppUserToken({
                app_key: query.parent_app_key,
                child_app_key: this.options.appKey,
              })
                .then((val) => {
                  const { data } = val.data;
                  // console.log('>>>>>>data>>>', data);
                  this._store.commit(types.SET_TOKEN, data.access_token);
                  this._store.commit(types.SET_REFRESH_TOKEN, data.refresh_token);
                  next();
                })
                .catch((res) => {
                  console.log('Failed to get token', res);
                  next(this.options.notFoundRedirect);
                });
            }
          } catch (err) {
            console.log('err', err);
            next(this.options.notFoundRedirect);
          }
        }
      }

      if (!to.matched.length) {
        next(this.options.notFoundRedirect);
      }

      let auth = false;
      const authRoutes = to.matched.filter(route => 'auth' in route.meta);

      if (authRoutes.length) {
        auth = authRoutes[authRoutes.length - 1].meta.auth;
      }

      // 当用户通过第三方登录时,拿到 URL 中的 token 和 access_token, 存入 localstorage, 重定向至去除 token 信息的 URL
      if (this.options.allowThirdpartyLogin &&
        query.thirdparty_connect_access_token &&
        query.thirdparty_connect_refresh_token) {
        this._store.commit(types.SET_TOKEN, query.thirdparty_connect_access_token);
        this._store.commit(types.SET_REFRESH_TOKEN, query.thirdparty_connect_refresh_token);
        next({ path: to.path });
      }

      // 当用户绑定第三方账号时, 重定向至去除绑定成功信息的 URL
      if (this.options.allowThirdpartyLogin && query.thirdparty_connect_ok) {
        next({ path: to.path });
      }

      // 需要认证时，检查权限是否满足
      if (auth) {
        // 未获得 token
        if (!this._store.state.auth.token) {
          // 当路由重定向到登陆页面，附带重定向的页面值
          let fullPath = to.path;
          if (query && fullPath) {
            const keys = Object.keys(query);
            for (let i = 0, len = keys.length; i < len; i += 1) {
              fullPath = `${fullPath}${i === 0 ? '?' : '&'}${keys[i]}=${query[keys[i]]}`;
            }
          }
          next({ path: this.options.authRedirect, query: { redirectedFrom: to.redirectedFrom || fullPath } });
        } else {
          this.fetch().then(() => {
            const user = this.user();
            if (typeof auth === 'object' && auth.constructor === Array) {
              if ((!user.role && !auth.length) || auth.indexOf(user.role) !== -1) {
                next();
              } else {
                next(this.options.forbiddenRedirect);
              }
            } else if (auth === user.role || auth === true) {
              next();
            } else {
              next(this.options.authRedirect);
            }
          }, () => {
            // 获取用户信息失败，跳转到登录页面
            next(this.options.authRedirect);
          });
        }
      } else if (this._store.state.auth.token) {
        // 不需要认证时，如果存在 token，则更新一次用户信息
        this.fetch().then(() => {
          // token 有效，跳转
          next();
        }).catch(() => {
          // token 失效，清除 token
          this._store.commit(types.CLEAR_TOKENS);
          next();
        });
      } else {
        next();
      }
    });

    // refresh
    setInterval(() => {
      if (this._loaded) {
        this.refresh();
      }
    }, this.options.refreshInterval * 60 * 1000);
  }

  url(relative) {
    let prefix = this.options.hamletPrefix;

    if (prefix.charAt(prefix.length - 1) === '/') {
      prefix = prefix.slice(0, -1);
    }

    if (relative.charAt(0) === '/') {
      relative = relative.slice(1);
    }

    return `${prefix}/${relative}`;
  }

  ready() {
    return !!this._store.state.auth.user;
  }

  login({ username, password }) {
    const url = this.url('login');
    const _this = this;
    const __randNum = Math.random();
    return this._http.post(url,
      { username, password },
      { params: { __randNum } },
    )
      .then((res) => {
        // console.log('login successful', res);
        const { data } = res;

        if (data.ok) {
          _this._store.commit(types.SET_TOKEN, data.data.access_token);
          _this._store.commit(types.SET_REFRESH_TOKEN, data.data.refresh_token);

          // 登录时自动获取 user 信息
          return _this.fetch();
        }

        return Promise.reject(res);
      });
  }

  user() {
    return this._store.state.auth.user || {};
  }

  token() {
    return this._store.state.auth.token;
  }

  fetch() {
    const url = this.options.fetchUser;
    const _this = this;
    const __randNum = Math.random();
    return this._http.get(url, {
      transformRequest(req, headers) {
        headers._noauth = true;
        return req;
      },
      params: { __randNum },
    })
      .then((res) => {
        if (res.data.ok) {
          _this._store.commit(types.SET_USER, res.data.data.user);
          _this._loaded = true;
          return res;
        }

        return Promise.reject(res);
      });
  }

  logout() {
    const url = this.url('logout');
    const _this = this;
    const __randNum = Math.random();
    return this._http.post(url, {}, { params: { __randNum } })
      .then(() => {
        _this._store.commit(types.CLEAR_TOKENS);
        _this._loaded = false;
      }, (res) => {
        console.warn('logout failed', res);
      });
  }

  refresh() {
    const url = this.url('refresh');
    const _this = this;
    const __randNum = Math.random();
    return this._http.get(url, {
      params: {
        refresh_token: _this._store.state.auth.refresh_token,
        __randNum,
      },
    })
      .then((res) => {
        if (res.data.ok) {
          _this._store.commit(types.SET_TOKEN, res.data.data.access_token);
          return res;
        }

        return Promise.reject(res);
      }, (res) => {
        console.warn('refresh token failed,', res);
      });
  }

  changePassword({ current_password, password, confirm_password }) {
    const url = this.url('change_password');
    const __randNum = Math.random();
    return this._http.post(url,
      { current_password, password, confirm_password },
      { params: { __randNum } },
    )
      .then((res) => {
        console.log('changePassword successfully', res);
        if (res.data.ok) {
          return res;
        }

        return Promise.reject(res);
      });
  }

  readAppUserToken(params) {
    const url = this.options.readAppToken;
    const __randNum = Math.random();
    return this._http.post(url,
      params,
      { params: { __randNum } },
    )
      .then((res) => {
        console.log('readAppUserToken successfully', res);
        if (res.data.ok) {
          return res;
        }

        return Promise.reject(res);
      });
  }
}
