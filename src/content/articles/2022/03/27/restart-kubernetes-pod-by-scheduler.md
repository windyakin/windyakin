---
title: Kubernetes の Pod を定期的に再起動させる
date: 2022-03-27
tags:
  - Kubernetes
---

### イメージのバージョン管理面倒くさい問題を定期的な再起動で解決する

前回のエントリで [k3s を運用している話](https://windyakin.hateblo.jp/entry/2022/03/17/212009)を書いたが、 GitOps 運用の中で私はコンテナの Docker イメージのバージョン管理をサボっている。現状各アプリケーションのイメージはすべて `latest` のタグが振られているのみで、イメージを更新しても GitOps に使っている manifests のリポジトリを更新される仕組みも用意していない。

だけどもこれだと Pod が生きている限りイメージが更新されても Pod が使うイメージが変わらないままになっていまうので、 CronJob を使って Deployment で起動している Pod を定期的に再起動している。これに併せて `imagePullPolicy: Always` を指定しておけば、 Pod の再起動の度に最新のイメージを取ってくることができるという目論見である。

### ServiceAccount を用意する

ServiceAccount と (Cluster)Role と (Cluster)RoleBinding を用意する。自分は最初この3者の関係がよくわかっていなかったのだが、色々調べていくうちにでいうと Role と ServiceAccount の多対多の関係を表現する中間テーブルが RoleBinding であると理解した。要は Google の IAM 管理で行う「権限」のグループを作ってその権限をユーザに割り当てる行為と同じである。また Role / RoleBinding の頭に Cluster がついて ClusterRole や ClusterRoleBinding になると、その権限は namespace を超えて実行することができる。

まずは Role について。最終的に ServiceAccount が使えるようになる Kubernetes API を一覧にする。 kubectl コマンドで `kubectl [verbs] [resources]` が使えるようになるという理解が近い。ここに `apiGroups` という概念も登場する。 Pod は `apiVersion: v1` と表現されるが、この場合はコア機能であるので `""` (空文字) が指定される。一方 Deployment は `apiVersion: apps/v1` と指定するため `apps` を指定することになる。

```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: pod-restarter
rules:
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - get
      - list
      - delete
  - apiGroups:
      - apps
    resources:
      - deployments
    verbs:
      - get
      - list
```

次に ServiceAccount。特に凝ったことはしないのでそのまま名前をつけるだけ。

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pod-restarter
```

最後に Role と ServiceAccount を紐付ける RoleBinding を記述する。

```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: pod-restarter
subjects:
  - kind: ServiceAccount
    name: pod-restarter
    namespace: default
roleRef:
  kind: ClusterRole
  name: pod-restarter
  apiGroup: rbac.authorization.k8s.io
```

### CronJob を用意する

Pod を再起動させる方法は色々なあるが、 `delete pods` を定期的に実行されるようにした。これだとダウンタイムが出るが、自分が使うサービスなのでこのままにする。おそらく通常は Deployments の annotate に日付を入れると manifests の更新とともに Pod が再作成されるという方法をとることになるが、自分の環境は ArgoCD で即刻上書きされるので向いていないためこうした。

[bitnami/kubectl](https://hub.docker.com/r/bitnami/kubectl) のイメージ上から kubetl の `jsonpath` で Deployment の名前の一覧のみを出力し、その結果を xargs にパイプして `delete pods` を実行させるようにしている。

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pod-restarter
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Replace
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccount: pod-restarter
          restartPolicy: Never
          containers:
            - name: pod-restarter
              image: bitnami/kubectl:latest
              command: ["/bin/sh", "-c"]
              args:
                - |
                  kubectl get deployments -o=jsonpath='{range .items[*]}{.spec.template.metadata.labels.app}{"\n"}{end}' | xargs -I "{}" kubectl delete pods -l app={}
```

### 効果

いまのところ毎日深夜2時に再起動がかかる運用になっており、最長1日待てば最新のイメージが落とされるようになっている。普段は依存パッケージのセキュリティ更新しかしないためこの運用で問題なく感じている。

ただここまで紹介したのは結構な面倒くさがりの所業で、一般公開しているサービスなどでこれをするのは非常におすすめしない。一旦はこれで運用ができているのはあくまで個人の管理しているサービスだからである。
