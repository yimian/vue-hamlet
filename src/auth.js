/**
 * Created by zhangjinjie on 2017/5/17.
 */
import store from './store';
import * as types from './store/types';
import consts from './consts';

export default class Auth {
  constructor(Vue, opts = {}) {
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

    // app key
    if (!opts.appKey) {
      console.error('must set app key first');
      return;
    }

    // set variables;
    this._Vue = Vue;

    // options
    const defaultOptions = {
      absPath: true,
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
    this.options = Object.assign({}, defaultOptions, opts);
    if (!this.options.fetchUser) {
      this.options.fetchUser = this.url('me');
    }

    const { options } = this;
    const instance = (Vue.$http || Vue.prototype.$http).create({
      headers: {
        'content-type': options.contentType || 'application/json;charset=utf-8',
      },
    });

    // authRedirect: 这里应该使用绝对路径，否则特殊情况会陷入无限循环
    // 可以使用 opts.absPath = false 来避免此限制
    if (options.absPath && options.authRedirect && options.authRedirect[0] !== '/') {
      console.error('The `authRedirect` option needs to be an absolute path');
      return;
    }

    this._http = instance;
    this._store = Vue.store;
    this._router = Vue.router;
    this._$locale = Vue.$locale || Vue.prototype.$locale;

    // fetch 用户信息后，变为 true，开始刷新；退出时，置为 false；
    this._loaded = false;

    // 下面用到此变量的地方均是对小程序和移动端的特殊处理
    this.isMobileOrMiniprogram = !!navigator.userAgent.match(/mobile|miniProgram|android/i);

    // add consts
    this.consts = consts;

    // register store
    Vue.store.registerModule('auth', store);

    // 必须在 register store 后面执行
    this._store.commit(types.SET_APPKEY, options.appKey);

    // register http interceptors
    this._http.interceptors.request.use((request) => {
      // 判断是否是 hamlet 请求，如果是添加 app_key
      if (request.url.indexOf(options.hamletPrefix) !== -1) {
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
        request.headers.Authorization = `${options.authType} ${token}`;
        // this._http.defaults.headers.common['Authorization'] = `${options.authType} ${token}`;
      }

      return request;
    });

    this._http.interceptors.response.use((res) => {
      // 当发现返回码为 401 时，跳转到登陆页面
      if (res.status === 401 && (!res.config || !res.config.headers || !res.config.headers._noauth)) {
        console.debug('unauthorized, jump to login page');
        this._router.push(options.authRedirect);
      }

      return Promise.resolve(res);
    }, (error) => {
      console.error('error', error);
      return Promise.reject(error);
    });

    // 记录上一次的 URL, 避免在 token 失效且重定向的 URL 非绝对路径时陷入无限循环
    let latestUrl = null;

    // 注册路由，实现当跳转到需要验证的 URL 时，自动检查认证状态，如果失败，跳转到登录页面
    Vue.router.beforeEach((to, from, next) => {
      if (latestUrl && latestUrl === to.path) {
        next();
      } else {
        latestUrl = to.path;
      }

      const query = to.query;
      if (query && query.tk) {
        const token = query.tk;
        localStorage.setItem('token', token);
        this._store.commit(types.SET_TOKEN, token);
      }

      if (query && query.rtk) {
        const refreshToken = query.rtk;
        localStorage.setItem('refresh_token', refreshToken);
        this._store.commit(types.SET_REFRESH_TOKEN, refreshToken);
      }

      // not matched route redirect to notFound route
      console.log('>>>> to: ', to);
      // 嵌入到 iFrame，此时 `document.referrer` 不为空
      const turl = document.referrer;
      console.log('hamlet---turl', turl);
      if (turl) {
        console.log('this.options.parentOrigin--obj---', this.options.parentOrigin);
        const keys = Object.keys(options.parentOrigin || {});
        let flag = false;

        for (let i = 0, len = keys.length; i < len; i += 1) {
          const re = new RegExp(`^${options.parentOrigin[keys[i]]}`, 'g');
          if (turl.match(re)) {
            flag = true;
            break;
          }
        }

        console.log('>>>>>>flag>>>>>>>', flag);
        if (flag) {
          console.log('---vue-hamlet-location', JSON.parse(JSON.stringify(location)));
          try {
            // 嵌入了父应用的 token、app_key，就先获取这个用户在当前 APP（如果存在）的 token 信息
            console.log('>>>>>>query>>>>>', query);
            console.log('>>>>>>query.token>>>>>', query.token);
            console.log('>>>>>>query.parent_app_key>>>>>', query.parent_app_key);
            if (query.token && query.parent_app_key) {
              this._store.commit(types.SET_TOKEN, query.token);

              // langKey 为空：不使用「语言切换」
              if (options.langKey) {
                const lang = query.lang === 'en' ? 'en' : 'zh-CN'
                this._$locale.use(lang);
                localStorage.setItem(options.langKey, lang);
              }

              return this.readAppUserToken({
                app_key: query.parent_app_key,
                child_app_key: options.appKey,
              })
                .then((val) => {
                  const { data } = val.data;
                  this._store.commit(types.SET_TOKEN, data.access_token);
                  this._store.commit(types.SET_REFRESH_TOKEN, data.refresh_token);
                  this.checkAuth(to, query, next);
                })
                .catch((res) => {
                  console.log('Failed to get token', res);
                  next(options.notFoundRedirect);
                });
            }
          } catch (err) {
            console.log('err', err);
            next(options.notFoundRedirect);
          }
        }
      }

      this.checkAuth(to, query, next);
    });

    // refresh
    setInterval(() => {
      if (this._loaded) {
        this.refresh();
      }
    }, options.refreshInterval * 60 * 1000);
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
        // console.log('\n\n>>>login successfully>>>\n\n', res);
        const data = res.data.data;

        if (res.data.ok) {
          // 强制微信绑定的应用只返回 `auth_key`
          if (data.auth_key) {
            return res;
          }

          _this._store.commit(types.SET_TOKEN, data.access_token);
          _this._store.commit(types.SET_REFRESH_TOKEN, data.refresh_token);

          // 提示微信绑定
          if (data.prompt_bind_wechat) {
            return res;
          }

          // 正常登录时自动获取 user 信息
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
        const { data } = res;
        if (data.ok) {
          _this._store.commit(types.SET_TOKEN, data.data.access_token);
          return res;
        }

        return Promise.reject(res);
      }, (res) => {
        console.warn('refresh token failed,', res);
      });
  }

  changePassword({ current_password, password, confirm_password }) {
    const url = this.url('change_password');
    const _this = this;
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
    console.log('>>>>>start>>>>>readAppUserToken');
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
      })
      .catch((err) => {
        console.log('>>>>>readAppUserToken failed>>>>>>', err);
        return Promise.reject(err);
      });
  }

  checkAuth(to, query, next) {
    const { options } = this;
    if (!to.matched.length) {
      next(options.notFoundRedirect);
    }

    let auth = false;
    const authRoutes = to.matched.filter(route => 'auth' in route.meta);
    if (authRoutes.length) {
      auth = authRoutes[authRoutes.length - 1].meta.auth;
    }

    // 当用户通过第三方登录时,拿到 URL 中的 token 和 access_token, 存入 localstorage, 重定向至去除 token 信息的 URL
    if (options.allowThirdpartyLogin &&
      query.thirdparty_connect_access_token &&
      query.thirdparty_connect_refresh_token) {
      this._store.commit(types.SET_TOKEN, query.thirdparty_connect_access_token);
      this._store.commit(types.SET_REFRESH_TOKEN, query.thirdparty_connect_refresh_token);
      next({ path: to.path });
    }

    // 当用户绑定第三方账号时, 重定向至去除绑定成功信息的 URL
    if (options.allowThirdpartyLogin && query.thirdparty_connect_ok) {
      next({ path: to.path });
    }

    const token = this._store.state.auth.token;

    // 需要认证时，检查权限是否满足
    if (auth) {
      // 未获得 token
      if (!token) {
        // 当路由重定向到登陆页面，附带重定向的页面值
        let fullPath = to.path;
        if (query && fullPath) {
          const keys = Object.keys(query);
          for (let i = 0, len = keys.length; i < len; i += 1) {
            fullPath = `${fullPath}${i === 0 ? '?' : '&'}${keys[i]}=${query[keys[i]]}`;
          }
        }
        next({ path: options.authRedirect, query: { redirectedFrom: to.redirectedFrom || fullPath } });
      } else {
        this.fetch().then(() => {
          const user = this.user();
          if (typeof auth === 'object' && auth.constructor === Array) {
            if ((!user.role && !auth.length) || auth.indexOf(user.role) !== -1) {
              next();
            } else {
              next(options.forbiddenRedirect);
            }
          } else if (this.isMobileOrMiniprogram || auth === user.role || auth === true) {
            next();
          } else {
            next(options.authRedirect);
          }
        }, () => {
          // 获取用户信息失败，跳转到登录页面
          if (this.isMobileOrMiniprogram) {
            next();
          } else {
            next(options.authRedirect);
          }
        });
      }
    } else if (token) {
      // 不需要认证时，如果存在 token，则更新一次用户信息
      this.fetch().then(() => {
        // token 有效，跳转
        next();
      }).catch(() => {
        // token 失效，清除 token
        // hack: 小程序、移动端这里不需要清空 token
        if (!this.isMobileOrMiniprogram) {
          this._store.commit(types.CLEAR_TOKENS);
        }

        next();
      });
    } else {
      next();
    }
  }
}
