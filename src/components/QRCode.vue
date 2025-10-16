<template>
  <div class="qr-code">
    <VueQRCode :value="text" :options="option" tag="img"></VueQRCode>
  </div>
</template>

<script>
import VueQRCode from '@chenfengyuan/vue-qrcode';

export default {
  components: {
    VueQRCode,
  },
  props: {
    text: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      option: {
        errorCorrectionLevel: 'M',
        maskPattern: 0,
        margin: 5,
        scale: 2,
        width: 300,
        color: {
          dark: '#000000FF',
          light: '#FFFFFFFF'
        },
      },
    };
  },
};
</script>