# Git 版本管理流程

## 分支策略

```
main              ← 稳定的代码，永远可部署
  └─ feat/xxx     ← 开发某个功能（登录 / 聊天 / 微信登录等）
```

- 每做一个新功能就开一个分支
- 功能做完测试没问题再合并回 main
- main 永远是能正常运行的

---

## 日常流程

### 第 1 天：开分支，开始写代码

```bash
# 确保 main 是最新的
git checkout main
git pull

# 创建新分支（比如做登录功能）
git checkout -b feat/login

# 写代码... 下班前提交
git add .
git commit -m "feat: 登录页面 UI 完成"

# 推送到远程仓库
git push origin feat/login
```

### 第 2 天：继续在同一个分支写

```bash
# 切回分支
git checkout feat/login

# 写代码... 下班前提交
git add .
git commit -m "feat: 登录接口对接完成"

# 推送
git push origin feat/login
```

### 功能完成后：合并回 main

```bash
# 切到 main
git checkout main
git pull

# 合并功能分支
git merge feat/login

# 推送到远程
git push origin main

# 删除本地分支（可选）
git branch -d feat/login

# 删除远程分支（可选）
git push origin --delete feat/login
```

---

## 写错了，怎么回滚

### 还没提交，想撤销文件修改

```bash
# 放弃单个文件的修改
git checkout -- 文件名

# 放弃所有未暂存的修改
git restore .
```

### 刚提交了（还没 push），想撤回

```bash
# 保留修改内容，只撤销提交
git reset --soft HEAD~1

# 连修改一起丢掉（慎用！）
git reset --hard HEAD~1
```

### 已经 push 到远程了，想撤回

```bash
# 本地回退
git reset --soft HEAD~1

# 强制推送到远程（覆盖远程记录）
git push origin feat/login --force
```

### 合并到 main 之后发现有问题

```bash
# 回退到合并前的版本
git revert HEAD

# 或者找到合并前的 commit，直接回去
git log --oneline
git revert <合并前的commit-hash>..HEAD
```

### 分支删了，想找回代码

```bash
# 查看所有操作记录（包括已删除的分支）
git reflog

# 找到想要的那个 commit id，开新分支捡回来
git checkout -b recover-login <commit-id>
```

---

## 命名规范

| 类型 | 例子 |
|------|------|
| 新功能 | `feat/login`、`feat/chat`、`feat/wechat-login` |
| 修 bug | `fix/login-error`、`fix/crash-on-empty` |
| 重构 | `refactor/db-layer` |

提交信息格式：
```
feat: 登录接口完成
fix: 修复空用户名时报错
refactor: 抽离数据库连接层
```
