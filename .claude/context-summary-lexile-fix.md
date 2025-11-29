## 项目上下文摘要（蓝思值系统修复）
生成时间：2025-11-28

### 1. 问题分析

**问题1：封面显示异常**
- 位置：[ShelfPage.tsx:364-375](frontend/src/components/ShelfPage.tsx#L364-L375), [HomePage.tsx:364-368](frontend/src/components/HomePage.tsx#L364-L368)
- 原因：封面图片加载失败时缺少fallback处理（HomePage的BookCard组件）
- 影响：部分书籍封面显示大字或其他异常内容

**问题2：标签系统混乱**
- 位置：[ShelfPage.tsx:389-394](frontend/src/components/ShelfPage.tsx#L389-L394), [HomePage.tsx:164-168](frontend/src/components/HomePage.tsx#L164-L168)
- 原因：仍然显示旧的"学前/一年级"等level标签，与蓝思值系统共存
- 需求：移除level标签，统一使用蓝思值

**问题3：蓝思值筛选失效（核心问题）**
- 位置：数据库模型 [database.py:22-38](backend/app/models/database.py#L22-L38)
- 根本原因：**SQLite的Book模型缺少lexile、series、category字段**
- 前端类型定义有这些字段：[types.ts:8-21](frontend/src/types.ts#L8-L21)
- 后端API返回的数据没有这些字段，导致前端筛选逻辑失效

### 2. 数据库字段缺失详情

**当前SQLite Book模型字段：**
- id, title, author, cover, level, word_count, description, epub_path, created_at

**缺失字段：**
- `lexile`: 蓝思值（如"530L"）
- `series`: 系列名（如"Magic Tree House"）
- `category`: 分类（'fiction' | 'non-fiction'）

### 3. 技术选型和架构

**数据存储架构：**
- 优先使用Supabase（云数据库）
- SQLite作为本地备用
- 双写策略：上传书籍时同时写入两个数据库

**问题：**
- Supabase可能已经有这些字段（需要验证）
- SQLite模型没有更新，导致备用方案失效

### 4. 解决方案

**步骤1：更新SQLite数据库模型**
- 在Book类中添加lexile、series、category字段
- 使用Column(String, nullable=True)确保兼容性

**步骤2：创建数据库迁移脚本**
- 使用ALTER TABLE添加新列
- 迁移现有数据（level映射到lexile）

**步骤3：更新书籍上传API**
- 修改upload_book接受新参数
- 更新import_epub函数支持新字段

**步骤4：修复前端显示**
- 移除level标签显示
- 统一封面错误处理
- 确保蓝思值在封面右上角正确显示

**步骤5：测试验证**
- 上传新书籍测试
- 验证筛选功能
- 检查封面显示

### 5. 可复用组件清单

- `frontend/src/components/ShelfPage.tsx`: 书架页面筛选逻辑（84-114行）
- `frontend/src/components/HomePage.tsx`: 主页筛选逻辑（58-91行）
- `backend/app/utils/supabase_client.py`: Supabase数据库操作
- `backend/app/api/books.py`: 书籍API端点

### 6. 关键风险点

**数据迁移风险：**
- 现有书籍数据可能丢失lexile值
- 需要手动或通过脚本补充

**兼容性风险：**
- 旧数据没有lexile字段，筛选时会被过滤掉
- 需要提供默认值或处理逻辑

**双数据库同步风险：**
- Supabase和SQLite字段不一致
- 需要统一schema定义
