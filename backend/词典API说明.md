# 词典API说明

## ✅ 已完成的优化

### 1. 修复了环境变量加载问题
**问题**：配置了有道API但没有生效
**原因**：缺少 `python-dotenv` 库，`.env` 文件没有被读取
**解决**：
- 安装了 `python-dotenv==1.0.0`
- 在 `main.py` 中添加 `load_dotenv()` 加载环境变量
- 现在配置已正确加载：✅

### 2. 简化代码，只保留有道词典API
**移除的API**：
- ❌ Free Dictionary API（纯英文释义）
- ❌ Words API（需付费）

**保留的功能**：
- ✅ 有道词典API（中英双语释义）
- ✅ 请求缓存（24小时）
- ✅ 词形还原（NLTK）

### 3. 优化NLTK数据下载
**NLTK是什么？**
- NLTK = Natural Language Toolkit（自然语言工具包）
- 用于**词形还原**，将词形变化还原为原形
- 例如：`running → run`, `went → go`, `children → child`

**为什么需要保留？**
- 用户点击阅读器中的单词时，可能点击的是词形变化后的单词（如 `running`, `went`）
- 如果不还原，查词典会失败
- NLTK帮助我们智能还原，提高查词成功率

**数据下载说明**：
- 只在**首次启动**时下载（约5MB）
- 下载后会缓存到本地
- 后续启动会直接使用缓存，不再下载
- 下载过程是**自动的**，无需手动操作

## 🚀 如何使用

### 1. 确认配置
```bash
cd backend
cat .env  # 查看配置是否正确
```

确保内容类似：
```
YOUDAO_APP_KEY=你的应用ID
YOUDAO_APP_SECRET=你的应用密钥
```

### 2. 启动服务器
```bash
python3 -m uvicorn main:app --reload --port 8000
```

启动时会看到：
```
✅ NLTK数据已就绪
INFO:     Application startup complete.
```

### 3. 测试查词
打开浏览器访问：
- http://localhost:8000/api/dictionary/hello
- http://localhost:8000/api/dictionary/running
- http://localhost:8000/api/dictionary/went

应该返回中文释义。

## 📝 技术细节

### 查询流程
```
用户点击单词 "running"
    ↓
1. 检查缓存 → 未命中
    ↓
2. 查询有道API "running" → 失败（有道可能没有收录词形变化）
    ↓
3. 词形还原：running → run
    ↓
4. 查询有道API "run" → 成功！
    ↓
5. 返回结果并缓存
    ↓
6. 前端显示：
   "running" 的词根是 "run"
   n. 跑步；奔跑
   v. 跑；运转
```

### 缓存机制
- 查询结果缓存24小时
- 词形还原结果也会缓存（`@lru_cache`）
- 大幅减少API调用次数
- 服务重启后缓存会清空

### 词形还原规则
1. **优先检查不规则词映射**（141个常见不规则词）
   - went → go
   - children → child
   - better → good

2. **使用NLTK智能还原**
   - 识别词性（动词、名词、形容词、副词）
   - 根据词性规则还原
   - running → run
   - studies → study

3. **无法还原则返回原词**
   - hello → hello（已是原形）

## ⚠️ 注意事项

1. **必须配置有道词典API**
   - 如果未配置，查询会返回500错误
   - 错误提示："有道词典API未配置"

2. **NLTK数据下载**
   - 首次启动会自动下载（约5MB）
   - 需要网络连接
   - 如果下载失败，词形还原功能会受影响

3. **有道API限额**
   - 免费版有调用次数限制
   - 建议查看有道智云控制台监控用量
   - 超出限额后可以升级付费版

## 🐛 故障排查

### 问题1：启动时提示"有道词典API未配置"
**解决**：
1. 确认 `.env` 文件存在
2. 检查 `YOUDAO_APP_KEY` 和 `YOUDAO_APP_SECRET` 是否正确
3. 重启服务器

### 问题2：查词返回404
**可能原因**：
1. 单词拼写错误
2. 有道API没有收录该单词（很少见）
3. 词形还原失败

**解决**：查看后端日志，确认是哪一步失败

### 问题3：NLTK下载失败
**解决**：
```bash
python3 -c "
import nltk
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('averaged_perceptron_tagger')
"
```

## 📊 性能优化

当前优化：
- ✅ 请求缓存（24小时）
- ✅ 词形还原缓存（1000个词）
- ✅ 异步HTTP请求

未来可以考虑：
- 使用Redis持久化缓存
- 批量预加载常用词
- 添加离线词典支持

## 📚 相关文档

- [有道智云开放平台](https://ai.youdao.com/)
- [NLTK官方文档](https://www.nltk.org/)
- [FastAPI文档](https://fastapi.tiangolo.com/)
