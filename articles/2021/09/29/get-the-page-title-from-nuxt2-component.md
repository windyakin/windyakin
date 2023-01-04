---
title: Nuxt2でコンポーネントから今表示しているページのタイトル要素を取りたいとき
date: 2021-09-29
tags: Tips
---

Nuxt2 でコンポーネントから今表示しているページのタイトル要素を取りたいケースがある。

具体的に言うと Twitter のツイートボタンを自前で実装するときに使えるリンク形式でツイートを発行できる機能があり、このツイートするテキスト部分ににページのタイトルを含めたかった。

```text
https://twitter.com/intent/tweet?url=[ツイートしたいURL]&text=[タイトルを含むテキスト]
```

このとき、 Nuxt のコンポーネント側からタイトルを知る方法として一番最初に思いつくのは `document.title` という JavaScript の古典的な API である。

```javascript
export default {
  data() {
    return { pageTitle: '' }
  },
  mounted() {
    this.pageTitle = document.title
  }
}
```

これは確かに最初に表示したページやコンポーネントがロードされたタイミングのページのタイトルを取得することはできるが、 Nuxt 内に `<nuxt-link>` のを含んでいて、遷移の際にコンポーネントがそのまま表示され続けるような場合は値の変更がされない。考えてみれば「それはそう」だし。単純に自分の想定があまい。

じゃあページ変更をトリガーすれば良いんだろうということで、 `$route` を `watch` によって監視することでページ遷移のタイミングで `document.title` を取得し直せばよいのだろうということでこういうコードを書いた。

```javascript
export default {
  data() {
    return { pageTitle: '' }
  },
  mounted() {
    this.pageTitle = document.title
  },
  watch: {
    $route(newValue) {
      this.pageTitle = document.title
    }
  }
}
```

しかしこれもうまく行かなかった。たしかに `watch.$route` はページ遷移のときに通っていくのだが、このタイミングで `document.title` を叩いても返ってくるのは遷移前のページのタイトルなのである。つまり `document.title` が変更される前にここを通っているため、ページ遷移をすると1ページ前に見ていたタイトルしか取得できないように見える。

最終的に StackOverflow でこういう記事を見つけた。

[javascript - Add a watcher to document.title in Nuxt.Js - Stack Overflow](https://stackoverflow.com/questions/57287500/add-a-watcher-to-document-title-in-nuxt-js)

記事内のコードに書いてあるとおりで、HTML DOM を監視する JavaScript API である `MutationObserver` を使って `<title>` タグを監視して更新するといったもの。

書いてみるとまあ確かに動く（単純に Mutation Observer を使っているだけなので）。


```javascript
export default {
  data() {
    return { pageTitle: '' }
  },
  mounted() {
    this.pageTitle = document.title
    new MutationObserver(() => {
      this.pageTitle = document.title
    }).observe(document.querySelector('title'), { childList: true })
  }
}
```

動いたのはいいが、なんだかもやもやするコードである。本当は上位から表示しているページのタイトルの内容を通知するといいのだろうが、 layout に埋め込まれているコンポーネントの場合、そのデータのやりとりが若干ややこしくなってしまう。正直ページタイトルを取得するためにそこまでやりたくはないし、こういうユースケースはよくありそうなので、できれば Nuxt 側で取れるようになってほしいなと思った。
