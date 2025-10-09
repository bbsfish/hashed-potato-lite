import { createStore } from 'vuex';

export default createStore({
  state: {
    password: null,
  },
  getters: {
    password: (state) => state.password,
  },
  mutations: {
    setPassword(state, value) {
      state.password = value;
    },
  },
  actions: {
  },
  modules: {
  },
});
