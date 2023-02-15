---
title: アプリケーションが依存している Ruby Gem の依存先に GitHub が指定されていても参照されない
date: 2023-02-16
tags:
  - Tips
---

### Ruby アプリケーションの依存先の参照指定

Ruby のアプリケーションだと、依存するライブラリ(Gem) を Gemfile に書くことが多いが、その際に [RubyGems.org](https://rubygems.org) ではなく、 GitHub の特定のブランチなどを指定してインストールする構文がある。

```ruby
# application/Gemfile
gem 'awesome_fluent_logger', github: 'windyakin/awesome_fluent_logger', branch: 'specific_branch'
```

こうすることで、プライベートリポジトリを参照させたり、 Fork して独自の対応をしたコードなどを読み込ませて、アプリケーションを稼働させることが可能になる。

### では Gem 自身の依存はどう表現されるか

一方で、参照される Gem 側にも依存する Gem が存在する。そういった情報は gemspec というファイルに書くことになっている。

`Gem::Specification#add_dependencies` は依存する Gem のバージョンを細かく指定できるが、 Gemfile のように「GitHub のリポジトリなどを指定する」といった情報は書くことができない。

ではこのとき、どうするかというと、 Gem 側にも Gemfile が存在するので、そこにアプリケーションと同じ構文で指定することによって、読み込み先を変更することができる。

```ruby
# example/example.gemspec
spec.add_dependency 'fluent-logger', '~> 0.9'
```

```ruby
# example/Gemfile
source "https://rubygems.org"

gemspec

gem 'fluent-logger', github: 'windyakin/fluent-logger', branch: 'specific_branch'
```

この状態で、 Gem の開発環境上で `bundle install` などを実行すれば、 Git リポジトリから落としてきたコードを利用することができるようになる。

### 参照しているアプリケーション上ではどうなるのか

一方、この指定は Gem として読び出しているアプリケーション側に継承されることはなく、 `bundle install` をしても RubyGems.org から該当する名前の Gem とバージョンを参照してくるようになっている。

わかりにくいので、下記のような関係の場合において考えてほしい。

```plain
Application (A) -> Example Gem (B) -> Dependency Gem (C)
```

例えば Example Gem (B) が依存する Dependency Gem (C) の参照先を GitHub に向けたいとする。

このとき、 Example Gem (B) の Gemfile に Dependency Gem (C) の参照先として GitHub を記述しても、 Application (A) はその情報を読み取ることはなく、 RubyGems.org にある Dependency Gem (C) を参照するようになっている。

もし、 Dependency Gem (C) の参照先を GitHub に変更したい場合は、 Application (A) 側の Gemfile 上で Dependency Gem (C) の参照先を記述するとよい。アプリケーション側で直接利用していなくても、こうすることで解決することができる。

```ruby
# application/Gemfile
gem 'awesome_fluent_logger'
gem 'fluent-logger', github: 'windyakin/fluent-logger', branch: 'specific_branch'
```

### 参考にした情報

- [Gem::Specification#add_dependency (Ruby 3.2 リファレンスマニュアル)](https://docs.ruby-lang.org/ja/latest/method/Gem=3a=3aSpecification/i/add_dependency.html)
- [gemspecの依存先にGitHubのプライベートリポジトリを指定する - タケユー・ウェブ日報](https://blog.takeyuweb.co.jp/entry/2014/10/16/163113)
