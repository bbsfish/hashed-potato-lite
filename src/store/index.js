import { createStore } from 'vuex';

export default createStore({
  state: {
    fileHandle: null,
    dataHandle: null,
    isModified: false,
    clientPassword: null,
    /** @type {{ account: object, table: object }} dataHandle の子クラスのインスタンス群 */
    dataSubHandles: {},
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
    dataSubHandles: (state) => state.dataSubHandles,
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
    clearEditor(state) {
      state.editor.tableId = null;
      state.editor.sn = null;
    },
    setDataSubHandles(state, { name, handle }) {
      state.dataSubHandles[name] = handle;
    },
  },
  actions: {
  },
  modules: {
  },
});
