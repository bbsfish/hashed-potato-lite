import { createStore } from 'vuex';

export default createStore({
  state: {
    fileHandle: null,
  },
  getters: {
    fileHandle: (state) => state.fileHandle,
  },
  mutations: {
    setFileHandle(state, fileHandle) {
      state.fileHandle = fileHandle;
    },
  },
  actions: {
  },
  modules: {
  },
});
