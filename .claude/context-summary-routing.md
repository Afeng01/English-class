## 项目上下文摘要（前端路由实现）
生成时间：2025-11-25

### 1. 相似实现分析
- **当前实现**: frontend/src/App.tsx
  - 模式：基于状态的条件渲染
  - 实现方式：使用useState('currentPage')管理页面状态，通过条件判断渲染不同组件
  - 问题：URL不会变化，无法支持浏览器前进后退，无法分享特定页面链接

- **Navigation组件**: frontend/src/components/Navigation.tsx
  - 模式：回调函数模式
  - 实现方式：button onClick调用onNavigate回调函数
  - 需改造：改用Link组件实现真正的路由跳转

### 2. 项目约定
- **技术栈**: React 18.3.1 + TypeScript + Vite
- **状态管理**: Zustand (已安装)
- **UI框架**: Tailwind CSS
- **命名约定**:
  - 组件使用PascalCase (如HomePage, ShelfPage)
  - 页面类型定义为联合类型: `'home' | 'shelf' | 'vocab' | 'reader'`
- **文件组织**:
  - 组件放在src/components/
  - 页面放在src/pages/ (已存在但未使用)
  - 类型定义在src/types/
  - 服务在src/services/
- **代码风格**: 使用箭头函数、函数式组件、TypeScript严格模式

### 3. 可复用组件清单
- `src/stores/useAppStore.ts`: Zustand状态管理store
  - currentBook: 当前选中的书籍
  - setCurrentBook: 设置当前书籍
  - vocabulary: 用户词汇库
  - settings: 阅读器设置
- `src/services/api.ts`: API服务
- `src/components/Navigation.tsx`: 导航栏组件
- `src/components/HomePage.tsx`: 首页组件
- `src/components/ShelfPage.tsx`: 书架页面组件
- `src/components/VocabPage.tsx`: 词库页面组件
- `src/components/ReaderPage.tsx`: 阅读器页面组件

### 4. 测试策略
- **测试框架**: 未发现测试文件，项目未配置测试
- **验证方式**: 手动测试 + 本地运行验证
- **覆盖要求**:
  - 验证所有路由可访问
  - 验证URL正确变化
  - 验证浏览器前进后退功能
  - 验证状态在路由切换时正确传递

### 5. 依赖和集成点
- **外部依赖**:
  - axios: HTTP客户端
  - lucide-react: 图标库
  - zustand: 状态管理
  - **缺失**: react-router-dom (需要安装)
- **内部依赖**:
  - Navigation组件依赖onNavigate回调
  - 页面组件依赖useAppStore
  - ShelfPage调用booksAPI获取书籍列表
- **集成方式**:
  - 通过props传递导航函数
  - 通过Zustand共享全局状态
- **配置来源**: frontend/package.json, vite.config.ts

### 6. 技术选型理由
- **为什么需要react-router-dom**:
  - 实现真正的URL路由，支持浏览器历史记录
  - 支持页面分享和书签
  - 符合现代Web应用的标准实践
- **优势**:
  - SEO友好（如果需要SSR）
  - 用户体验更好（前进后退按钮）
  - 开发体验好（声明式路由配置）
- **劣势和风险**:
  - 需要修改现有导航逻辑
  - 需要处理状态在路由间的传递（通过Zustand解决）

### 7. 关键风险点
- **状态管理**:
  - currentBook状态需要在路由切换时保持
  - 解决方案：已使用Zustand，状态独立于路由
- **边界条件**:
  - 404页面处理（未知路由）
  - 直接访问特定URL时的状态初始化
  - 阅读器页面需要先选择书籍
- **性能瓶颈**:
  - 路由懒加载可能需要（当前页面数量少，暂不需要）
- **兼容性**:
  - 需要确保导航逻辑改动不破坏现有功能
  - ShelfPage的onNavigate参数需要改为使用useNavigate hook
