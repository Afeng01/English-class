 # 数据库迁移到Supabase - 执行计划

## 当前状态
- ✅ Supabase已配置（.env中有SUPABASE_URL和SUPABASE_SERVICE_KEY）
- ✅ 迁移脚本已准备好（backend/scripts/migrate_to_supabase.py）
- ✅ Supabase客户端已准备好（backend/app/utils/supabase_client.py）
- ✅ 本地SQLite有5本书的数据

## 执行步骤

### 第一步：测试迁移（dry-run）
```bash
cd backend
python scripts/migrate_to_supabase.py --dry-run
```
这会**模拟**迁移过程，不会实际修改数据，用于验证配置是否正确。

### 第二步：执行真实迁移
```bash
cd backend
python scripts/migrate_to_supabase.py
```
脚本会：
1. 读取本地SQLite数据（5本书 + 章节 + 词汇）
2. 批量插入到Supabase云数据库
3. 验证迁移完整性
4. 输出迁移统计报告

**预期结果**：
```
📊 迁移统计摘要
📚 书籍: 5/5 成功, 0 失败
📖 章节: X/X 成功, 0 失败
📝 词汇: Y/Y 成功, 0 失败
```

### 第三步：修改后端代码，使用Supabase

需要修改的文件：
1. `backend/app/api/books.py` - 书籍API路由
2. `backend/app/models/database.py` - 可选，保留SQLite作为备份

**修改策略**：
- 方案A：完全切换到Supabase（推荐）
- 方案B：双数据库模式（SQLite作为本地缓存，Supabase作为主数据源）

### 第四步：配置前端云端API地址

修改Vercel环境变量：
```
VITE_API_BASE_URL=https://你的后端API地址.com
```

### 第五步：验证同步

1. 访问 https://enacquire.vercel.app
2. 检查是否能看到5本书
3. 在本地上传新书
4. 刷新云端页面，验证新书是否出现

## 迁移后的优势

✅ **自动同步**：本地和云端共享同一个Supabase数据库
✅ **实时更新**：本地上传的书，云端立即可见
✅ **多环境一致**：开发/测试/生产环境都使用同一数据源
✅ **数据安全**：Supabase自动备份，不会丢失数据
✅ **性能更好**：云数据库比Serverless环境的SQLite更快

## 需要注意的事项

1. **备份数据**：迁移前建议备份本地reading.db
2. **图片已在OSS**：书籍封面已经上传到阿里云OSS，不需要迁移
3. **EPUB文件**：如果有EPUB文件，需要确保云端也能访问（可能已经在OSS）
4. **环境变量**：确保云端后端（Render）也配置了Supabase环境变量

## 回滚方案

如果迁移出现问题：
1. 保留本地SQLite文件作为备份
2. 可以随时切换回SQLite模式
3. Supabase数据可以导出为SQL/CSV
