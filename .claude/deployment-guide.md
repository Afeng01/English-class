# 数据库同步修复 - 部署指南

## ✅ 已完成的工作

### 1. 数据迁移完成
- ✅ 5本书已成功迁移到Supabase
- ✅ 章节和词汇数据已同步
- ✅ 数据验证通过

### 2. 后端代码已修改
- ✅ [backend/app/api/books.py](../backend/app/api/books.py) 已更新
- ✅ 所有读取操作优先使用Supabase
- ✅ 上传操作自动同步到Supabase和SQLite
- ✅ 删除操作同时删除两个数据库的数据

### 3. 本地环境已就绪
- ✅ Supabase客户端已启用
- ✅ 本地后端可以正常从Supabase读取数据

## 🚀 下一步操作

### 步骤1：测试本地环境

```bash
# 1. 启动后端
cd backend
python -m uvicorn main:app --reload

# 2. 新开一个终端，启动前端
cd frontend
npm run dev

# 3. 访问 http://localhost:5173
# 应该能看到5本书（从Supabase读取）
```

**查看日志验证**：
- 后端启动日志应该显示：`✅ Supabase客户端初始化成功`
- 访问首页时日志应该显示：`✅ 从Supabase获取书籍列表: 5 本`

### 步骤2：部署到云端（Render）

你的后端部署在Render上。需要确保Render环境变量已配置：

#### 2.1 检查Render环境变量

登录 [Render Dashboard](https://dashboard.render.com/)，找到你的后端服务，确认以下环境变量已配置：

```env
SUPABASE_URL=https://zxbijuzcrjdstgfzukfq.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi

YOUDAO_APP_KEY=*******e7b3b18abb
YOUDAO_APP_SECRET=wGL0oBoc*

USE_OSS=true
OSS_ACCESS_KEY_ID=LTAI5t*
OSS_ACCESS_KEY_SECRET=Xs***
OSS_ENDPOINT=oss-cn-hongkong.aliyuncs.com
OSS_BUCKET_NAME=english-acquire

ALLOWED_ORIGINS=https://enacquire.vercel.app,http://localhost:5173
```

#### 2.2 重新部署后端

在Render Dashboard中：
1. 点击 "Manual Deploy" → "Deploy latest commit"
2. 或者推送新代码到GitHub，触发自动部署

#### 2.3 查看部署日志

部署完成后，查看Render日志，应该看到：
```
✅ Supabase客户端初始化成功
📦 图片存储配置
✅ OSS存储已启用
```

### 步骤3：配置前端环境变量（Vercel）

你的前端部署在Vercel上。需要配置后端API地址。

#### 3.1 检查Vercel环境变量

登录 [Vercel Dashboard](https://vercel.com/dashboard)，找到你的项目，进入 Settings → Environment Variables，确认：

```env
VITE_API_BASE_URL=https://你的Render后端地址.onrender.com
```

**如何获取Render后端地址**：
1. 打开Render Dashboard
2. 找到你的后端服务
3. 复制服务的URL（例如：`https://english-app-backend.onrender.com`）

#### 3.2 重新部署前端

在Vercel Dashboard中：
1. 进入 Deployments 标签
2. 点击最新的部署右侧的三个点
3. 选择 "Redeploy"

或者推送代码到GitHub触发自动部署。

### 步骤4：验证同步

#### 4.1 访问云端应用

打开 https://enacquire.vercel.app

**预期结果**：
- ✅ 应该能看到5本书
- ✅ 可以点击查看书籍详情
- ✅ 可以阅读章节

#### 4.2 测试本地上传

1. 在本地环境（localhost:5173）上传一本新书
2. 刷新云端应用（enacquire.vercel.app）
3. 应该能看到新上传的书

**如果能看到** → 🎉 同步成功！

### 步骤5：日志确认

#### 本地后端日志应该显示：
```
✅ Supabase客户端初始化成功
✅ 从Supabase获取书籍列表: 5 本
✅ 从Supabase获取书籍详情: XXX
```

#### 云端后端日志（Render）应该显示：
```
✅ Supabase客户端初始化成功
✅ 从Supabase获取书籍列表: 5 本
```

## 🎯 工作原理

### 数据流图

```
本地上传书籍
    ↓
import_book.py
    ↓
同时写入：SQLite（本地） + Supabase（云端）
    ↑
    |
books.py API
    ↓
优先读取：Supabase → 备选：SQLite
    ↓
本地前端 ← 同一数据源 → 云端前端
```

### 关键优势

1. **自动同步**：上传书籍时自动写入Supabase
2. **多环境一致**：本地和云端读取同一个Supabase数据库
3. **容错机制**：Supabase失败时自动回退到SQLite
4. **无缝迁移**：不需要手动导入导出数据

## ⚠️ 常见问题

### Q1: 云端仍然看不到书籍

**检查清单**：
1. Render环境变量是否正确配置（特别是SUPABASE_SERVICE_KEY）
2. Render服务是否已重新部署
3. 查看Render日志，是否显示"Supabase客户端初始化成功"
4. Vercel的VITE_API_BASE_URL是否指向正确的Render地址

### Q2: 本地能看到，云端看不到

**原因**：可能是Render环境变量未配置或后端未重启

**解决方法**：
1. 检查Render环境变量
2. 手动触发Render重新部署
3. 查看Render日志确认Supabase已启用

### Q3: 上传书籍后不同步

**检查**：
- 查看后端日志，应该显示"开始同步数据到Supabase"
- 如果显示"Supabase同步失败"，检查环境变量

### Q4: 本地和云端数据不一致

**原因**：可能是在修改代码前上传的书籍

**解决方法**：
1. 删除本地SQLite中的旧数据
2. 或者重新运行迁移脚本：`python scripts/migrate_to_supabase.py`

## 📝 维护建议

### 定期备份Supabase数据

在Supabase Dashboard中：
1. 进入 Table Editor
2. 选择 books / chapters / book_vocabulary 表
3. Export to CSV

### 监控Supabase使用量

访问 [Supabase Dashboard](https://supabase.com/dashboard/project/zxbijuzcrjdstgfzukfq/settings/billing)

免费额度：
- Database: 500MB
- Storage: 1GB
- Bandwidth: 2GB/month

目前5本书的数据使用量很小，完全够用。

## ✅ 完成标志

当你完成所有步骤后，应该满足：

- [ ] 本地后端日志显示"✅ 从Supabase获取书籍列表"
- [ ] 云端应用（enacquire.vercel.app）能看到5本书
- [ ] 本地上传新书后，云端立即可见
- [ ] Render日志显示"Supabase客户端初始化成功"

**全部打✓ → 恭喜！数据库同步成功！🎉**

---

**文档版本**：1.0
**更新时间**：2025-11-28
**适用场景**：Vercel前端 + Render后端 + Supabase数据库
