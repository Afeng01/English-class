# 快速部署指南

## 📋 部署前检查清单

在推送到GitHub之前，请确认：

- [x] ✅ 已创建项目根目录 `.gitignore`
- [x] ✅ 已更新 `frontend/.gitignore` 保护环境变量
- [x] ✅ 已修改 `backend/main.py` 使用环境变量配置CORS
- [x] ✅ 已修改 `frontend/src/services/api.ts` 支持环境变量配置API地址
- [ ] ⚠️ 确认 `frontend/.env.local` 不会被提交（已在.gitignore中）
- [ ] ⚠️ 确认 `backend/.env` 不会被提交（已在.gitignore中）

## 🚀 部署步骤概览

### 1️⃣ 推送到GitHub（5分钟）

```bash
# 初始化Git（如果还没有）
git init

# 添加所有文件
git add .

# 检查将要提交的文件（确保没有敏感信息）
git status

# 创建首次提交
git commit -m "feat: 初始提交 - 英语分级阅读应用"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/english-reading-app.git

# 推送到GitHub
git push -u origin main
```

### 2️⃣ 部署前端到Vercel（20分钟）

1. 访问 [vercel.com](https://vercel.com) 并用GitHub登录
2. 点击"Add New" → "Project"
3. 选择你的仓库
4. **重要配置**：
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **环境变量配置**（在Vercel项目设置中）：
   ```env
   VITE_SUPABASE_URL=https://zxbijuzcrjdstgfzukfq.supabase.co
   VITE_SUPABASE_ANON_KEY=你的anon_key（在frontend/.env.local中）
   VITE_API_BASE_URL=https://你的后端地址.railway.app/api
   ```
   **注意**：`VITE_API_BASE_URL` 需要等后端部署完成后再填写

6. 点击"Deploy"

7. **部署完成后，记录Vercel域名**（如 `https://your-app.vercel.app`）

---

### 2.5️⃣ 配置Supabase（⚠️ 必须，否则登录会跳转到localhost）

**必须在部署后立即配置，否则Google登录会失败！**

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 左侧菜单：**Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 添加：
   ```
   https://your-app.vercel.app/**
   https://your-app-*.vercel.app/**
   http://localhost:5173/**
   ```
   ⚠️ **重要**：替换 `your-app` 为你的实际Vercel域名

5. 在 **Site URL** 设置：
   ```
   https://your-app.vercel.app
   ```

6. 点击 **Save**

**为什么需要这一步？**
- Supabase默认只允许重定向到localhost
- 没配置时，登录会跳转到localhost导致失败
- 配置后，登录会正确返回你的Vercel应用

---

### 3️⃣ 部署后端（选择其中一个方案）

## 🎯 方案对比（推荐度排序）

| 平台 | 免费额度 | 优点 | 缺点 | 推荐度 |
|------|---------|------|------|--------|
| **Render** | 750小时/月 | 易用、稳定、类似Railway | 冷启动慢（30-60秒） | ⭐⭐⭐⭐⭐ |
| **Fly.io** | 3个小VM | 快速、全球部署 | 配置稍复杂 | ⭐⭐⭐⭐ |
| **Zeabur** | $5免费额度 | 国内访问快、中文界面 | 免费额度有限 | ⭐⭐⭐⭐ |
| **Railway** | $5免费额度 | 最易用 | 额度用完需付费 | ⭐⭐⭐ |

---

## 📦 方案A: Render（最推荐，完全免费）

**优势**：
- ✅ 完全免费（750小时/月，足够个人使用）
- ✅ 自动HTTPS、自动部署
- ✅ 无需信用卡
- ⚠️ 冷启动较慢（闲置15分钟后休眠，首次访问需30-60秒）

**部署步骤**：

1. 访问 [render.com](https://render.com) 并用GitHub登录

2. 点击"New +" → "Web Service"

3. 连接你的GitHub仓库

4. **配置信息**：
   - **Name**: `english-reading-backend`（或你喜欢的名称）
   - **Region**: `Singapore`（亚洲用户推荐）或 `Oregon (US West)`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**（⚠️ 重要：复制整行，确保格式正确）:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**（⚠️ 使用启动脚本，自动下载NLTK数据）:
     ```bash
     bash start.sh
     ```
   - **Instance Type**: `Free`

   **重要说明**：
   - 项目已包含 `backend/start.sh` 启动脚本，会自动检查并下载NLTK数据
   - 启动脚本会在首次运行时下载NLTK数据，后续启动会跳过下载

5. **环境变量配置**（点击"Advanced" → "Add Environment Variable"）：
   ```env
   # 有道词典API
   YOUDAO_APP_KEY=你的应用ID
   YOUDAO_APP_SECRET=你的应用密钥

   # Supabase
   SUPABASE_URL=https://zxbijuzcrjdstgfzukfq.supabase.co
   SUPABASE_SERVICE_KEY=你的service_role_key（⚠️不是anon_key！）

   # CORS配置（重要！）
   ALLOWED_ORIGINS=https://你的前端域名.vercel.app,https://*.vercel.app,http://localhost:5173

   # 阿里云OSS（可选）
   USE_OSS=true
   OSS_ACCESS_KEY_ID=你的AccessKey_ID
   OSS_ACCESS_KEY_SECRET=你的AccessKey_Secret
   OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
   OSS_BUCKET_NAME=你的bucket名称

   # Python环境
   PYTHONUNBUFFERED=1
   PYTHON_VERSION=3.11.0
   ```

6. 点击"Create Web Service"，等待部署（约3-5分钟）

7. 部署完成后，复制生成的URL（如 `https://your-app.onrender.com`）

8. **回到Vercel**，添加/更新环境变量：
   ```env
   VITE_API_BASE_URL=https://your-app.onrender.com/api
   ```
   然后重新部署前端（Vercel会自动触发）

**⚠️ Render冷启动优化**：
- 免费实例闲置15分钟后会休眠
- 首次访问需要30-60秒唤醒
- 建议使用 [UptimeRobot](https://uptimerobot.com/)（免费）每5分钟ping一次保持活跃

---

## 📦 方案B: Fly.io（快速、全球部署）

**优势**：
- ✅ 免费3个小VM
- ✅ 全球部署、延迟低
- ✅ 无冷启动问题

**部署步骤**：

1. 安装Fly CLI：
   ```bash
   # macOS
   brew install flyctl

   # 或使用curl
   curl -L https://fly.io/install.sh | sh
   ```

2. 登录Fly.io：
   ```bash
   fly auth login
   ```

3. 在 `backend/` 目录创建 `fly.toml`：
   ```toml
   app = "english-reading-backend"

   [build]

   [env]
     PORT = "8080"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

4. 部署：
   ```bash
   cd backend
   fly launch  # 按提示选择区域（推荐Tokyo或Singapore）
   fly deploy
   ```

5. 设置环境变量：
   ```bash
   fly secrets set YOUDAO_APP_KEY=你的key
   fly secrets set SUPABASE_URL=你的url
   # ... 其他环境变量
   ```

---

## 📦 方案C: Zeabur（国内优化）

**优势**：
- ✅ 中文界面
- ✅ 国内访问快
- ✅ 类似Railway的体验

**部署步骤**：

1. 访问 [zeabur.com](https://zeabur.com) 并用GitHub登录

2. 创建新项目 → 选择你的仓库

3. 配置类似Railway（Root Directory: `backend`）

4. 添加环境变量（同上）

---

## 📦 方案D: Railway（如果还有额度）

1. 访问 [railway.app](https://railway.app) 并用GitHub登录
2. 点击"New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. **重要配置**：
   - Root Directory: `backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **环境变量配置**（同Render方案）

6. 部署完成后，复制生成的URL（如 `https://your-backend.railway.app`）

### 4️⃣ 配置阿里云OSS（30分钟，可选）

1. 访问 [阿里云OSS控制台](https://oss.console.aliyun.com/)
2. 创建Bucket：
   - 名称：`english-reading-app`
   - 区域：华东1-杭州
   - 读写权限：**公共读**
3. 配置CORS规则：
   - AllowedOrigin: `https://*.vercel.app`
   - AllowedMethod: `GET, HEAD`
4. 获取AccessKey并更新Railway环境变量

## 🔍 部署验证

### 后端健康检查

```bash
# 检查API是否正常（替换为你的后端URL）
# Render: https://your-app.onrender.com/
# Fly.io: https://your-app.fly.dev/
# Zeabur: https://your-app.zeabur.app/
# Railway: https://your-backend.railway.app/

curl https://your-backend-url/
# 应返回: {"message": "English Reading App API"}

# 检查等级选项
curl https://your-backend-url/api/books/levels/options
```

### 前端功能测试

⚠️ **重要提醒：部署后没有书籍数据是正常的！**

**为什么？**
- 本地开发时，书籍存在**本地数据库**
- 部署后，使用的是**云端数据库**（全新的，空的）
- 本地和云端是两个独立的数据库，数据不会自动同步

**解决方法**：
1. **推荐**：登录后重新上传书籍（最简单）
2. 或参考 [DEPLOYMENT_FIX.md](DEPLOYMENT_FIX.md) 的数据迁移方案

**测试步骤**：

1. 访问 `https://your-app.vercel.app`
2. 测试Google登录
   - ✅ 成功：登录后返回Vercel应用
   - ❌ 失败：跳转到localhost → 检查Supabase URL Configuration
3. 上传测试书籍（EPUB格式）
4. 测试查词功能
5. 测试阅读功能

## ⚠️ 常见问题

### Q1: 登录后跳转到localhost

**现象**：点击登录，认证成功后跳转到 `http://localhost:5173`

**原因**：Supabase的OAuth重定向URL未配置

**解决方案**：
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 → Authentication → URL Configuration
3. 添加Redirect URL：`https://your-app.vercel.app/**`
4. 设置Site URL：`https://your-app.vercel.app`
5. 保存并重试登录

**详细步骤**：参考 [DEPLOYMENT_FIX.md](DEPLOYMENT_FIX.md) 问题2

---

### Q2: 部署后看不到书籍

**现象**：本地有书籍，但部署后首页为空

**原因**：本地数据库和云端数据库是分离的

**解决方案**：
1. **最简单**：登录后重新上传书籍
2. **批量导入**：参考 [DEPLOYMENT_FIX.md](DEPLOYMENT_FIX.md) 问题1的数据迁移方案
3. **推荐长期方案**：本地也使用云端数据库，数据实时同步

---

### Q3: 前端部署成功但无法访问后端

**现象**：控制台显示CORS错误或网络错误

**解决方案**：
1. 检查Vercel的 `VITE_API_BASE_URL` 是否正确
2. 检查后端的 `ALLOWED_ORIGINS` 环境变量是否包含前端域名
3. 在浏览器DevTools → Network查看具体错误
4. 测试后端API是否可访问：`curl https://your-backend-url/`

### Q2: 后端启动失败

**Render常见问题**：
- 检查Build Command是否包含NLTK数据下载
- 查看Logs标签页，确认依赖安装成功
- 确认Python版本为3.11（在环境变量中设置）

**Fly.io常见问题**：
- 运行 `fly logs` 查看实时日志
- 检查 `fly.toml` 配置是否正确
- 确认Dockerfile或buildpacks配置

**通用排查**：
1. 检查 `requirements.txt` 是否完整
2. 确认所有环境变量已配置
3. 查看部署日志中的错误信息

### Q3: Render冷启动太慢

**解决方案**：
1. 使用 [UptimeRobot](https://uptimerobot.com/)（免费）
2. 创建HTTP监控，每5分钟ping一次后端URL
3. 或升级到付费计划（$7/月）避免休眠

### Q4: 书籍上传后图片无法显示

**解决方案**：
1. 确认阿里云OSS Bucket权限为"公共读"
2. 检查OSS CORS规则是否包含前端域名
3. 确认后端环境变量中的OSS配置正确
4. 测试OSS URL是否可直接访问

## 📊 成本预估

### 完全免费方案（推荐新手）
- **前端**：Vercel免费版（适合个人项目）
- **后端**：Render免费版（750小时/月）
- **数据库**：Supabase免费版（500MB数据库）
- **存储**：阿里云OSS（约¥0.12/GB/月，可选）

**总计**：¥0-1/月（基本免费）

### 各平台对比

| 平台 | 免费额度 | 付费价格 | 说明 |
|------|---------|---------|------|
| Vercel | 无限制 | $20/月（Pro） | 前端部署，免费版足够 |
| Render | 750小时/月 | $7/月（Starter） | 推荐，完全免费 |
| Fly.io | 3个小VM | $1.94/月起 | 免费额度很大 |
| Zeabur | $5额度 | $5-10/月 | 国内访问快 |
| Railway | $5额度 | $5-10/月 | 额度用完需付费 |
| Supabase | 500MB | $25/月（Pro） | 免费版足够 |
| 阿里云OSS | 无 | ¥0.12/GB/月 | 存储成本极低 |

**推荐配置**：
- 🆓 **完全免费**：Vercel + Render + Supabase（不用OSS）
- 💰 **低成本**：Vercel + Render + Supabase + OSS（约¥1/月）
- ⚡ **高性能**：Vercel + Fly.io + Supabase + OSS（约$2/月）

## 🎉 部署完成后

你的应用将拥有：
- ✅ 全球CDN加速（Vercel）
- ✅ 自动HTTPS
- ✅ 自动CI/CD（Git推送即自动部署）
- ✅ 数据云端同步（Supabase）
- ✅ 可扩展的后端（Railway）

有问题可参考详细部署方案：`~/.claude/plans/floating-wiggling-bentley.md`
