import { createStore } from 'vuex';

export default createStore({
  state: {
    fileHandle: null,
    dataHandle: null,
    isModified: false,
  },
  getters: {
    fileHandle: (state) => state.fileHandle,
    dataHandle: (state) => state.dataHandle,
    isModified: (state) => state.isModified,
  },
  mutations: {
    setFileHandle(state, handler) { state.fileHandle = handler; },
    setDataHandle(state, handler) { state.dataHandle = handler; },
    setModified(state, value) { state.isModified = value; },
  },
  actions: {
  },
  modules: {
  },
});
