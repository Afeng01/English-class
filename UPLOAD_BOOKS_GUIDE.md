# 📚 上传书籍到云端指南

## 问题：部署后没有书籍

**原因**：
- 本地开发时，书籍存在**本地数据库**
- 部署后，使用的是**云端数据库**（全新的，空的）
- 本地和云端是两个独立的数据库，数据不会自动同步

---

## ✅ 解决方案1：在线上传（最简单）

### Step 1：访问你的应用

打开浏览器，访问：`https://enacquire.vercel.app`

### Step 2：登录

点击右上角"登录"按钮，使用Google账号登录

### Step 3：进入上传页面

导航栏找到"书籍上传"或"Upload"按钮，点击进入

### Step 4：上传EPUB文件

1. 点击"选择文件"或拖拽EPUB文件
2. 填写书籍信息（如果需要）
3. 点击"上传"按钮
4. 等待上传完成

### Step 5：验证

- 返回首页，应该能看到刚上传的书籍
- 刷新页面，书籍仍然存在（说明已保存到云端）

**优点**：
- ✅ 简单快速
- ✅ 随时随地可以上传
- ✅ 数据直接存在云端

**缺点**：
- ❌ 如果书籍很多，需要一本一本上传

---

## ✅ 解决方案2：本地上传到云端（批量）

### 前提：本地已连接云端Supabase

确认你的 `frontend/.env.local` 和 `backend/.env` 都指向云端：

```env
# frontend/.env.local
VITE_SUPABASE_URL=https://zxbijuzcrjdstgfzukfq.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key

# backend/.env
SUPABASE_URL=https://zxbijuzcrjdstgfzukfq.supabase.co
SUPABASE_SERVICE_KEY=你的service_role_key
```

**✅ 你已经完成这一步！**

### Step 1：启动本地开发环境

```bash
# 启动后端
cd backend
python -m uvicorn main:app --reload

# 新开一个终端，启动前端
cd frontend
npm run dev
```

### Step 2：访问本地应用

打开浏览器，访问：`http://localhost:5173`

### Step 3：上传书籍

1. 登录（如果还没登录）
2. 进入"书籍上传"页面
3. 批量上传你的EPUB文件

**优点**：
- ✅ 可以批量上传
- ✅ 上传到云端后，线上和本地都能看到

**缺点**：
- ❌ 需要本地环境配置

---

## ✅ 解决方案3：导出本地数据，导入云端（高级）

### 适用场景

- 你本地已经有很多书籍
- 不想重新上传
- 想直接迁移数据

### Step 1：导出本地数据（如果你之前用的是本地Supabase）

**⚠️ 注意**：如果你本地也是用的云端Supabase，数据已经在云端了，不需要导出！

如果之前用的是本地Supabase：

1. 访问本地Supabase Studio（通常是 `http://localhost:54323`）
2. 进入 SQL Editor
3. 运行导出命令：
   ```sql
   -- 导出books表
   COPY (SELECT * FROM books) TO STDOUT WITH CSV HEADER;

   -- 导出chapters表
   COPY (SELECT * FROM chapters) TO STDOUT WITH CSV HEADER;
   ```
4. 保存为CSV文件

### Step 2：导入到云端Supabase

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`zxbijuzcrjdstgfzukfq`
3. 进入 Table Editor → books
4. 点击 "Insert" → "Import data from CSV"
5. 上传导出的CSV文件
6. 重复步骤导入chapters表

---

## 🎯 推荐方案

### 如果书籍不多（<10本）
→ **方案1**：在线上传（最简单）

### 如果书籍很多（>10本）
→ **方案2**：本地批量上传到云端（快速）

### 如果之前用的是本地Supabase
→ **方案3**：导出导入（数据迁移）

---

## 📋 验证清单

上传完成后，确认以下几点：

- [ ] **线上应用**能看到书籍（`https://enacquire.vercel.app`）
- [ ] **本地应用**也能看到书籍（`http://localhost:5173`）
- [ ] 刷新页面，书籍仍然存在
- [ ] 登录不同账号，书籍对所有用户可见（全局共享）

**如果都✅，说明书籍已成功上传到云端！**

---

## ⚠️ 常见问题

### Q1：上传后首页仍然没有书籍

**解决方法**：
1. 刷新页面（Ctrl+R 或 Cmd+R）
2. 清除浏览器缓存
3. 检查浏览器控制台是否有错误（F12）

### Q2：上传时提示"未登录"

**解决方法**：
1. 确认已登录（右上角显示用户头像）
2. 如果没登录，点击登录按钮
3. 登录后重试上传

### Q3：本地上传的书籍，线上看不到

**检查**：
1. 确认本地 `frontend/.env.local` 指向云端Supabase
2. 确认本地 `backend/.env` 指向云端Supabase
3. 重启本地开发服务器
4. 清除浏览器缓存

### Q4：上传失败，提示网络错误

**检查**：
1. 后端是否正常运行（Render Dashboard → Logs）
2. 后端环境变量是否正确（`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`）
3. 阿里云OSS配置是否正确（如果使用OSS）

---

## 💡 最佳实践

### 统一使用云端数据库

**推荐配置**：
- 本地开发也使用云端Supabase
- 好处：本地上传的书籍，线上立即可见
- 坏处：需要网络连接（但Supabase速度很快）

**配置方法**：
你已经完成了！本地和线上都使用 `https://zxbijuzcrjdstgfzukfq.supabase.co`

### 定期备份

建议定期导出云端数据作为备份：

```sql
-- 在Supabase Dashboard的SQL Editor中运行
COPY (SELECT * FROM books) TO '/tmp/books_backup.csv' WITH CSV HEADER;
COPY (SELECT * FROM chapters) TO '/tmp/chapters_backup.csv' WITH CSV HEADER;
```

---

**文档版本**：1.0
**更新时间**：2025-11-28
**适用场景**：Vercel前端 + Render后端 + Supabase数据库
