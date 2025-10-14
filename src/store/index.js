import { createStore } from 'vuex';

export default createStore({
  state: {
    fileHandle: null,
    dataHandle: null,
  },
  getters: {
    fileHandle: (state) => state.fileHandle,
    dataHandle: (state) => state.dataHandle,
  },
  mutations: {
    setFileHandle(state, handler) { state.fileHandle = handler; },
    setDataHandle(state, handler) { state.dataHandle = handler; },
  },
  actions: {
  },
  modules: {
  },
});
