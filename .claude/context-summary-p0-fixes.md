# 项目上下文摘要（P0问题修复）

生成时间：2025-11-23

## 1. 相似实现分析

### 词典查询实现（backend/app/api/dictionary.py）
- **模式**：代理模式 - 后端作为Free Dictionary API的代理
- **实现位置**：`/Users/cherry_xiao/Documents/Code-project/English-class/backend/app/api/dictionary.py` (12-71行)
- **可复用**：
  - `lookup_word(word: str)` 函数 - 使用httpx异步查询外部API
  - 错误处理模式 - 404/502/504状态码处理
- **需注意**：
  - 当前直接查询输入单词，没有词形还原逻辑
  - 10秒超时设置
  - 使用Free Dictionary API: https://api.dictionaryapi.dev/api/v2/entries/en/{word}

### 前端词典查询实现（frontend/src/pages/ReaderPage.tsx）
- **模式**：事件驱动 - 点击单词触发查询
- **实现位置**：`/Users/cherry_xiao/Documents/Code-project/English-class/frontend/src/pages/ReaderPage.tsx` (80-103行)
- **流程**：
  1. `handleWordClick` - 提取点击的单词
  2. 清理标点：`word.replace(/[^a-zA-Z]/g, '').toLowerCase()`
  3. 调用API：`dictionaryAPI.lookup(cleanWord)`
  4. 显示弹窗：设置`selectedWord`和`wordResult`状态
- **需注意**：
  - 当前没有词形还原，直接查询清理后的单词
  - 如果API返回404，显示"未找到释义"

### 设置面板实现（frontend/src/pages/ReaderPage.tsx）
- **模式**：模态弹窗 + 实时预览
- **实现位置**：`/Users/cherry_xiao/Documents/Code-project/English-class/frontend/src/pages/ReaderPage.tsx` (291-350行)
- **UI形式**：
  - 全屏黑色半透明遮罩（`fixed inset-0 bg-black/50`）
  - 居中白色弹窗（`w-96`）
  - 点击遮罩关闭，点击弹窗内部不关闭（事件冒泡控制）
- **设置项**：
  - 字体大小：4个选项（small/medium/large/xlarge）
  - 主题：3个选项（light/dark/sepia）
  - 行高：滑块控制（1.2-2.5）
- **状态管理**：
  - 使用Zustand store (`useAppStore`)
  - `settings`对象包含所有设置
  - `updateSetting(key, value)` 更新设置并持久化到localStorage
- **交互模式**：实时预览（修改立即生效，无需确认按钮）
- **需注意**：
  - 当前实现已完整，UI已存在，不是"缺失"状态
  - 与ReaderPage深度集成，通过`showSettings`状态控制显示

### 状态管理实现（frontend/src/stores/useAppStore.ts）
- **模式**：Zustand全局状态管理
- **实现位置**：`/Users/cherry_xiao/Documents/Code-project/English-class/frontend/src/stores/useAppStore.ts`
- **关键接口**：
  - `settings: ReaderSettings` - 包含font_size, line_height, theme
  - `loadSettings()` - 从localStorage加载
  - `updateSetting(key, value)` - 更新并持久化
- **可复用**：
  - 持久化模式：通过`settingsStorage`服务
  - 状态更新模式：先更新storage，再重新load

## 2. 项目约定

### 命名约定
- **函数命名**：camelCase（如`handleWordClick`, `loadBook`, `startReading`）
- **组件命名**：PascalCase（如`ReaderPage`, `BookDetailPage`）
- **变量命名**：camelCase（如`selectedWord`, `currentChapter`）
- **类型命名**：PascalCase（如`DictionaryResult`, `BookDetail`）
- **API路由**：snake_case（如`/api/dictionary/{word}`）

### 文件组织
```
backend/
  app/
    api/          # API路由（dictionary.py, books.py）
    models/       # 数据模型
    schemas/      # Pydantic schemas
frontend/
  src/
    components/   # 可复用组件（Button, Card, Navigation等）
    pages/        # 页面组件（ReaderPage, BookDetailPage等）
    services/     # API服务和存储服务
    stores/       # Zustand状态管理
    types/        # TypeScript类型定义
```

### 导入顺序
1. React相关（react, react-router-dom）
2. 第三方库（axios, zustand）
3. 本地服务（../services/api）
4. 本地类型（../types）
5. 本地stores（../stores）

### 代码风格
- **TypeScript**：严格类型检查，使用interface定义类型
- **React**：函数式组件 + Hooks
- **CSS**：Tailwind CSS工具类，内联样式用于动态值
- **异步处理**：async/await + try-catch
- **错误处理**：console.error记录，显示友好提示

## 3. 可复用组件清单

### 前端组件
- `frontend/src/components/Button.tsx` - 按钮组件（4种变体：primary/secondary/ghost/pill）
- `frontend/src/components/Card.tsx` - 卡片组件（4种变体：elevated/outlined/glass/gradient）
- `frontend/src/services/api.ts` - API服务封装（axios实例）
- `frontend/src/services/storage.ts` - localStorage持久化服务
- `frontend/src/stores/useAppStore.ts` - Zustand全局状态管理

### 后端工具
- `httpx.AsyncClient` - 异步HTTP客户端（已在dictionary.py中使用）
- FastAPI的异常处理模式（HTTPException）

### UI模式
- **模态弹窗模式**（ReaderPage中的设置面板和词典弹窗）：
  - 全屏遮罩 + 居中内容
  - 点击遮罩关闭，点击内容区不关闭
  - 使用`fixed inset-0`定位
- **加载状态模式**：
  - 使用`loading`状态
  - 显示旋转spinner：`animate-spin rounded-full border-b-2`
- **响应式布局模式**：
  - 使用Tailwind的响应式类
  - flex布局为主

## 4. 测试策略

### 当前测试状况
- **前端**：未发现测试文件（在项目src目录下）
- **后端**：未发现测试文件
- **依赖版本**：
  - Python：fastapi 0.115.5, httpx 0.28.1
  - Node：vite 7.2.4, typescript 5.9.3

### 建议测试策略
- **词形还原**：
  - 单元测试：测试lemmatize函数（ceilings→ceiling, went→go, running→run）
  - 边界条件：不规则动词（went→go, was→be）、专有名词（London→London）
  - 失败情况：未知单词、特殊字符
  - 集成测试：端到端查询流程（前端点击→后端处理→返回结果）
- **设置面板**：
  - UI测试：检查面板显示/隐藏
  - 状态同步：验证设置变更后localStorage更新
  - 交互测试：滑块、按钮点击响应

### 验证方式
- **手动测试**：启动前后端，在浏览器中测试
- **自动化测试**：当前项目缺少测试框架，需要添加

## 5. 依赖和集成点

### 外部依赖
- **Free Dictionary API**：https://api.dictionaryapi.dev/api/v2/entries/en/{word}
  - 用途：查询单词释义
  - 限制：免费API，可能有速率限制
  - 失败场景：404（单词不存在）、502（API错误）、504（超时）

### 内部依赖
- **前端**：
  - `dictionaryAPI.lookup(word)` - 调用后端词典接口
  - `useAppStore` - 全局状态管理（包括settings）
  - `settingsStorage` - localStorage持久化
- **后端**：
  - FastAPI路由注册（`main.py`第27行）
  - CORS中间件配置（允许localhost:5173）

### 集成方式
- **前后端通信**：RESTful API（axios + FastAPI）
- **状态管理**：Zustand + localStorage
- **配置来源**：
  - 前端：`frontend/src/types/index.ts`定义类型
  - 后端：`backend/app/schemas/schemas.py`定义schemas

## 6. 技术选型理由

### 词形还原技术选型

#### 方案A：Python后端实现（推荐）
- **库选择**：使用`nltk.stem.WordNetLemmatizer`
- **优势**：
  1. 准确性高：WordNetLemmatizer基于WordNet词典，能准确处理不规则词形
  2. 成熟稳定：nltk是NLP领域标准库
  3. 与现有架构契合：后端已使用Python，添加依赖简单
  4. 词性支持：可以根据词性进行更精确的还原
- **劣势**：
  1. 首次使用需下载WordNet数据（约10MB）
  2. 增加后端响应时间（约10-50ms）
- **实现方式**：
  - 在`lookup_word`函数中添加词形还原逻辑
  - 先尝试查询原词，失败时查询词根
  - 缓存词形还原结果减少重复计算

#### 方案B：前端实现（不推荐）
- **库选择**：`wink-lemmatizer`或`en-stemmer`
- **优势**：
  1. 减少后端负担
  2. 无网络延迟
- **劣势**：
  1. 准确性较低：基于规则，处理不规则词形能力弱
  2. 增加前端bundle大小
  3. 与现有架构不一致（词典查询在后端）

### 设置面板UI形式
- **选择**：模态弹窗（当前已实现）
- **理由**：
  1. 符合用户习惯（类似Kindle、微信读书等阅读器）
  2. 不占用屏幕空间，按需显示
  3. 实时预览效果好
  4. 与当前实现一致（词典弹窗也是模态）

## 7. 关键风险点

### 词形还原风险
- **不规则动词问题**：went→go、was→be等需要依赖词典
- **专有名词误还原**：如人名、地名不应还原
- **性能风险**：每次查询都需要词形还原，可能增加延迟
- **缓存策略**：需要缓存已查询的词形还原结果

### 设置面板风险
- **无风险**：UI已完整实现，状态管理已就绪
- **误解澄清**：任务描述中"设置面板UI未实现"不准确，实际已实现完整功能

### 性能瓶颈
- **词典查询延迟**：
  - 外部API调用（平均200-500ms）
  - 词形还原计算（10-50ms）
  - 总延迟可能达到600ms
- **优化方案**：
  - 添加本地缓存（localStorage）
  - 预加载常见单词释义

### 并发问题
- **快速点击多个单词**：可能导致多个查询并发
- **解决方案**：
  - 取消上一个未完成的请求
  - 使用loading状态防止重复点击

## 8. 技术栈总结

### 后端
- **框架**：FastAPI 0.115.5
- **HTTP客户端**：httpx 0.28.1（异步）
- **数据验证**：Pydantic 2.10.2
- **数据库**：SQLAlchemy 2.0.36
- **文件处理**：ebooklib 0.18, beautifulsoup4 4.12.3

### 前端
- **框架**：React 19.2.0 + TypeScript 5.9.3
- **构建工具**：Vite 7.2.4
- **路由**：react-router-dom 7.9.6
- **状态管理**：Zustand 5.0.8
- **HTTP客户端**：axios 1.13.2
- **CSS框架**：Tailwind CSS 4.1.17

### 开发工具
- **Linter**：ESLint 9.39.1 + typescript-eslint 8.46.4

## 9. 关键发现和建议

### 发现1：设置面板已实现
- **现状**：ReaderPage.tsx第291-350行已完整实现设置面板UI
- **建议**：无需开发设置面板，该任务已完成

### 发现2：词形还原是核心问题
- **现状**：点击"ceilings"查询"ceilings"，API返回404
- **解决方案**：在后端添加词形还原逻辑
- **优先级**：P0

### 发现3：项目缺少测试
- **现状**：未发现单元测试或集成测试
- **建议**：添加测试框架（pytest for backend, vitest for frontend）

### 发现4：缓存机制缺失
- **现状**：每次点击单词都重新查询API
- **建议**：添加localStorage缓存，减少API调用

## 10. 任务重新评估

### 原任务描述问题
1. **"设置面板UI未实现"** - 不准确，设置面板已完整实现
2. **"状态管理已就绪"** - 准确，useAppStore已包含settings逻辑

### 实际需要修复的问题
1. **P0-1：词形还原缺失** - 真实问题，需要修复
2. **P0-2：设置面板UI** - 已实现，无需修复

### 修正后的任务列表
- **唯一P0任务**：实现词形还原功能（在后端dictionary.py中）
- **次要优化**：添加词典查询缓存、优化错误提示
