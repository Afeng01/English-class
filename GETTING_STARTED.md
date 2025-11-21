# 快速开始指南

## 第一次使用

### 1. 启动后端服务

打开终端，运行：

```bash
./start-backend.sh
```

或者手动运行：

```bash
cd backend
python3 -m uvicorn main:app --reload --port 8000
```

你会看到类似输出：
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. 启动前端服务

打开**新的**终端窗口，运行：

```bash
./start-frontend.sh
```

或者手动运行：

```bash
cd frontend
npm run dev
```

你会看到类似输出：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 3. 访问应用

在浏览器打开：http://localhost:5173

此时你会看到一个空的书籍列表，因为还没有导入书籍。

---

## 导入你的第一本书

### 1. 准备 EPUB 文件

从 z-library 或其他来源下载 EPUB 格式的英文书籍。

推荐书籍（分级阅读）：
- 学前-一年级：Dr. Seuss 系列
- 二-三年级：Magic Tree House（神奇树屋）
- 四-六年级：Charlotte's Web、The Chronicles of Narnia
- 初中：Harry Potter 系列（简化版）
- 高中：经典英文小说

### 2. 运行导入脚本

假设你下载了《Charlotte's Web》，文件路径为 `~/Downloads/charlottes-web.epub`

```bash
cd backend
python3 scripts/import_book.py ~/Downloads/charlottes-web.epub --level "五年级"
```

你会看到类似输出：
```
✅ Successfully imported: Charlotte's Web
   - Author: E.B. White
   - Chapters: 22
   - Total words: 31938
   - High-freq vocabulary: 87
   - Book ID: abc123-def456-...
```

### 3. 刷新浏览器

返回 http://localhost:5173/books，你会看到刚导入的书籍！

---

## 使用教程

### 浏览书籍

1. 在首页点击「书籍库」
2. 使用顶部筛选器按难度等级筛选
3. 在搜索框输入书名进行搜索
4. 点击书籍卡片查看详情

### 查看高频生词

在书籍详情页：
- 查看该书的高频生词列表
- 这些是书中出现频率最高的词汇（已过滤常见虚词）
- 可以在阅读前先熟悉这些词

### 开始阅读

1. 点击「开始阅读」进入阅读器
2. 如果之前读过，会自动跳转到上次的位置

### 阅读器功能

#### 查词
- 点击任意单词，会弹出释义卡片
- 显示：音标、词性、定义、例句
- 点击🔊播放发音
- 点击「加入生词本」保存到词库

#### 目录导航
- 点击顶部「目录」按钮显示章节列表
- 点击任意章节跳转

#### 阅读设置
- 点击顶部「设置」按钮
- 调整字体大小（小/中/大/特大）
- 切换主题（日间/夜间/护眼）
- 调整行高（1.2 - 2.5）

#### 翻页
- 使用底部的「上一章」「下一章」按钮
- 或通过目录直接跳转

### 管理词库

1. 点击顶部导航「我的词库」
2. 查看所有添加的生词
3. 可以：
   - 标记为「已掌握」
   - 继续学习（从已掌握移回学习中）
   - 删除词汇

---

## 导入更多书籍

### 批量导入示例

```bash
cd backend

# 神奇树屋系列（一年级）
python3 scripts/import_book.py ~/Downloads/magic-tree-house-1.epub --level "一年级"
python3 scripts/import_book.py ~/Downloads/magic-tree-house-2.epub --level "一年级"

# Harry Potter（初中）
python3 scripts/import_book.py ~/Downloads/harry-potter-1.epub --level "初一"

# 经典小说（高中）
python3 scripts/import_book.py ~/Downloads/pride-and-prejudice.epub --level "高二"
```

### 难度等级参考

| 等级 | 词汇量 | 推荐书籍 |
|------|--------|----------|
| 学前 | < 200 | 绘本、Dr. Seuss |
| 一年级 | 200-500 | Magic Tree House |
| 二年级 | 500-1000 | Junie B. Jones |
| 三年级 | 1000-1500 | Charlotte's Web |
| 四年级 | 1500-2000 | The Chronicles of Narnia |
| 五年级 | 2000-2500 | Percy Jackson |
| 六年级 | 2500-3000 | Harry Potter (简化版) |
| 初中 | 3000-4000 | 简化版经典 |
| 高中 | 4000+ | 原版经典小说 |

---

## 常见问题

### Q: 导入书籍失败？

检查：
1. EPUB 文件是否损坏（尝试用 Calibre 打开）
2. 文件路径是否正确
3. Python 依赖是否完整安装

### Q: 查词功能不可用？

本项目使用免费的 Free Dictionary API，可能受网络影响。如果经常失败：
1. 检查网络连接
2. 考虑使用 VPN
3. 或下载离线词典数据（需修改代码）

### Q: 如何删除已导入的书籍？

目前需要手动操作数据库：

```bash
cd backend/data
sqlite3 reading.db

# 查看所有书籍
SELECT id, title FROM books;

# 删除指定书籍（会自动删除关联的章节和词汇）
DELETE FROM books WHERE id = 'book-id-here';
```

### Q: 可以在手机上使用吗？

目前主要针对桌面端优化，移动端可以访问但体验一般。计划后续优化移动端。

### Q: 数据会丢失吗？

- **阅读进度和词库** - 保存在浏览器 localStorage 中，清除浏览器数据会丢失
- **书籍数据** - 保存在后端 SQLite 数据库中，删除 `backend/data/reading.db` 会丢失

建议定期备份：
```bash
cp backend/data/reading.db backend/data/reading.db.backup
```

---

## 下一步

恭喜完成设置！现在你可以：

1. 导入更多书籍
2. 开始你的英语阅读之旅
3. 积累词汇量
4. 享受阅读的乐趣

Happy Reading! 📚
