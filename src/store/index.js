import { createStore } from 'vuex';

export default createStore({
  state: {
    fileHandle: null,
    dataHandle: null,
    isModified: false,
    clientPassword: null,
    editor: {
      tableId: null,
      sn: null,
    },
  },
  getters: {
    fileHandle: (state) => state.fileHandle,
    dataHandle: (state) => state.dataHandle,
    isModified: (state) => state.isModified,
    clientPassword: (state) => state.clientPassword,
    isClientPasswordSet: (state) => state.clientPassword !== null,
    editor: (state) => state.editor,
  },
  mutations: {
    setFileHandle(state, { handle, isOverwrite = false }) {
      if (state.fileHandle !== null && !isOverwrite) return console.warn('FileHandle is already set. Use isOverwrite=true to overwrite it');
      state.fileHandle = handle;
    },
    setDataHandle(state, { handle, isOverwrite = false }) {
      if (state.dataHandle !== null && !isOverwrite) return console.warn('DataHandle is already set. Use isOverwrite=true to overwrite it');
      state.dataHandle = handle;
    },
    setModified(state, value) { state.isModified = value; },
    setClientPassword(state, { pw, isOverwrite = false }) {
      if (state.clientPassword !== null && !isOverwrite) return console.warn('Client Password is already set. Use isOverwrite=true to overwrite it');
      state.clientPassword = pw;
    },
    setEditor(state, { tableId, sn }) { Object(state.editor, { tableId, sn }); },
  },
  actions: {
  },
  modules: {
  },
});
