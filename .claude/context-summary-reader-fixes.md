# 项目上下文摘要（阅读器功能修复）

生成时间：2025-11-25

## 问题总结

用户报告了3个问题：
1. **单词翻译只显示一个意思**：点击单词时应显示所有释义
2. **章节跳转错误**（最高优先级）：点击章节时显示错误的内容
3. **需要支持短语/句子翻译**：不只是单词，还要能翻译短语和句子

## 1. 项目结构分析

### 关键文件

**前端（使用中的文件）**：
- `frontend/src/App.tsx`：路由配置，使用 `components/ReaderPage`
- `frontend/src/components/ReaderPage.tsx`：**当前使用的阅读器组件**（用户确认）
- `frontend/src/components/BookDetailPage.tsx`：书籍详情页，负责导航到阅读器
- `frontend/src/services/api.ts`：API调用封装
- `frontend/src/types/index.ts`：类型定义

**前端（未使用的文件）**：
- `frontend/src/pages/ReaderPage.tsx`：旧版本，不在使用中

**后端**：
- `backend/app/api/dictionary.py`：词典API实现（有道翻译）
- `backend/app/api/books.py`：书籍和章节API

### 路由配置

```typescript
// App.tsx 第8行和第52行
import ReaderPage from './components/ReaderPage';
<Route path="/reader" element={<ReaderPage />} />
```

### 导航方式

```typescript
// BookDetailPage.tsx 第69行
navigate(`/reader?chapter=${chapterNumber}`);
```

传递的是 `chapter=${章节号}`（chapter_number，不是数组索引）

## 2. 问题1分析：单词多义项显示

### 后端实现（dictionary.py）

**API返回结构**：
```python
# 第248-258行：从有道API获取释义
explains = basic.get('explains', [])
for explain in explains[:5]:  # 最多取5条
    meanings.append({
        "partOfSpeech": "",
        "definitions": [{
            "definition": explain,
            "example": ""
        }]
    })
```

- ✅ 后端**支持多个释义**，最多返回5条
- ✅ 数据结构：`meanings` 是数组，每个meaning有definitions数组

### 前端实现（components/ReaderPage.tsx）

**显示逻辑**（第392-412行）：
```typescript
{wordDefinition.meanings.map((meaning, idx) => (
  <div key={idx}>
    {meaning.partOfSpeech && <div>{meaning.partOfSpeech}</div>}
    {meaning.definitions?.map((def, defIdx) => (
      <div key={defIdx}>
        <p>{defIdx + 1}. {def.definition}</p>
        {def.example && <p>"{def.example}"</p>}
      </div>
    ))}
  </div>
))}
```

- ✅ 前端代码**正确遍历**了所有meanings和definitions
- ✅ 会显示所有释义，带编号（1. 2. 3. ...）

### 结论

**代码本身没有问题**，前后端都支持多义项显示。可能的原因：
1. 有道API对某些单词确实只返回一个释义
2. 需要实际测试验证

### 建议方案

添加调试日志，确认后端返回了多少个释义。

## 3. 问题2分析：章节跳转错误（核心问题）

### 根本原因

**BookDetailPage导航传递的是章节号**：
```typescript
// BookDetailPage.tsx 第69行
navigate(`/reader?chapter=${chapterNumber}`);
// 例如：/reader?chapter=5（第5章）
```

**但是ReaderPage没有读取URL参数**：
```typescript
// components/ReaderPage.tsx 第49-54行
if (isInitialLoad.current) {
  const progress = progressStorage.get(currentBook.id);
  const chapterIndex = progress ? progress.chapter_number - 1 : 0;
  setCurrentChapterIndex(chapterIndex);
  isInitialLoad.current = false;
}
```

- ❌ **完全忽略了URL参数 `?chapter=X`**
- ❌ 只从 localStorage 读取进度
- ❌ 用户点击章节后，传递的参数被丢弃

### 状态管理方式

components/ReaderPage使用：
- `currentChapterIndex`：数组索引（0-based）
- `chapters[currentChapterIndex]`：根据索引获取章节
- 第81行：`chapters[currentChapterIndex].chapter_number` 获取真实章节号

### 对比：pages/ReaderPage的正确实现

```typescript
// pages/ReaderPage.tsx 第14行：从URL读取章节号
const initialChapter = parseInt(searchParams.get('chapter') || '1');

// 第44-53行：监听URL参数变化
useEffect(() => {
  const chapter = searchParams.get('chapter');
  if (chapter) {
    const chapterNum = parseInt(chapter);
    if (chapterNum !== chapterNumber) {
      setChapterNumber(chapterNum);
    }
  }
}, [searchParams]);
```

- ✅ 正确读取URL参数
- ✅ 监听参数变化
- ✅ 直接使用章节号而不是索引

### 修复方案

在 components/ReaderPage.tsx 中：
1. 使用 `useSearchParams()` 读取URL参数
2. 优先使用URL参数的章节号（转换为索引）
3. 监听URL参数变化，同步更新章节
4. 章节切换时更新URL参数

## 4. 问题3分析：短语/句子翻译

### 前端已支持文本选择

```typescript
// components/ReaderPage.tsx 第146-153行
const selection = window.getSelection();
const selectedText = selection?.toString().trim();

// 优先使用选中的文本
if (selectedText && /^[a-zA-Z'-]+$/.test(selectedText)) {
  setSelectedWord(selectedText.toLowerCase());
  return;
}
```

- ✅ 前端已经支持选中文本
- ⚠️ 但有限制：只匹配单个单词 `/^[a-zA-Z'-]+$/`（不含空格）
- ❌ 无法识别短语（如 "look forward to"）

### 后端API限制

```python
# dictionary.py 第299行
@router.get("/{word}", response_model=DictionaryResponse)
async def lookup_word(word: str):
```

- API设计为查询单词
- 有道翻译API实际上**支持短语和句子**翻译
- 需要修改：
  1. 前端正则表达式，允许空格和标点
  2. 后端查询逻辑，支持短语输入
  3. 可选：添加短语识别/提取算法

## 5. 可复用组件清单

### 状态管理
- `useAppStore`：全局状态管理（Zustand）
- `progressStorage`：阅读进度本地存储
- `vocabularyStorage`：生词本本地存储

### API调用
- `booksAPI.getBook(id)`：获取书籍详情
- `booksAPI.getChapters(bookId)`：获取章节列表
- `booksAPI.getChapter(bookId, chapterNumber)`：获取章节内容
- `dictionaryAPI.lookup(word)`：查询单词释义

### 工具函数
- `lemmatize_word(word)`：词形还原（后端）
- `getWordAtPoint(x, y)`：从点击位置提取单词（前端）

## 6. 命名和代码风格约定

### 命名约定
- React组件：PascalCase（如 `ReaderPage`, `BookDetailPage`）
- 变量和函数：camelCase（如 `currentChapter`, `loadChapter`）
- 类型/接口：PascalCase（如 `Chapter`, `DictionaryResult`）
- 常量：UPPER_SNAKE_CASE（如 `YOUDAO_APP_KEY`）

### 导入顺序
1. React相关
2. 第三方库
3. 本地组件
4. 服务和工具
5. 类型定义

### 代码风格
- 使用 TypeScript
- 使用箭头函数
- 使用 async/await 而不是 Promise.then()
- 使用 Tailwind CSS 进行样式

## 7. 测试策略

### 需要测试的场景

**章节跳转**：
1. 从BookDetailPage点击章节，应跳转到正确章节
2. 直接访问 `/reader?chapter=5`，应显示第5章
3. 在阅读器内切换章节，URL应同步更新
4. 浏览器前进/后退，章节应正确切换

**单词翻译**：
1. 点击单词，应显示所有释义（如果有多个）
2. 选中单词，应显示翻译
3. 点击生词本，应正确添加

**短语翻译**：
1. 选中短语（如 "look forward to"），应显示翻译
2. 选中句子，应显示翻译

## 8. 依赖和集成点

### 外部依赖
- **有道翻译API**：需要 `YOUDAO_APP_KEY` 和 `YOUDAO_APP_SECRET`
- React Router：用于路由和导航
- Zustand：全局状态管理
- Tailwind CSS：样式框架
- Lucide React：图标库

### 内部依赖
- ReaderPage 依赖 BookDetailPage 的导航参数
- 阅读进度依赖 localStorage
- 词典查询依赖有道API

## 9. 技术选型理由

### 为什么用组件索引（components/ReaderPage）
- **实际原因**：历史遗留，App.tsx导入的是这个版本
- **问题**：没有正确处理URL参数，导致章节跳转bug

### 为什么用有道翻译API
- 支持英汉翻译
- 提供音标和多义项
- 免费额度足够开发使用

## 10. 关键风险点

### 并发问题
- 快速切换章节时，可能有多个API请求并发
- 需要确保显示的是最新请求的结果

### 边界条件
- 章节号超出范围（如chapter=999）
- 章节号为负数或非数字
- chapters数组为空时的处理
- URL参数与实际章节列表不匹配

### 状态同步问题
- URL参数、组件状态、localStorage三者的同步
- 首次加载和后续切换的逻辑差异

### API限制
- 有道API请求频率限制
- API key配置错误
- 网络超时处理

## 修复优先级

1. **问题2（章节跳转）**：核心功能bug，必须立即修复
2. **问题1（多义项）**：验证是否真的有问题，可能只需添加日志
3. **问题3（短语翻译）**：新功能，可分阶段实现
