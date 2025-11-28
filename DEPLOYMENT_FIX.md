# 🔧 部署后问题修复指南

**常见问题**：
1. ❌ 部署后看不到书籍数据
2. ❌ 登录时跳转到localhost

---

## 问题1：部署后没有书籍数据

### 🔍 原因分析

```
本地开发环境：
├─ 本地Supabase数据库 ← 有书籍数据
└─ localhost:5173

部署后环境：
├─ 云端Supabase数据库 ← 空的（没有数据）
└─ your-app.vercel.app
```

**本地和云端是两个独立的数据库，数据不会自动同步！**

### ✅ 解决方案（3种方法）

#### 方法A：在线重新上传书籍（推荐）

1. 访问你的Vercel应用（`https://your-app.vercel.app`）
2. 登录后进入"书籍上传"页面
3. 重新上传你需要的书籍

**优点**：简单直接
**缺点**：需要重新上传

---

#### 方法B：导出本地数据，导入到云端（批量）

**Step 1：导出本地Supabase数据**

1. 访问本地Supabase Studio：http://localhost:54323（或你的端口）
2. 进入 SQL Editor
3. 运行导出命令：
   ```sql
   -- 导出books表
   COPY (SELECT * FROM books) TO STDOUT WITH CSV HEADER;

   -- 导出chapters表
   COPY (SELECT * FROM chapters) TO STDOUT WITH CSV HEADER;
   ```
4. 保存为CSV文件

**Step 2：导入到云端Supabase**

1. 访问云端Supabase Dashboard：https://supabase.com/dashboard
2. 选择你的项目：`zxbijuzcrjdstgfzukfq`
3. 进入 Table Editor → books
4. 点击 "Insert" → "Import data from CSV"
5. 上传导出的CSV文件
6. 重复步骤导入chapters表

---

#### 方法C：使用云端Supabase连接本地开发（推荐长期方案）

**修改本地环境变量，直接使用云端数据库**：

编辑 `frontend/.env.local` 和 `backend/.env`，使用相同的云端Supabase配置：

```env
# frontend/.env.local
VITE_SUPABASE_URL=https://zxbijuzcrjdstgfzukfq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你已有的）

# backend/.env
SUPABASE_URL=https://zxbijuzcrjdstgfzukfq.supabase.co
SUPABASE_SERVICE_KEY=你的service_role_key（⚠️��是anon_key）
```

**这样本地开发和线上环境使用同一个数据库，数据实时同步！**

---

## 问题2：登录跳转到localhost

### 🔍 原因分析

需要在**两个地方**配置重定向URL：
1. **Google OAuth**：允许Supabase接收Google的认证响应
2. **Supabase**：允许用户重定向回你的Vercel应用

只配置一个不够，必须两个都配置！

### ✅ 解决方案：配置OAuth重定向URL（两个地方）

---

#### Part 1：配置Google OAuth重定向URI（⚠️ 必须）

**Step 1：访问Google Cloud Console**

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你创建OAuth凭据时的项目
3. 左侧菜单：**APIs & Services** → **Credentials**（凭据）

**Step 2：编辑OAuth 2.0客户端**

1. 找到你的OAuth 2.0客户端ID
2. 点击右侧的编辑图标（铅笔）
3. 找到 **已获授权的重定向URI** 部分

**Step 3：添加Supabase回调URL**

在重定向URI列表中，确保包含：
```
http://localhost:5173
https://zxbijuzcrjdstgfzukfq.supabase.co/auth/v1/callback
```

点击 **保存**。

**为什么需要这个？**
- Google需要验证回调URL是否安全
- Supabase使用 `https://[项目ID].supabase.co/auth/v1/callback` 接收Google的OAuth响应
- 如果这里没配置，Google会拒绝认证请求

---

#### Part 2：配置Supabase重定向URL（⚠️ 必须）

**Step 1：获取你的Vercel域名**

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目，复制域名（如 `https://your-app.vercel.app`）

**Step 2：在Supabase添加重定向URL**

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`zxbijuzcrjdstgfzukfq`
3. 左侧菜单：**Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 部分，添加以下URL：
   ```
   https://your-app.vercel.app/**
   https://your-app-*.vercel.app/**
   http://localhost:5173/**
   ```
   **注意**：
   - 替换 `your-app` 为你的实际域名
   - `/**` 表示允许所有子路径
   - `*` 允许Vercel的预览部署（preview deployments）

5. 点击 **Save**

**Step 3：配置Site URL（重要）**

在同一页面，找到 **Site URL** 设置：
```
https://your-app.vercel.app
```

**Step 4：重新部署前端（可选）**

```bash
# 在Vercel Dashboard中触发重新部署
# 或者推送一个新提交
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## 📋 完整检查清单

### Supabase配置

- [ ] **Authentication → URL Configuration**
  - [ ] Redirect URLs包含Vercel域名
  - [ ] Site URL设置为Vercel域名
  - [ ] 保存配置

### Vercel环境变量

- [ ] **Vercel项目设置 → Environment Variables**
  - [ ] `VITE_SUPABASE_URL` = `https://zxbijuzcrjdstgfzukfq.supabase.co`
  - [ ] `VITE_SUPABASE_ANON_KEY` = 你的anon key
  - [ ] `VITE_API_BASE_URL` = 你的后端URL（Render/Railway等）

### Render/Railway环境变量

- [ ] **后端环境变量**
  - [ ] `SUPABASE_URL` = `https://zxbijuzcrjdstgfzukfq.supabase.co`
  - [ ] `SUPABASE_SERVICE_KEY` = 你的service role key（⚠️不是anon key）
  - [ ] `ALLOWED_ORIGINS` = 包含你的Vercel域名

---

## 🧪 测试流程

### 1. 测试登录功能

1. 访问 `https://your-app.vercel.app`
2. 点击"登录"按钮
3. 选择Google登录
4. **预期结果**：登录成功后返回你的Vercel应用（而不是localhost）

### 2. 测试书籍上传

1. 登录后，进入"书籍上传"页面
2. 上传一本测试书籍（EPUB格式）
3. **预期结果**：上传成功，书籍显示在首页

### 3. 测试跨设备同步

1. 在手机上访问 `https://your-app.vercel.app`
2. 登录相同的Google账号
3. **预期结果**：��看到刚才上传的书籍（说明数据在云端）

---

## 🔍 故障排查

### 登录后仍跳转到localhost

**检查项**：
```bash
# 1. 确认Supabase Redirect URLs配置
# 登录 https://supabase.com/dashboard
# Authentication → URL Configuration → Redirect URLs
# 应包含: https://your-app.vercel.app/**

# 2. 检查浏览器控制台错误
# F12 → Console → 查看是否有CORS或重定向错误

# 3. 清除浏览器缓存
# Chrome: Ctrl+Shift+Delete → 清除缓存
```

### 书籍上传失败

**检查项**：
```bash
# 1. 检查后端日志
# Render: Dashboard → Logs标签
# Railway: Dashboard → Deployments → Logs

# 2. 检查后端环境变量
# 确认SUPABASE_SERVICE_KEY正确（不是ANON_KEY）

# 3. 测试后端API
curl https://your-backend.onrender.com/api/books/levels/options
# 应返回JSON数据
```

### 前端无法连接后端

**检查项**：
```bash
# 1. 检查Vercel环境变量
# VITE_API_BASE_URL应该是: https://your-backend.onrender.com/api

# 2. 检查后端CORS配置
# ALLOWED_ORIGINS应包含: https://your-app.vercel.app

# 3. 浏览器控制台查看网络请求
# F12 → Network → 查看API请求是否成功
```

---

## 📸 配置截图参考

### Supabase URL Configuration

```
┌─────────────────────────────────────────────┐
│ Site URL                                     │
│ https://your-app.vercel.app                  │
│                                              │
│ Redirect URLs                                │
│ https://your-app.vercel.app/**              │
│ https://your-app-*.vercel.app/**            │
│ http://localhost:5173/**                     │
│                                              │
│ [Save]                                       │
└─────────────────────────────────────────────┘
```

### Vercel Environment Variables

```
┌─────────────────────────────────────────────┐
│ VITE_SUPABASE_URL                            │
│ https://zxbijuzcrjdstgfzukfq.supabase.co    │
│                                              │
│ VITE_SUPABASE_ANON_KEY                       │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     │
│                                              │
│ VITE_API_BASE_URL                            │
│ https://your-backend.onrender.com/api        │
└─────────────────────────────────────────────┘
```

---

## 🎯 快速修复步骤（5分钟）

1. **配置Supabase重定向**（2分钟）
   - 访问 https://supabase.com/dashboard
   - Authentication → URL Configuration
   - 添加Vercel域名到Redirect URLs
   - 设置Site URL

2. **检查Vercel环境变量**（1分钟）
   - 确认VITE_API_BASE_URL正确
   - 确认VITE_SUPABASE_*正确

3. **重新上传书籍**（2分钟）
   - 访问Vercel应用
   - 登录并上传测试书籍

**完成！** 🎉

---

## 💡 推荐配置（最佳实践）

### 统一使用云端数据库

**本地开发和线上部署都使用云端Supabase**：

**优点**：
- ✅ 数据实时同步
- ✅ 无需导入导出
- ✅ 多设备开发时数据一致
- ✅ 部署后立即可用

**配置方法**：
1. 本地 `frontend/.env.local` 和 `backend/.env` 都指向云端Supabase
2. 开发时上传的书籍直接存在云端
3. 部署后无需任何数据迁移

**唯一缺点**：需要网络连接（但Supabase免费版速度很快）

---

**生成时间**：2025-11-28
**适用场景**：Vercel前端 + Render/Railway后端 + Supabase数据库
