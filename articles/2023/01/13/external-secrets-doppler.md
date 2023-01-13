---
title: External Secrets で Doppler を使っている
date: 2023-01-13
tags:
  - Kubernetes
---

### Sealed Secrets の運用の問題

Kubernetes で Secrets の管理というのは簡単そうで面倒なものの1つである。特に GitOps をしようとすると、 Secrets リソースをそのまま置いたりすることもできないので、何かしらの対応を考える必要があるのだが、自分の場合はこれまで Sealed Secrets を使って対応してきた。

- [Sealed Secrets](https://sealed-secrets.netlify.app/)
- [bitnami-labs/sealed-secrets - GitHub](https://github.com/bitnami-labs/sealed-secrets)

導入当初はこれで問題なく運用していたのだが、しばらくすると問題が浮き出てきた。

まず Secrets の内容を変更・追加したい場合のオペレーションが煩雑で（[できなくはないのだが](https://github.com/bitnami-labs/sealed-secrets#update-existing-secrets)）、何度かオペレーションミスを起こすことがあった。

また、自分の場合、運用している Kubernetes クラスタ複数あることも問題だった。 Sealed Secrets が暗号化・復号のために利用する秘密鍵は、基本的にクラスタごとに異なった鍵を用いるので、クラスタごとに異なる Sealed Secrets を保持する必要が出てきてしまう。

### Doppler との出会い

このような問題を解決できるのが External Secrets というもので、ざっくり言うと Secrets を外部サービスに保存して、クラスタに登録するのは外部サービスとの連携キーだけにしようという仕組みである。
 
- [External Secrets Operator](https://external-secrets.io/)
- [external-secrets/external-secrets - GitHub](https://github.com/external-secrets/external-secrets/)

1年ほど前に存在を知ってから、何度か移行しようと検討してきたのだが、「Secrets を保存する外部サービス」というのが問題で、 AWS や GCP が提供しているものは無料枠が限られており、特に保存したい Secrets の数で課金されるというのが、個人的に微妙なポイントだった。

そんなこんなで半年ぐらい手を出せずに居たのだが、最近 External Secrets のドキュメントにある「連携できるサービス」の一覧に Doppler というサービスが加わったことに気づいた。

- [Doppler | The #1 SecretOps Platform](https://www.doppler.com/)
- [Doppler - External Secrets Operator](https://external-secrets.io/v0.7.1/provider/doppler/)

聞き馴染みのないサービスだったのだが、調べてみると共同編集5ユーザまでなら基本機能が無料で、SLO等は保証されないものの、当然自分はホビーユースなのでそんなに気になる点でもないため、試しにフリーライドさせてもらうことにした。

### External Secrets の運用

Doppler の使い方そのものについては、既に色んな場所で紹介されていると思われるので割愛するが、環境(integration / staging / production)ごとに Secrets の値を別けて持てることから、まあそれなりに便利に使っている。

しかし、これにも1つだけ問題があって、「External Secrets のために Secrets が必要」という点で、先程述べた通り External Secrets が外部サービスの API に接続するために使う認証キーを Kubernetes クラスタ上に Secrets リソースで保持する必要があるのだ。

つまり、当初の目的である複数クラスタでの GitOps を実現したい場合だと、当初の問題と同じような問題に直面してしまうのである。

自分の場合は、 External Secrets 用の Secrets を Sealed Secrets にするという運用にしている。 Secrets の内容の更新の頻度より、クラスタの置き換えなどが発生する頻度のほうが明らかに少ないし、最悪でも External Secrets 用のキーを再発行・暗号化すればよいので、いくらかマシであるという判断だ。

釈然としないと思うが、そんな感じで今の所満足して運用している。

また時間が経てば別の問題を感じるようになるかもしれないので、その時はまた解決法を考えて記事を書こう。
