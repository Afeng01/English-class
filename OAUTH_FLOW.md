# 🔐 Google OAuth登录流程详解

## 📊 为什么需要配置两个地方？

### 完整的OAuth登录流程

```
1. 用户点击"Google登录"
   ↓
2. 前端（Vercel）跳转到Supabase
   https://zxbijuzcrjdstgfzukfq.supabase.co/auth/v1/authorize?provider=google
   ↓
3. Supabase重定向到Google OAuth
   https://accounts.google.com/o/oauth2/v2/auth
   ↓
4. 用户在Google页面登录并授权
   ↓
5. Google回调到Supabase ⚠️ 需要在Google配置
   https://zxbijuzcrjdstgfzukfq.supabase.co/auth/v1/callback
   ↓
6. Supabase处理认证，生成token
   ↓
7. Supabase重定向回你的应用 ⚠️ 需要在Supabase配置
   https://your-app.vercel.app/
   ↓
8. 用户成功登录 ✅
```

---

## 🎯 两个配置的作用

### 配置1：Google OAuth（控制步骤5）

**位置**：Google Cloud Console → Credentials → OAuth 2.0 Client

**配置内容**：
```
已获授权的重定向URI:
- http://localhost:5173
- https://zxbijuzcrjdstgfzukfq.supabase.co/auth/v1/callback
```

**作用**：
- 允许Google将认证结果发送给Supabase
- 如果没配置，步骤5会失败，Google拒绝重定向

**错误现象**：
```
redirect_uri_mismatch
或
Error 400: redirect_uri_mismatch
```

---

### 配置2：Supabase URL Configuration（控制步骤7）

**位置**：Supabase Dashboard → Authentication → URL Configuration

**配置内容**：
```
Site URL:
- https://your-app.vercel.app

Redirect URLs:
- https://your-app.vercel.app/**
- http://localhost:5173/**
```

**作用**：
- 允许Supabase将用户重定向回你的应用
- 如果没配置，步骤7会跳转到localhost

**错误现象**：
- 认证成功，但跳转到 `http://localhost:5173`
- 线上用户无法登录（因为localhost只在本地有效）

---

## 🔧 完整配置检查清单

### Google Cloud Console

- [ ] **已获授权的重定向URI** 包含：
  ```
  https://zxbijuzcrjdstgfzukfq.supabase.co/auth/v1/callback
  ```
- [ ] **已获授权的JavaScript来源** 包含（可选）：
  ```
  https://your-app.vercel.app
  ```

### Supabase Dashboard

- [ ] **Site URL** 设置为：
  ```
  https://your-app.vercel.app
  ```
- [ ] **Redirect URLs** 包含：
  ```
  https://your-app.vercel.app/**
  http://localhost:5173/**
  ```

### Vercel Environment Variables

- [ ] **VITE_SUPABASE_URL** 正确：
  ```
  https://zxbijuzcrjdstgfzukfq.supabase.co
  ```
- [ ] **VITE_SUPABASE_ANON_KEY** 正确（从Supabase获取）

---

## 🧪 测试流程

### 本地测试

```bash
# 1. 启动本地开发服务器
cd frontend
npm run dev

# 2. 访问 http://localhost:5173
# 3. 点击"Google登录"
# 4. 预期：成功登录，返回 http://localhost:5173
```

### 线上测试

```bash
# 1. 访问 https://your-app.vercel.app
# 2. 点击"Google登录"
# 3. 预期：成功登录，返回 https://your-app.vercel.app
```

### 常见错误排查

| 错误现象 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `redirect_uri_mismatch` | Google OAuth未配置Supabase回调URL | 在Google Cloud Console添加 `https://[项目ID].supabase.co/auth/v1/callback` |
| 登录后跳转到localhost | Supabase未配置Vercel域名 | 在Supabase URL Configuration添加Vercel域名 |
| 无法打开认证页面 | Supabase配置错误 | 检查Vercel环境变量 `VITE_SUPABASE_URL` |
| 认证成功但无session | CORS问题 | 检查后端 `ALLOWED_ORIGINS` 环境变量 |

---

## 📸 配置截图参考

### Google Cloud Console

```
┌─────────────────────────────────────────────────────────┐
│ OAuth 2.0 Client ID                                      │
│                                                           │
│ 已获授权的重定向URI                                        │
│ ┌───────────────────────────────────────────────────┐   │
│ │ http://localhost:5173                             │   │
│ │ https://zxbijuzcrjdstgfzukfq.supabase.co/auth/v1/callback │ │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ [保存]                                                    │
└─────────────────────────────────────────────────────────┘
```

### Supabase Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ Authentication > URL Configuration                       │
│                                                           │
│ Site URL                                                  │
│ https://your-app.vercel.app                              │
│                                                           │
│ Redirect URLs                                             │
│ https://your-app.vercel.app/**                           │
│ http://localhost:5173/**                                  │
│                                                           │
│ [Save]                                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 最佳实践

### 开发环境 vs 生产环境

**推荐配置**：
```
Google OAuth重定向URI:
✅ http://localhost:5173 (开发环境)
✅ https://[项目ID].supabase.co/auth/v1/callback (开发+生产通用)

Supabase Redirect URLs:
✅ http://localhost:5173/** (开发环境)
✅ https://your-app.vercel.app/** (生产环境)
✅ https://your-app-*.vercel.app/** (Vercel预览部署)
```

### 安全提示

⚠️ **不要将Supabase Service Role Key暴露到前端**
- 前端只使用 `VITE_SUPABASE_ANON_KEY`
- 后端使用 `SUPABASE_SERVICE_KEY`

⚠️ **Vercel环境变量要正确命名**
- Vite环境变量必须以 `VITE_` 开头才能在前端访问
- 错误：`SUPABASE_URL` ❌
- 正确：`VITE_SUPABASE_URL` ✅

---

## 🆘 仍然无法登录？

### 调试步骤

1. **打开浏览器开发者工具**（F12）
2. **切换到Console标签**，查看错误信息
3. **切换到Network标签**，重新点击登录
4. **查找认证相关请求**，检查：
   - `/auth/v1/authorize` 请求是否成功
   - 是否有CORS错误
   - 重定向链是否正确

### 联系支持

如果仍有问题，提供以下信息：
- 浏览器控制台的完整错误信息
- Network标签中的认证请求详情
- Supabase和Google OAuth的配置截图

---

**文档版本**：1.0
**更新时间**：2025-11-28
**适用场景**：Vercel + Supabase + Google OAuth
