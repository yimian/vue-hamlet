/**
 * Created by zhangjinjie on 2017/5/17.
 */
import * as types from './types';

const state = {
  token: localStorage.getItem('token'),
  refresh_token: localStorage.getItem('refresh_token'),
  appKey: null,
  user: null,
};


const getters = {
};


const actions = {
};


const mutations = {
  [types.SET_USER](state, user) {
    state.user = user;
  },
  [types.SET_TOKEN](state, token) {
    state.token = token;
    localStorage.setItem('token', state.token);
  },
  [types.SET_REFRESH_TOKEN](state, token) {
    state.refresh_token = token;
    localStorage.setItem('refresh_token', state.refresh_token);
  },
  [types.CLEAR_TOKENS](state) {
    state.token = null;
    state.refresh_token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  },
  [types.SET_APPKEY](state, appKey) {
    state.appKey = appKey;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
