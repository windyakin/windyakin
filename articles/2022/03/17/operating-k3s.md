---
title: k3s を運用している
date: 2022-03-17
tags:
  - Kubernetes
---

個人的なプロジェクトを外部公開するときや、私的なツール郡を動かすためにVPSを借りている。基本的に自分が作ったサービスたちはコンテナ化されているため、それらのコンテナの起動管理についてはこれまで docker-compose を使っていた。しかし業務で Kubernetes を使う機会が多くなり、コンテナや Kubernetes の運用に関するいろいろな知見も溜まってきたので、自前で Kubernetes のクラスタが欲しくなったのだが、趣味にしては維持費が高い。正直そこまで可用性が必要もないが、 ArgoCD で GitOps による自動デプロイとかそういう楽なことだけはしたいという欲が湧いてきたので、 k3s をつかってシングルノードの Kubernetes を運用することにした。この記事ではその際どういったことをしたかなどをまとめる。

### k3s のインストール

おもむろに k3s をいれるが、ワン・コマンドで入れられるので便利。なんならアップグレードもこれでできるのですごい。

```bash
curl -sfL https://get.k3s.io | sh -
```

ただしこのままだと `kubectl` を叩く度に `sudo` が必要になるので面倒。もう少しよしなにしたい。 Linuxbrew で入れた `kubectl` で使えるようにするために、 `~/.kube/config` に接続設定を含めて出せばいちいち `sudo` しなくてもよくなる（セキュリティはパーミッションなど最低限のことはやったほうがよい）。

```bash
sudo kubectl config view --raw > ~/.kube/config
```

### SealedSecret

Git で Kubernetes の Manifests を管理するとき、 Secret をそのままコミットすると危険なのだが、 SealedSecret を使うことで暗号化した状態にできる。暗号化を行うために一度クラスタに Secret を読み込ませる必要があったり、情報の更新が若干面倒というデメリットもあるが、そのあたりは GitOps したい度とのトレードオフだろう。

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/${VERSION}/controller.yaml
```

`${VERSION}` は SealedSecret のリポジトリの最新を使うとよい。

Secret 情報の暗号化は `kubeseal` コマンドを使って行う。Secret の manifests が用意できていれば以下のようなコマンドを実行する。

```bash
kubeseal --scope namespace-wide -o yaml < secret.yaml > sealedsecret.yaml
```

### ArgoCD

GitOps のために ArgoCD を入れる。 core-install.yaml はコア機能のみで Web UI などはインストールされない。

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/core-install.yaml
```

初めて触れるなら Web UI はあったほうがよさそうに思う。リソースの管理がどういうものかとか、更新のタイミングなども見ることができるので面白い。

ArgoCD の使い方は公式のドキュメントが一番くわしい。

[Getting Started - Argo CD - Declarative GitOps CD for Kubernetes](https://argo-cd.readthedocs.io/en/stable/getting_started/)

CLI で操作する場合は `argocd` コマンドなどを導入すると GitOps につかうリポジトリの登録や、実際のアプリケーションの設定などがコマンドからできて便利。

```bash
argocd repo add git@github.com:windyakin/k8s-manifests.git --ssh-private-key-path ${SSH_PRIVATE_KEY_PATH}
```

```bash
argocd app create argocd-applications \
  --repo git@github.com:windyakin/k8s-manifests.git \
  --path argocd-application \
  --auto-prune \
  --dest-namespace default \
  --dest-server https://kubernetes.default.svc \
  --revision HEAD
```

### k3s 運用してみてどうか

もともとは microk8s を導入していたのだが、どういうわけか liveness probe を入れたあたりから Kubernetes  の API が重くなってしまい、 kubectl すらまともに使えなくなってしまったため、 k3s に乗り換えたという経緯があった。 コンテナを立てて運用する程度であれば k3s の機能でも十分であり、 microk8s に比べるとオーバーヘッドも少なく助かっているところではある。

またもともとやりたかった GitOps による運用ができたのも楽でよい。基本的にほったらかしで、監視等も入れていないのだが、不自然な挙動などはなく正常にうごいている。ただ貧弱なサーバーのシングルノードなので可用性の向上や、スケーリングといった恩恵は受けることは出来ない。 Kubernetes の美味しいところを知っていてそれにあやかりたい場合は、趣味の割り切りとして使ってよいのではないだろうか。
