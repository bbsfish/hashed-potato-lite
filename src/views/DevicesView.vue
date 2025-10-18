<template>
  <div class="devices-view">
    <h1>デバイス登録 (TOTP)</h1>
    <div v-if="!dataHandle">
      <p>新しい TOTP デバイスを登録するには、まずファイルを選択または作成してください。</p>
      <p><router-link :to="{ name: 'Home' }">ホームに戻る</router-link></p>
    </div>
    <div v-else>
      <section class="initial" v-if="step === 'initial'">
        <p>新しいTOTPデバイスを登録します。</p>
        <button class="register-button" @click="step = (dataHandle) ? 'confirmation' : 'prepare'">登録開始</button>
      </section>
      <section class="prepare" v-if="step === 'prepare'">
        <SelectFileButton />
        <SelectRecentFileButton />
        <CreateFileButton />
      </section>
      <section class="confirmation" v-if="step === 'confirmation'">
        <p>以下のファイルが選択されました。よろしいですか?</p>
        <p class="file-info"><span>ファイル名</span><span>{{ fileHandle.name }}</span></p>
        <p class="file-info"><span>ファイルID</span><span>{{ head.fileId }}</span></p>
        <p class="file-info"><span>ファイルSID</span><span>{{ head.fileSId }}</span></p>
        <p class="file-info"><span>ファイルラベル</span><span>{{ head.fileTitle }}</span></p>
        <p class="file-info"><span>ファイル概要</span><span>{{ head.fileDescription }}</span></p>
        <p class="file-info"><span>最終更新日時</span><span>{{ new Date(head.updatedAt).toLocaleString() }}</span></p>
        <button class="register-button" @click="step = 'labeling'">はい、登録を続行します</button>
      </section>
      <section class="labeling" v-if="step === 'labeling'">
        <p>デバイスの認証アプリに表示する名前を入力してください。(英数字、4文字以上、32文字以下)</p>
        <p style="color: red" v-if="errorMessage">{{ errorMessage }}</p>
        <input type="text" minlength="4" maxlength="32" v-model="vmUserLabel" />
        <p>このように表示されます:<br />"HashedPotatoLite: {{ encodedUserLabel }}({{ head.fileSId }})"</p>
        <button class="register-button" @click="registerUserLabel">この名前で登録</button>
      </section>
      <section class="generating" v-if="step == 'generating'">
        <LoadingSpinner m="QRコードを生成しています..." />
      </section>
      <section class="scan" v-if="step === 'scan'">
        <h2>QRコードをスキャン</h2>
        <p>お使いの認証アプリで以下のQRコードをスキャンしてください。</p>
        <QRCode :text="qrCodeDataUrl" />
        <button class="register-button" @click="step = 'initial'">完了</button>
      </section>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import api from '@/lib/api';
import SelectFileButton from '@/components/SelectFileButton.vue';
import SelectRecentFileButton from '@/components/SelectRecentFileButton.vue';
import CreateFileButton from '@/components/CreateFileButton.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import QRCode from '@/components/QRCode.vue';

export default {
  name: 'DevicesView',
  components: {
    SelectFileButton,
    SelectRecentFileButton,
    CreateFileButton,
    LoadingSpinner,
    QRCode,
  },
  data() {
    return {
      step: 'initial',  // 'initial', 'prepare', 'generating', 'scan'
      qrCodeDataUrl: null,
      secret: null, // サーバーから受け取ったシークレットを保持
      verificationCode: '',
      vmUserLabel: '',
      errorMessage: '',
    };
  },
  computed: {
    ...mapGetters(['dataHandle', 'fileHandle']),
    head() {
      return this.dataHandle ? this.dataHandle.getHead() : null;
    },
    encodedUserLabel() {
      return encodeURI(this.vmUserLabel.trim());
    },
  },
  methods: {
    registerUserLabel() {
      if (this.vmUserLabel.length < 4 || this.vmUserLabel.length > 32) this.errorMessage = '文字数を確認してください';
      this.step = 'generating';
    },
    async generateQrCode() {
      try {
        const userNetInfo = await api.getNetInfo(); // ユーザのネットワーク情報を取得
        const fileId = this.head.fileId;
        const params = {
          file_id: fileId,
          label: `HashedPotatoLite: ${this.encodedUserLabel}(${this.head.fileSId})`,
          ip_address: userNetInfo.ip,
          region: userNetInfo.timezone,
        }
        const result = await api.post(api.TOTP_REGISTRATION, params);
        this.qrCodeDataUrl = result.otpauth_url;
        this.step = 'scan';
      } catch (error) {
        this.$dialog.alert('QRコードの生成に失敗しました');
        this.step = 'initial';
      }
    },
  },
  watch: {
    dataHandle() {
      this.step = 'confirmation';
    },
    step(to) {
      if (to === 'generating') {
        this.qrCodeDataUrl = null;
        this.generateQrCode();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.devices-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.register-button, .verify-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
  background-color: var.$button-color;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var.$button-hovered-color;
  }
}

.qr-code-section {
  margin-top: 2rem;
  img {
    display: block;
    margin: 1rem auto;
    border: 5px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
}

.file-info {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;

  span:first-child {
    text-align: left;
    display: inline-block;
    width: 10rem;
    font-weight: bold;
  }
  span:last-child {
    text-align: left;
    display: inline-block;
    width: calc(100% - 10rem);
    word-break: break-all;
  }
}
</style>