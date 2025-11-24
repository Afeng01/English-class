## 项目上下文摘要（词典API优化）
生成时间：2025-11-24 14:30:00

### 1. 项目概览
- **项目名称**：英语分级阅读Web应用
- **核心功能**：分级阅读、点按查词、生词管理、阅读进度跟踪
- **技术栈**：
  - 前端：React 18 + TypeScript + Zustand + Tailwind CSS
  - 后端：FastAPI + SQLAlchemy + SQLite
  - 词典：Free Dictionary API + Words API（备用）

### 2. 词典API现状分析

#### 2.1 已实现功能
- ✅ Free Dictionary API集成（[backend/app/api/dictionary.py:13](backend/app/api/dictionary.py#L13)）
- ✅ Words API备用方案（需API Key）
- ✅ 完整的词形还原功能（使用NLTK WordNetLemmatizer）
- ✅ 不规则动词映射（22-85行）
- ✅ 音标、释义、例句、音频支持
- ✅ 前后端集成完成（[frontend/src/pages/ReaderPage.tsx:80-103](frontend/src/pages/ReaderPage.tsx#L80-L103)）

#### 2.2 现有问题
- ❌ **只支持英文释义**：Free Dictionary API不提供中文翻译，对中国用户不够友好
- ❌ **无缓存机制**：每次查词都要请求API，浪费网络资源
- ❌ **API不稳定**：Free Dictionary API需要访问外网，可能受网络影响
- ❌ **无离线支持**：网络故障时无法查词
- ⚠️ **错误处理可改进**：只返回404/502/504，前端无法区分具体错误类型

### 3. 相似实现分析

#### 实现1：词形还原 - [dictionary.py:102-126](backend/app/api/dictionary.py#L102-L126)
- **模式**：使用NLTK + 不规则动词映射的组合策略
- **可复用**：`lemmatize_word`函数，已使用`@lru_cache`优化
- **需注意**：需要下载NLTK数据包（在main.py启动时自动下载）

#### 实现2：API查询 - [dictionary.py:128-143](backend/app/api/dictionary.py#L128-L143)
- **模式**：使用httpx.AsyncClient进行异步HTTP请求
- **可复用**：异步查询模式、错误处理框架
- **需注意**：超时设置为30秒（line 248），可能需要调整

#### 实现3：前端词典调用 - [ReaderPage.tsx:80-103](frontend/src/pages/ReaderPage.tsx#L80-L103)
- **模式**：点击事件 → 提取单词 → API查询 → 显示弹窗
- **可复用**：单词提取逻辑、加载状态管理
- **需注意**：错误处理较简单，只console.error

### 4. 项目约定

#### 命名约定
- **Python**：snake_case（函数名、变量名）
- **TypeScript**：camelCase（函数名、变量名）
- **组件**：PascalCase
- **API路由**：kebab-case或snake_case

#### 代码风格
- **Python**：遵循PEP 8，使用类型提示
- **TypeScript**：使用严格类型检查
- **注释**：使用简体中文描述意图和约束
- **导入顺序**：标准库 → 第三方库 → 本地模块

#### 文件组织
- **后端API**：`backend/app/api/` 下按功能模块划分
- **前端服务**：`frontend/src/services/` 下封装API调用
- **类型定义**：`frontend/src/types/index.ts` 集中管理

### 5. 可复用组件清单
- `backend/app/api/dictionary.py::lemmatize_word` - 词形还原函数（已缓存）
- `backend/app/api/dictionary.py::IRREGULAR_VERBS` - 不规则动词映射表
- `frontend/src/services/api.ts::dictionaryAPI` - 前端词典API封装
- `frontend/src/pages/ReaderPage.tsx::handleWordClick` - 单词点击处理逻辑

### 6. 测试策略

#### 测试框架
- **后端**：需要添加pytest测试
- **前端**：需要添加Vitest测试

#### 测试覆盖
- **正常流程**：查询常见单词、词形变化
- **边界条件**：空字符串、特殊字符、超长单词
- **错误处理**：API超时、网络错误、404响应

#### 参考测试（目前缺失）
- 需要创建`backend/tests/test_dictionary.py`
- 需要创建`frontend/src/services/__tests__/api.test.ts`

### 7. 依赖和集成点

#### 外部依赖
- **Free Dictionary API**：https://api.dictionaryapi.dev/api/v2/entries/en
- **Words API**：wordsapiv1.p.rapidapi.com（需API Key）
- **NLTK**：需下载wordnet、omw-1.4、averaged_perceptron_tagger数据包

#### 内部依赖
- `app.schemas.schemas.DictionaryResponse` - 响应数据模型
- `frontend/src/types/index.ts::DictionaryResult` - 前端类型定义

#### 集成方式
- **前后端**：通过RESTful API（`/api/dictionary/{word}`）
- **错误传递**：HTTP状态码 + HTTPException

#### 配置来源
- **环境变量**：`WORDS_API_KEY`（可选）
- **CORS配置**：[main.py:13-19](backend/main.py#L13-L19)

### 8. 技术选型理由

#### 为什么用Free Dictionary API？
- **优势**：免费、无需API Key、响应速度快、数据质量高
- **劣势**：只提供英文释义、需要访问外网、无官方SLA保证

#### 为什么用NLTK？
- **优势**：成熟的NLP库、词形还原准确、社区支持好
- **劣势**：首次使用需下载数据包、体积较大

#### 为什么用httpx？
- **优势**：异步HTTP客户端、与FastAPI配合好、支持超时控制
- **劣势**：相比requests需要学习异步编程

### 9. 关键风险点

#### 网络问题
- **风险**：Free Dictionary API访问可能被墙或超时
- **缓解**：添加Words API备用、考虑使用代理、增加超时时间

#### 并发问题
- **风险**：高并发查词可能触发API限流
- **缓解**：添加请求缓存、使用@lru_cache缓存词形还原结果

#### 数据质量
- **风险**：某些单词可能查不到或释义不准确
- **缓解**：提供多个词典源、允许用户反馈

#### 用户体验
- **风险**：中国用户更习惯中英双语释义
- **缓解**：集成有道词典API或其他支持中文释义的服务

### 10. 开发计划中的未完成功能

根据README.md，以下功能待实现：
- [ ] 用户注册登录
- [ ] 云端数据同步
- [ ] 词汇复习系统（间隔重复）
- [ ] 阅读统计分析
- [ ] 句子/段落翻译
- [ ] 更多书籍来源
- [ ] 移动端优化

### 11. 词典API优化建议

#### 短期优化（本次任务）
1. **添加有道词典API**：提供中英双语释义
2. **添加请求缓存**：减少API调用次数
3. **改进错误处理**：提供更友好的错误信息
4. **优化查询顺序**：优先使用缓存 → 有道 → Free Dictionary → Words API

#### 长期优化（后续规划）
1. **离线词典**：下载ECDICT或其他离线词典数据
2. **词典管理界面**：允许用户选择首选词典
3. **词典缓存持久化**：使用Redis或数据库
4. **词频统计**：记录查词次数，优化缓存策略
