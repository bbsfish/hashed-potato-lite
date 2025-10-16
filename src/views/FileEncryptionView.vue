<template>
  <div class="file-encryption-view">
    <h1>ファイルの暗号化</h1>
    <section class="initial" v-if="step === 'initial'">
      <p>ファイルを暗号化して保存します</p>
      <button class="confirmation-button" @click="step = 'confirmation'">暗号化開始</button>
    </section>
    <section class="confirmation" v-if="step === 'confirmation'">
      <p>以下のファイルが暗号化されます。よろしいですか?</p>
      <div v-if="dataHandle">
        <p><span>ファイル名</span><span>{{ fileHandle.name }}</span></p>
        <p><span>ファイルID</span><span>{{ head.fileId }}</span></p>
        <p><span>ファイルラベル</span><span>{{ head.fileName }}</span></p>
        <p><span>ファイル概要</span><span>{{ head.fileDescription }}</span></p>
        <p><span>最終更新日時</span><span>{{ new Date(head.updatedAt).toLocaleString() }}</span></p>
        <button class="confirmation-button" @click="step = 'client-password'">はい、暗号化を続行します</button>
      </div>
    </section>
    <section class="client-password" v-if="step === 'client-password'">
      <p>マスターパスワードを設定します。これはファイルを開くために必要です。忘れた場合、もとには戻せません。慎重に設定してください</p>
      <label>
        <span>マスターパスワード</span>
        <input type="password" class="mp-input" placeholder="マスターパスワードを入力" v-model="vmClientPassword" />
      </label>
      <label>
        <span>マスターパスワード（確認用）</span>
        <input type="password" class="mp-input" placeholder="もう一度マスターパスワードを入力" v-model="vmClientPasswordConfirm" />
      </label>
      <button class="confirmation-button" @click="checkClientPassword">このマスターパスワードで続行します</button>
    </section>
    <section class="onetime-password" v-if="step === 'onetime-password'">
      <p>お使いのデバイスに表示されているワンタイムパスワードを入力してください</p>
      <p>お使いのデバイスを登録していない場合は、まず<router-link :to="{ name: 'Devices' }">このページ</router-link>から登録してください</p>
      <label>
        <span>ワンタイムパスワード</span>
        <input type="text" placeholder="6桁のコード" maxlength="6" class="otp-input" v-model="vmVerificationCode" />
      </label>
      <button class="confirmation-button" @click="checkOnetimePassword">確認</button>
    </section>
    <section class="verifying" v-if="step == 'verifying'">
      <LoadingSpinner m="ワンタイムパスワードを検証しています..." />
    </section>
    <section class="encrypting" v-if="step == 'encrypting'">
      <LoadingSpinner m="ファイルを暗号化しています..." />
    </section>
    <section class="success" v-if="step == 'success'">
      <p>ファイルの暗号化が完了しました</p>
      <button class="confirmation-button" @click="$router.push({ name: 'Home' })">ホームに戻る</button>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import api from '@/lib/api';
import FileSystem from '@/lib/file-system';
import SelectFileButton from '@/components/SelectFileButton.vue';
import SelectRecentFileButton from '@/components/SelectRecentFileButton.vue';
import CreateFileButton from '@/components/CreateFileButton.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import QRCode from '@/components/QRCode.vue';
const fs = new FileSystem();

export default {
  name: 'FileEncryptionView',
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
      serverPassword: null,
      vmClientPassword: '',
      vmClientPasswordConfirm: '',
      vmVerificationCode: '',
    };
  },
  computed: {
    ...mapGetters(['dataHandle', 'fileHandle']),
    head() {
      return this.dataHandle ? this.dataHandle.getHead() : null;
    }
  },
  methods: {
    checkClientPassword() {
      const cp = this.vmClientPassword.trim();
      const cpc = this.vmClientPasswordConfirm.trim();
      if (cp === '' || cpc === '') {
        this.$dialog.alert('マスターパスワードおよび確認用パスワードを両方入力してください');
        return;
      }
      if (cp !== cpc) {
        this.$dialog.alert('マスターパスワードと確認用パスワードが一致しません');
        this.vmClientPassword = '';
        this.vmClientPasswordConfirm = '';
        return;
      }
      if (cp.length < 4) {
        this.$dialog.alert('マスターパスワードは4文字以上で設定してください');
        this.vmClientPassword = '';
        this.vmClientPasswordConfirm = '';
        return;
      }
      this.step = 'onetime-password';
    },
    checkOnetimePassword() {
      const code = this.vmVerificationCode.trim();
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        this.$dialog.alert('有効な6桁のコードを入力してください');
        return;
      }
      this.step = 'verifying';
    },
    async verifyCode() {
      const token = this.vmVerificationCode.trim();
      const userNetInfo = await api.getNetInfo(); // ユーザのネットワーク情報を取得
      const result = await api.post(api.TOTP_VERIFICATION, {
        file_id: this.head.fileId,
        mode: 'encrypt',
        token,
        ip_address: userNetInfo.ip,
        region: userNetInfo.timezone,
      });
      if (result.status === 'error') {
        this.$dialog.alert(`ワンタイムパスワードの検証に失敗しました: ${result.message}`);
        this.step = 'onetime-password';
        this.vmVerificationCode = '';
        return;
      }
      this.serverPassword = result.server_password;
      this.step = 'encrypting';
      this.vmVerificationCode = '';
    },
    async encryptFile() {
      const password = this.vmClientPassword.trim() + this.serverPassword;
      try {
        // ファイルデータを暗号化
        const result = await this.dataHandle.export(password);

        // サーバーに暗号情報を登録
        let srvResult = null;
        do {
          srvResult = await api.post(api.KEYS_REGISTRATION, {
            file_id: this.head.fileId,
            iv_base64: result.ivBase64,
            salt_base64: result.saltBase64,
          });
        } while (srvResult.status !== 'success');

        // 完了したら書き込み
        const fsResult = fs.saveFile(this.fileHandle, result.xml);
        if (!fsResult) {
          this.$dialog.alert('ファイルの保存に失敗しました');
          this.step = 'initial';
          return;
        }
        this.step = 'success';
      } catch (error) {
        this.$dialog.alert(`ファイルの暗号化に失敗しました: ${error.message}`);
        this.step = 'initial';
      } finally {
        this.vmClientPassword = '';
        this.vmClientPasswordConfirm = '';
      }
    }
  },
  watch: {
    dataHandle() {
      this.step = 'confirmation';
    },
    step(to) {
      if (to === 'verifying') {
        this.verifyCode();
      }
      if (to === 'encrypting') {
        this.encryptFile();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.file-encryption-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.confirmation-button {
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
.mp-input {
  display: block;
  width: 100%;
  margin: 0.5rem 0 1rem 0;
  padding: 0.75rem;
  font-size: 1.2rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.otp-input {
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
</style>
