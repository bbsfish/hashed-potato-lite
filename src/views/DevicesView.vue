<template>
  <div class="devices-view">
    <h1>デバイス登録 (TOTP)</h1>
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
      <div v-if="dataHandle">
        <p><span>ファイル名</span><span>{{ fileHandle.name }}</span></p>
        <p><span>ファイルID</span><span>{{ head.fileId }}</span></p>
        <p><span>ファイルラベル</span><span>{{ head.fileTitle }}</span></p>
        <p><span>ファイル概要</span><span>{{ head.fileDescription }}</span></p>
        <p><span>最終更新日時</span><span>{{ new Date(head.updatedAt).toLocaleString() }}</span></p>
        <button class="register-button" @click="step = 'generating'">はい、登録を続行します</button>
      </div>
    </section>
    <section class="generating" v-if="step == 'generating'">
      <LoadingSpinner m="QRコードを生成しています..." />
    </section>
    <section class="scan" v-if="step === 'scan'">
      <h2>QRコードをスキャン</h2>
      <p>お使いの認証アプリで以下のQRコードをスキャンしてください。</p>
      <QRCode :text="qrCodeDataUrl" />
      <div class="verification">
        <p>スキャンが完了したら、表示されている6桁のコードを入力して登録を完了してください。</p>
        <input type="text" v-model="verificationCode" placeholder="6桁のコード" maxlength="6" class="verification-input" />
        <button @click="verifyCode" class="verify-button">確認</button>
      </div>
    </section>
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
    };
  },
  computed: {
    ...mapGetters(['dataHandle', 'fileHandle']),
    head() {
      return this.dataHandle ? this.dataHandle.getHead() : null;
    }
  },
  methods: {
    async generateQrCode() {
      try {
        const userNetInfo = await api.getNetInfo(); // ユーザのネットワーク情報を取得
        const fileId = this.head.fileId;
        const params = {
          file_id: fileId,
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
    async verifyCode() {
        if (this.verificationCode.length !== 6 || !/^\d{6}$/.test(this.verificationCode)) {
            this.$dialog.alert('有効な6桁のコードを入力してください。');
            return;
        }
        // TODO: 本来はここでサーバーに確認コードを送信して検証する
        // 今回はフロントエンドのみの実装のため、成功したと仮定する
        console.log('Verification code:', this.verificationCode);
        console.log('Secret:', this.secret);
        await this.$dialog.alert('デバイスの登録が完了しました。');
        this.qrCodeDataUrl = null;
        this.verificationCode = '';
        this.secret = null;
    }
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

.verification-section {
    margin-top: 2rem;
    .verification-input {
        display: block;
        width: 50%;
        margin: 1rem auto;
        padding: 0.75rem;
        font-size: 1.2rem;
        text-align: center;
        letter-spacing: 0.5em;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
}
</style>