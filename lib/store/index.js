import _defineProperty from 'babel-runtime/helpers/defineProperty';

var _mutations;

/**
 * Created by zhangjinjie on 2017/5/17.
 */
import * as types from './types';

var state = {
  token: localStorage.getItem('token'),
  refresh_token: localStorage.getItem('refresh_token'),
  appKey: null,
  user: null
};

var getters = {};

var actions = {};

var mutations = (_mutations = {}, _defineProperty(_mutations, types.SET_USER, function (state, user) {
  state.user = user;
}), _defineProperty(_mutations, types.SET_TOKEN, function (state, token) {
  state.token = token;
  localStorage.setItem('token', state.token);
}), _defineProperty(_mutations, types.SET_REFRESH_TOKEN, function (state, token) {
  state.refresh_token = token;
  localStorage.setItem('refresh_token', state.refresh_token);
}), _defineProperty(_mutations, types.CLEAR_TOKENS, function (state) {
  state.token = null;
  state.refresh_token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
}), _defineProperty(_mutations, types.SET_APPKEY, function (state, appKey) {
  state.appKey = appKey;
}), _mutations);

export default {
  state: state,
  getters: getters,
  actions: actions,
  mutations: mutations
};