---
title: 右クリックしたリンクのURLをAPIに送信するためのブラウザ拡張機能「かんかんみかん」を作りました
date: 2022-05-14
tags:
  - つくった
---

ブラウザでリンクを右クリックしたときに、そのリンクのURLを特定のAPIエンドポイントへPOSTデータとして送信することができるブラウザ拡張機能を作った。

- [かんかんみかん - Chrome ウェブストア](https://chrome.google.com/webstore/detail/%E3%81%8B%E3%82%93%E3%81%8B%E3%82%93%E3%81%BF%E3%81%8B%E3%82%93/lnbmaedapefpogdjkjgliaaoglebeiil)
- [かんかんみかん – 🦊 Firefox (ja) 向け拡張機能を入手](https://addons.mozilla.org/ja/firefox/addon/kankan-mikan/)

この拡張機能は、前々から筆者が Twitter の投稿のブックマークを目的として作成した Cloud Functions のエンドポイントに URL を送信するために使っていたものを、 API エンドポイントの指定や、 POST する JSON のフォーマットをテンプレートで設定できるようにすることで、一般にも利用しやすくすることで公開したものである。

現時点で公開している最新版 v2.0.0 で設定できる項目は以下の通り。

- Post URL
    - リクエスト送信先のURL
- Content-type
    - `application/json` と `application/x-www-form-urlencoded` から選べる
- Post data template
    - 送信する Body とする JSON のテンプレート
    - `{{ "{{{ url }}}" }}` が右クリックで選択しているリンクのURLに展開される
- Fillter (Regexp)
    - 右クリックで選択したリンクのURLが正規表現に当てはまらなかった場合にリクエストを送信しないようにすることができる

これらの機能は、自分が使うために必要最低限の機能として実装したもので、若干高度なオプション設定が多く、作りとしても粗雑なことは否めないので、ぜひ使ってくださいとも言いづらいが、例えばブックマークサービスのAPIエンドポイントにURLを送信するとか、何らかの開発に役立てることができればと思う。

GitHub にスクリプトも公開してあるので、必要であれば参照してほしい。

- [napple-team/kankan-mikan: 从c*・ヮ・§](https://github.com/napple-team/kankan-mikan)

最後に愚痴になるのだが、2022年5月現在ブラウザ拡張機能を取り巻く環境は正直言って微妙で、ほんの少し前まで Chrome と Firefox で共通のプログラムで管理できていたのだが、 Chrome Web Store が Google の利益を目的として Chromium が独自に提唱している Manifest V3 という新しいフォーマットでしか新たな拡張機能の投稿を受け付けなくなってしまった。これのせいで Firefox とまた道を分かつことになってしまっており、そのために2つのブラウザの差分を吸収するように別々のスクリプトを管理することになっているので、煩わしさがすごい。

今回作った拡張機能はまだ Manifest V3 の変更による影響を受ける箇所は少なかったが、今後様々な拡張機能がこういった対応をしなければならないと思うと、なかなか大変そうな話だと思う。
