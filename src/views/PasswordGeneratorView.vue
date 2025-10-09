<template>
  <div class="password-generator">
    <h1>パスワード生成</h1>

    <div class="settings-grid">
      <div class="setting-card">
        <h2>パスワード強度</h2>
        <select v-model="strength" @change="applyStrengthPreset">
          <option value="custom">カスタム</option>
          <option value="recommended">推奨</option>
          <option value="strong">強力</option>
          <option value="super-strong">最強</option>
        </select>
      </div>

      <div class="setting-card">
        <h2>使用文字</h2>
        <div class="checkbox-group">
          <label
            ><input
              type="checkbox"
              v-model="useUppercase"
              @change="switchToCustom"
            />
            大文字 (A-Z)</label
          >
          <label
            ><input
              type="checkbox"
              v-model="useLowercase"
              @change="switchToCustom"
            />
            小文字 (a-z)</label
          >
          <label
            ><input
              type="checkbox"
              v-model="useNumbers"
              @change="switchToCustom"
            />
            数字 (0-9)</label
          >
          <label
            ><input
              type="checkbox"
              v-model="useSymbols"
              @change="switchToCustom"
            />
            記号</label
          >
        </div>
      </div>

      <div class="setting-card">
        <h2>パスワード長: {{ passwordLength }}</h2>
        <input
          type="range"
          min="4"
          max="64"
          v-model.number="passwordLength"
          @input="switchToCustom"
          class="slider"
        />
      </div>

      <div class="setting-card">
        <h2>生成するパスワードの個数</h2>
        <input type="number" min="1" max="100" v-model.number="passwordCount" />
      </div>

      <div class="setting-card">
        <h2>オプション</h2>
        <div class="checkbox-group">
          <label
            ><input
              type="checkbox"
              v-model="avoidSimilar"
              @change="switchToCustom"
            />
            似通った英数字を使わない (I, l, 1, O, 0など)</label
          >
          <label
            ><input
              type="checkbox"
              v-model="noDuplicates"
              @change="switchToCustom"
            />
            同じ文字は使わない</label
          >
        </div>
      </div>
    </div>

    <div class="symbols-settings" v-if="useSymbols">
      <h2>使用する記号</h2>
      <div class="symbol-buttons">
        <button @click="setSymbols('none')">使用しない</button>
        <button @click="setSymbols('recommended')">推奨</button>
        <button @click="setSymbols('restricted')">制限された記号</button>
        <button @click="setSymbols('all')">全て</button>
      </div>
      <div class="symbols-grid">
        <label v-for="symbol in symbols" :key="symbol.char">
          <input
            type="checkbox"
            v-model="symbol.checked"
            @change="switchToCustom"
          />
          {{ symbol.char }}
        </label>
      </div>
    </div>

    <button class="generate-button" @click="generatePasswords">生成</button>
    <div class="recent-buttons" v-if="hasRecentPasswords">
      <button class="set-recent-button" @click="setRecentPasswords">最近生成したパスワードをリストに表示</button>
      <button class="clear-recent-button" @click="clearRecentPasswords">削除</button>
    </div>

    <div class="results" v-if="generatedPasswords.length > 0">
      <h2>生成されたパスワード</h2>
      <ul>
        <li v-for="(password, index) in generatedPasswords" :key="index">
          <ActionBox :text="password">
            <IconFloppyDisk @click="savePassword(index)" />
          </ActionBox>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Database from '@/lib/database';
const db = new Database();
import ActionBox from '@/components/ActionBox.vue';
import IconClipboard from '@/components/icons/IconClipboard.vue';
import IconFloppyDisk from '@/components/icons/IconFloppyDisk.vue';

export default {
  name: 'PasswordGeneratorView',
  components: {
    ActionBox,
    IconClipboard,
    IconFloppyDisk,
  },
  data() {
    return {
      strength: 'recommended',
      useUppercase: true,
      useLowercase: true,
      useNumbers: true,
      useSymbols: true,
      passwordLength: 12,
      passwordCount: 5,
      avoidSimilar: false,
      noDuplicates: false,
      symbols: this.getInitialSymbols(),
      generatedPasswords: [],
      hasRecentPasswords: false,
    };
  },
  methods: {
    getInitialSymbols() {
      const allSymbolChars = '!"@#$\'%^&*/()_+-={}`[]|;:,~.<>?';
      return allSymbolChars.split('').map((char) => ({ char, checked: false }));
    },
    // 強度プリセットを適用
    applyStrengthPreset() {
      switch (this.strength) {
        case 'recommended':
          this.useUppercase = true;
          this.useLowercase = true;
          this.useNumbers = true;
          this.useSymbols = true;
          this.passwordLength = 12;
          this.avoidSimilar = true;
          this.noDuplicates = false;
          this.setSymbols('restricted', true);
          break;
        case 'strong':
          this.useUppercase = true;
          this.useLowercase = true;
          this.useNumbers = true;
          this.useSymbols = true;
          this.passwordLength = 16;
          this.avoidSimilar = false;
          this.noDuplicates = false;
          this.setSymbols('all', true);
          break;
        case 'super-strong':
          this.useUppercase = true;
          this.useLowercase = true;
          this.useNumbers = true;
          this.useSymbols = true;
          this.passwordLength = 32;
          this.avoidSimilar = false;
          this.noDuplicates = false;
          this.setSymbols('all', true);
          break;
      }
    },
    // 設定変更時に強度をカスタムに切り替え
    switchToCustom() {
      this.strength = 'custom';
    },
    // 記号のチェック状態を一括設定
    setSymbols(type, fromPreset = false) {
      // 第2引数を追加
      const recommendedSymbols = '!@#%&*/()_+-=:.?';
      const restrictedSymbols = '!@#&_-=?';

      this.symbols.forEach((symbol) => {
        switch (type) {
          case 'none':
            symbol.checked = false;
            break;
          case 'recommended':
            symbol.checked = recommendedSymbols.includes(symbol.char);
            break;
          case 'restricted':
            symbol.checked = restrictedSymbols.includes(symbol.char);
            break;
          case 'all':
            symbol.checked = true;
            break;
        }
      });

      // プリセット適用時でなければ、強度をカスタムに切り替え
      if (!fromPreset) {
        this.switchToCustom();
      }
    },
    // パスワード生成ロジック
    async generatePasswords() {
      this.generatedPasswords = [];
      const charSets = this.buildCharSets();

      if (charSets.base.length === 0) {
        this.$dialog.alert('使用する文字種を1つ以上選択してください。');
        return;
      }

      for (let i = 0; i < this.passwordCount; i++) {
        let password = '';
        let availableChars = charSets.base;

        // 各文字種から最低1文字は含める
        charSets.guaranteed.forEach((char) => {
          password += char;
        });

        // 残りの文字を生成
        for (let j = password.length; j < this.passwordLength; j++) {
          if (this.noDuplicates) {
            availableChars = availableChars.filter(
              (c) => !password.includes(c)
            );
          }
          if (availableChars.length === 0) break; // 使える文字がなくなったら終了

          const randomIndex = Math.floor(Math.random() * availableChars.length);
          password += availableChars[randomIndex];
        }

        // 文字列をシャッフルして最終的なパスワードを生成
        this.generatedPasswords.push(this.shuffleString(password));
        await db.setState('recent_passwords', JSON.parse(JSON.stringify(this.generatedPasswords)));
        this.hasRecentPasswords = true;
      }
    },
    // 使用する文字セットを構築
    buildCharSets() {
      let baseChars = '';
      const guaranteedChars = [];

      const sets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: this.symbols
          .filter((s) => s.checked)
          .map((s) => s.char)
          .join(''),
      };

      if (this.avoidSimilar) {
        const similarChars = /[Il1O0]/g;
        sets.uppercase = sets.uppercase.replace(similarChars, '');
        sets.lowercase = sets.lowercase.replace(similarChars, '');
        sets.numbers = sets.numbers.replace(similarChars, '');
      }

      if (this.useUppercase && sets.uppercase) {
        baseChars += sets.uppercase;
        guaranteedChars.push(
          sets.uppercase[Math.floor(Math.random() * sets.uppercase.length)]
        );
      }
      if (this.useLowercase && sets.lowercase) {
        baseChars += sets.lowercase;
        guaranteedChars.push(
          sets.lowercase[Math.floor(Math.random() * sets.lowercase.length)]
        );
      }
      if (this.useNumbers && sets.numbers) {
        baseChars += sets.numbers;
        guaranteedChars.push(
          sets.numbers[Math.floor(Math.random() * sets.numbers.length)]
        );
      }
      if (this.useSymbols && sets.symbols) {
        baseChars += sets.symbols;
        guaranteedChars.push(
          sets.symbols[Math.floor(Math.random() * sets.symbols.length)]
        );
      }

      return { base: baseChars.split(''), guaranteed: guaranteedChars };
    },
    // 文字列をシャッフル
    shuffleString(str) {
      const arr = str.split('');
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join('');
    },
    async setRecentPasswords() {
      const recent = await db.getState('recent_passwords') || [];
      if (recent.length !== 0) this.hasRecentPasswords = true;
      this.generatedPasswords = recent;
    },
    async clearRecentPasswords() {
      if (await this.$dialog.confirm('生成したパスワードを削除すると、元には戻せません. よろしいですか?')) {
        this.generatedPasswords = [];
        await db.setState('recent_passwords', []);
        this.hasRecentPasswords = false;
      }
    },
    savePassword(idx) {
      const targetPass = this.generatedPasswords[idx];
      this.$store.commit('setPassword', targetPass);
      this.$router.push({ name: 'SavePassword' });
    },
  },
  // 初期化時にプリセットを適用
  async mounted() {
    this.applyStrengthPreset();
    const recent = await db.getState('recent_passwords') || [];
    if (recent.length !== 0) this.hasRecentPasswords = true;
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as var;

.password-generator {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: sans-serif;
  color: #333;

  h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 2rem;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.setting-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

  h2 {
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  label {
    display: flex;
    align-items: center;
    cursor: pointer;
    input {
      margin-right: 0.5rem;
    }
  }
}

select, input[type='number'] {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
  box-sizing: border-box;
}

.slider {
  width: 100%;
}

.symbols-settings {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

  .symbol-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    button {
      padding: 0.5rem 1rem;
      border: 1px solid #007bff;
      background-color: #fff;
      color: #007bff;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background-color: #007bff;
        color: #fff;
      }
    }
  }

  .symbols-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
    gap: 0.75rem;

    label {
      font-family: var.$ff-code;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border: 1px solid #eee;
      border-radius: 4px;
      cursor: pointer;

      input {
        margin-right: 0.5rem;
      }
    }
  }
}

.generate-button {
  display: block;
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  background-color: var.$button-color;
  border: none;
  border-radius: 8px;
  margin-bottom: 2rem;
  @include var.buttonAnimation;

  &:hover {
    background-color: var.$button-hovered-color;
  }
}

.recent-buttons {
  display: flex;
  gap: 1rem;
  .set-recent-button {
    width: 80%;
    padding: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    background-color: #28a745;
    border: none;
    border-radius: 8px;
    margin-bottom: 2rem;
    @include var.buttonAnimation;

    &:hover {
      background-color: #218838;
    }
  }
  .clear-recent-button {
    width: 20%;
    padding: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    background-color: #28a745;
    border: none;
    border-radius: 8px;
    margin-bottom: 2rem;
    @include var.buttonAnimation;

    &:hover {
      background-color: #218838;
    }
  }
}
</style>