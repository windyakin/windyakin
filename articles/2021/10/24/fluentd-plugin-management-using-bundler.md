---
title: Fluentd で使いたい Gem の依存関係の解決は Bundler に任せられる
date: 2021-10-24
tags:
  - Tips
---

Fluentd は Gem によるライブラリの追加ができて、例えばログを直接 BigQuery に転送したいのであれば [fluent-plugin-bigquery](https://github.com/fluent-plugins-nursery/fluent-plugin-bigquery) のような Gem をインストールしておくことによってそれを実現することができる。

こういったプラグインを追加するコマンドとして提供されているのが `fluent-gem` というコマンドで、例えば先程挙げた Gem をインストールしたいのであれば

```shell
fluent-gem install fluent-plugin-bigquery

```

のようにコマンドを叩けば Gem をインストールしてくれる。こういった Fluentd 向けのプラグインは rubygems.org にて様々提供されているので、使っているうちにあれもこれもと追加したくなるのだが、徐々にパッケージの依存関係がややこしくなっていき、最終的に人間による依存関係の解決はできなくなってしまう。

### Fluentd でも Bundler が使える

Fluentd で使う Gem をインストールするためには `fluent-gem` という特別なコマンドを使うので、コマンドの裏ではさぞ特殊なことをやっているのだろうと思ったのだが、ソースコードを見るとそんなことはなく、ただ単純に Gem をインストールしているだけのようだった。

[fluentd/fluent-gem at master · fluent/fluentd](https://github.com/fluent/fluentd/blob/master/bin/fluent-gem)

また Fluentd の起動オプションには Gemfile を読み込ませる `--gemfile` オプションがあり、これで指定した Gemfile を使って起動時に Bundler が Gem をインストールしてプラグインが使えるようになる。

[Plugin Management - Fluentd](https://docs.fluentd.org/deployment/plugin-management#gemfile-option)

つまり Fluentd においても Gem の依存関係の解決は Bundler に一任することができるようになっている。

### Dockerfile にしてみる

例えば [fluent-plugin-bigquery](https://github.com/fluent-plugins-nursery/fluent-plugin-bigquery) と [fluent-plugin-google-cloud](https://github.com/GoogleCloudPlatform/fluent-plugin-google-cloud) を同時に使いたい場合、このような Gemfile を書くことになる。

```ruby
source "https://rubygems.org"

gem 'fluentd', '~> 1.13.x'
gem 'fluent-plugin-bigquery', '~> 2.2.x'
gem 'fluent-plugin-google-cloud', '~> 0.12.x'
```

Dockerfile ではビルド時に `bundle install` しておくことをおすすめする。 Fluentd の起動時にも `bundle install` は実行されるが、 Gem のインストール時に必要なネイティブライブラリなどは予め用意しておく必要があるからである。また Fluentd の公式イメージである [fluent/fluentd](https://hub.docker.com/r/fluent/fluentd/) をベースイメージとする際は、実行ユーザーが `fluent` になっているため、 `apt-get install` などを実行するのであれば予め `root` を指定する必要がある。ただし `bundle install` の実行ユーザーは `fluent` になっているほうがファイルの権限管理などに面倒がない。

```dockerfile
FROM fluent/fluentd:v1.13-debian

COPY Gemfile Gemfile.lock /fluentd/etc/

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

USER fluent

RUN cd /fluentd/etc \
  && bundle install -j8 --path vendor/bundle

CMD [ "fluentd", "--gemfile", "/fluentd/etc/Gemfile" ]
```

また、このとき Gemfile.lock をどう用意するかも考える必要があるが、一度 Gemfile.lock なしでビルドしたイメージから `docker cp` などを使って `/fluentd/etc/` 以下にある Gemfile.lock を取り出すと一応用意することができる。

```shell
% docker build -t fluentd .
% docker run --rm -d --name fluentd fluentd tail -f /dev/null
% docker cp fluentd:/fluentd/etc/Gemfile.lock .
% docker kill fluentd
```

ここまでの流れをサンプルリポジトリにまとめたので参考までに。

[windyakin/fluentd-plugin-gemfile-sample](https://github.com/windyakin/fluentd-plugin-gemfile-sample)
