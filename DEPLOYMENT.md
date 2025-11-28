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

### 3️⃣ 部署后端到Railway（40分钟）

1. 访问 [railway.app](https://railway.app) 并用GitHub登录
2. 点击"New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. **重要配置**：
   - Root Directory: `backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **环境变量配置**（在Railway项目"Variables"中）：
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
   ```

6. 部署完成后，复制生成的URL（如 `https://your-backend.railway.app`）

7. **回到Vercel**，添加环境变量：
   ```env
   VITE_API_BASE_URL=https://your-backend.railway.app/api
   ```
   然后重新部署前端

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
# 检查API是否正常
curl https://your-backend.railway.app/
# 应返回: {"message": "English Reading App API"}

# 检查等级选项
curl https://your-backend.railway.app/api/books/levels/options
```

### 前端功能测试

1. 访问 `https://your-app.vercel.app`
2. 测试Google登录
3. 浏览书籍列表
4. 测试查词功能
5. 测试书籍上传

## ⚠️ 常见问题

### Q1: 前端部署成功但无法访问后端

**解决方案**：
1. 检查Vercel的 `VITE_API_BASE_URL` 是否正确
2. 检查Railway的 `ALLOWED_ORIGINS` 是否包含前端域名
3. 在浏览器DevTools查看具体错误

### Q2: Railway启动失败

**解决方案**：
1. 检查 `requirements.txt` 是否完整
2. 查看Railway日志，检查NLTK数据下载是否成功
3. 确认环境变量配置正确

### Q3: 书籍上传后图片无法显示

**解决方案**：
1. 确认阿里云OSS Bucket权限为"公共读"
2. 检查OSS CORS规则
3. 确认Railway环境变量中的OSS配置正确

## 📊 成本预估

- Vercel免费版：适合个人项目
- Railway：$5-10/月（可使用$5免费额度）
- Supabase免费版：500MB数据库
- 阿里云OSS：约¥0.12/GB/月

**总计**：约 $0-5/月（初期可完全免费）

## 🎉 部署完成后

你的应用将拥有：
- ✅ 全球CDN加速（Vercel）
- ✅ 自动HTTPS
- ✅ 自动CI/CD（Git推送即自动部署）
- ✅ 数据云端同步（Supabase）
- ✅ 可扩展的后端（Railway）

有问题可参考详细部署方案：`~/.claude/plans/floating-wiggling-bentley.md`
