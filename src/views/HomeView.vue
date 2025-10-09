<template>
  <div class="home">
    <nav>
      <ul>
        <li><router-link :to="{ name: 'PasswordGenerator' }">パスワード生成</router-link></li>
        <li><router-link :to="{ name: 'FileViewer' }">ファイル表示</router-link></li>
        <li><router-link :to="{ name: 'FileEditor' }">ファイル編集</router-link></li>
        <li><router-link :to="{ name: 'Settings' }">アプリケーション設定</router-link></li>
      </ul>
    </nav>
  </div>
</template>