# 英语分级阅读 Web 应用

一个帮助用户通过阅读英文原著书籍来学习英语的 Web 应用，支持分级阅读、点按查词、生词管理等功能。

## 功能特性

- 📚 **分级阅读** - 根据英语难度分级（学前到高中），循序渐进
- 🔍 **智能查词** - 点击任意单词即可查看中英双语释义、发音
  - 🇨🇳 **有道词典API** - 高质量的中英双语释义、音标、例句
  - 🔄 **词形还原** - 自动识别单词词根（running→run, went→go, children→child）
  - ⚡ **智能缓存** - 重复查询几乎瞬间返回（<10ms）
  - 🎯 **精准识别** - 点击或选中任意位置都能准确提取单词
- 📝 **词汇积累** - 自动保存生词到个人词库
- 🎨 **Calibre 风格阅读器** - 沉浸式阅读体验
- ⚙️ **个性化设置** - 字体大小、主题、行高可调
- 📖 **阅读进度** - 自动保存，随时继续

## 技术栈

### 前端
- React 18 + TypeScript
- React Router - 路由管理
- Zustand - 状态管理
- Axios - HTTP 请求
- Tailwind CSS - 样式框架
- Vite - 构建工具

### 后端
- FastAPI - Python Web 框架
- SQLAlchemy - ORM
- SQLite - 数据库
- ebooklib - EPUB 解析
- httpx - 异步 HTTP 客户端
- NLTK - 自然语言处理（词形还原）
- python-dotenv - 环境变量管理
- 有道智云词典API - 中英双语词典服务

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.9+

### 1. 克隆项目

```bash
cd /path/to/English-class
```

### 2. 配置有道词典API（必须）

```bash
cd backend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的有道API密钥
# YOUDAO_APP_KEY=你的应用ID
# YOUDAO_APP_SECRET=你的应用密钥
```

**获取有道API密钥：**
1. 访问 https://ai.youdao.com/console 注册并登录
2. 创建应用，选择"自然语言翻译"服务
3. 点击"APIkey"按钮查看应用ID和应用密钥
4. 复制到 `.env` 文件中

详细配置请查看：[词典API说明.md](backend/词典API说明.md)

### 3. 启动后端

```bash
cd backend

# 安装依赖（如果还没安装）
python3 -m pip install -r requirements.txt

# 启动服务
python3 -m uvicorn main:app --reload --port 8000
```

后端将运行在 http://localhost:8000

### 4. 启动前端

打开新终端：

```bash
cd frontend

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

前端将运行在 http://localhost:5173

### 5. 导入书籍

下载 EPUB 格式的英文书籍（推荐从 z-library），然后使用导入脚本：

```bash
cd backend
python3 scripts/import_book.py /path/to/your/book.epub --level "一年级"
```

难度等级选项：
- 学前、一年级、二年级...六年级
- 初一、初二、初三
- 高一、高二、高三

## 项目结构

```
English-class/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   │   ├── HomePage.tsx
│   │   │   ├── BooksPage.tsx
│   │   │   ├── BookDetailPage.tsx
│   │   │   ├── ReaderPage.tsx
│   │   │   └── VocabularyPage.tsx
│   │   ├── services/        # API 和本地存储服务
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── types/           # TypeScript 类型定义
│   │   └── App.tsx
│   └── package.json
│
└── backend/                  # 后端项目
    ├── app/
    │   ├── api/             # API 路由
    │   ├── models/          # 数据库模型
    │   └── schemas/         # Pydantic schemas
    ├── scripts/             # 工具脚本
    │   └── import_book.py   # 书籍导入脚本
    ├── data/                # 数据目录（自动创建）
    │   └── reading.db       # SQLite 数据库
    ├── main.py              # FastAPI 入口
    └── requirements.txt
```

## 使用指南

### 浏览书籍

1. 访问 http://localhost:5173
2. 点击「书籍库」浏览所有书籍
3. 可以按难度等级筛选或搜索书名

### 阅读书籍

1. 点击书籍卡片查看详情
2. 查看高频生词预览，标记已认识的词
3. 点击「开始阅读」进入阅读器
4. 点击任意单词查看释义和发音
5. 可将生词加入个人词库

### 阅读器功能

- **目录导航** - 点击「目录」按钮显示章节列表
- **阅读设置** - 点击「设置」按钮调整字体、主题、行高
- **点按查词** - 点击任意单词查询释义
- **单词发音** - 在查词弹窗中点击🔊播放发音
- **翻页** - 使用底部按钮或章节列表跳转

### 管理词库

1. 点击「我的词库」查看已添加的生词
2. 可标记为「已掌握」或删除
3. 词库数据保存在本地浏览器存储中

## API 文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 开发计划

### ✅ MVP 阶段（已完成）

- [x] 书籍管理与展示
- [x] Calibre 风格阅读器
- [x] **智能查词系统** ⭐ 最新完成
  - [x] 有道词典API集成（中英双语释义）
  - [x] 词形还原（running→run, went→go）
  - [x] 智能缓存机制（24小时，重复查询<10ms）
  - [x] 精确单词识别（Range API）
  - [x] 详细的诊断和测试工具
- [x] 本地词库管理
- [x] 阅读进度保存
- [x] 阅读器设置

**详细更新记录：** [CHANGELOG.md](CHANGELOG.md)

### 🎯 下一阶段 MVP 功能

**优先级1（核心体验）：**
- [ ] **生词本增强**
  - [ ] 生词分组管理（按书籍/按难度）
  - [ ] 生词导出（CSV/Excel/Anki）
  - [ ] 生词统计分析
- [ ] **阅读体验优化**
  - [ ] 页面标注和笔记
  - [ ] 书签功能
  - [ ] 阅读时长统计

**优先级2（学习效率）：**
- [ ] **词汇复习系统**
  - [ ] 间隔重复算法（Spaced Repetition）
  - [ ] 单词卡片（Flashcards）
  - [ ] 复习提醒
- [ ] **阅读统计分析**
  - [ ] 阅读时长分析
  - [ ] 词汇量增长曲线
  - [ ] 阅读难度匹配建议

**优先级3（功能完善）：**
- [ ] **句子/段落翻译**
  - [ ] 选中句子自动翻译
  - [ ] 翻译历史记录
- [ ] **更多书籍来源**
  - [ ] 支持PDF格式
  - [ ] 在线书库集成

### 🔮 未来功能

- [ ] 用户注册登录
- [ ] 云端数据同步
- [ ] 移动端优化
- [ ] AI学习助手（基于阅读内容的智能问答）
- [ ] 社区功能（读书笔记分享）

## 常见问题

### 1. 后端启动失败

确保已安装所有依赖：
```bash
python3 -m pip install -r requirements.txt
```

### 2. 前端无法连接后端

检查：
- 后端是否在 8000 端口运行
- vite.config.ts 中的代理配置是否正确

### 3. 如何配置有道词典API（必须）

⚠️ **重要：** 本应用现在只使用有道词典API，必须配置才能使用查词功能。

**快速配置步骤：**

1. 访问 [有道智云控制台](https://ai.youdao.com/console) 注册并登录
2. 创建应用，选择"自然语言翻译"服务
3. 点击右侧"APIkey"按钮，查看：
   - **应用ID（AppKey）**
   - **应用密钥（AppSecret）**
4. 配置环境变量：
   ```bash
   cd backend
   cp .env.example .env
   # 编辑 .env 文件，填入上面获取的密钥
   ```
5. 重启后端服务

**配置验证：**
```bash
cd backend
python3 diagnose_youdao.py  # 运行诊断脚本验证配置
```

**详细文档：**
- [词典API说明.md](backend/词典API说明.md) - 完整使用指南
- [有道API配置检查.md](backend/有道API配置检查.md) - 配置问题排查
- [故障排查.md](backend/故障排查.md) - 常见问题解决

### 4. 如何添加更多书籍

使用导入脚本：
```bash
python3 scripts/import_book.py your_book.epub --level "三年级"
```

## 许可

本项目仅供学习和个人使用。书籍内容版权归原作者所有。

## 贡献

欢迎提交 Issue 和 Pull Request！
