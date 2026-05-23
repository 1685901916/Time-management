# 部署说明

本项目使用 GitHub Actions 通过 SSH 部署到宝塔/VPS 服务器。

## GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions -> Repository secrets` 配置：

```text
SERVER_HOST=38.76.169.35
SERVER_USER=root
SERVER_PATH=/www/wwwroot/t.ayano29.cn
SERVER_SSH_KEY=完整 SSH 私钥
```

`SERVER_SSH_KEY` 必须是完整私钥，不是公钥、宝塔密码或 root 密码：

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

## 服务器初始化

在服务器 root 终端执行：

```bash
mkdir -p /root/.ssh
ssh-keygen -t ed25519 -f /root/.ssh/github_actions_time_management -C "github-actions-time-management" -N ""
cat /root/.ssh/github_actions_time_management.pub >> /root/.ssh/authorized_keys
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
chmod 600 /root/.ssh/github_actions_time_management
cat /root/.ssh/github_actions_time_management
```

把最后输出的私钥完整填到 `SERVER_SSH_KEY`。

## 开启 SSH 公钥登录

如果 Actions 日志出现：

```text
Permission denied (gssapi-keyex,gssapi-with-mic,password)
```

并且没有 `publickey`，说明服务器没有允许公钥登录。检查并修改：

```bash
grep -nE '^(PubkeyAuthentication|AuthorizedKeysFile|PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config
```

确保配置包含：

```text
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitRootLogin yes
```

然后重启 SSH：

```bash
sshd -t
systemctl restart sshd || systemctl restart ssh
```

不要关闭当前 FinalShell 窗口，先开一个新窗口确认还能登录。

## 部署目录

宝塔站点根目录是：

```text
/www/wwwroot/t.ayano29.cn
```

Actions 会把应用代码部署到：

```text
/www/wwwroot/t.ayano29.cn/app
```

这样不会覆盖站点根目录原有的 `.well-known`、`index.html`、`assets`、`backups` 等文件。

## 部署流程

推送到 `main` 后：

1. GitHub Actions 读取 Secrets。
2. 生成临时 SSH key 文件并验证 fingerprint。
3. 使用 SSH 登录服务器。
4. clone 或更新 `/www/wwwroot/t.ayano29.cn/app`。
5. 执行 `npm ci`、`npm run lint`、`npm test`、`npm run build`。
6. 使用 PM2 启动或重启 `time-management`。

## 当前已确认的问题

最近失败日志显示：

```text
key_line_count=8
key_fingerprint=256 SHA256:EWe4nM5SOAqws1Qe4fXA5MSX//VsYQavgi3jRMHCGNU github-actions-time-management (ED25519)
Permission denied (gssapi-keyex,gssapi-with-mic,password)
```

这表示 GitHub Secret 中的私钥格式是有效的，但服务器拒绝公钥登录。优先检查 `/etc/ssh/sshd_config` 是否启用了 `PubkeyAuthentication yes`，以及 `/root/.ssh/authorized_keys` 是否包含对应 `.pub` 公钥。

## 安全提醒

私钥一旦截图或发到聊天里，就按泄露处理。部署跑通后，重新生成一把 key，更新 `authorized_keys` 和 `SERVER_SSH_KEY`，再删除旧 key。
