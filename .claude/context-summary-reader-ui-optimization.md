## 项目上下文摘要(阅读器界面优化)
生成时间: 2025-11-26

### 1. 相似实现分析
- **主组件**: frontend/src/components/ReaderPage.tsx
  - 模式:React Hooks + 状态管理
  - 可复用:已有的弹窗、设置面板、主题切换逻辑
  - 需注意:全屏模式、主题模式(dark/light)的一致性

### 2. 项目约定
- **命名约定**:
  - 组件使用PascalCase (如ReaderPage)
  - 状态变量使用camelCase (如showToc, fontSize)
  - CSS使用Tailwind utility classes
- **文件组织**:
  - 组件统一放在src/components/
  - 状态管理在src/stores/
  - API服务在src/services/
- **代码风格**:
  - 使用2空格缩进
  - 使用箭头函数
  - 条件渲染使用&&或三元运算符

### 3. 可复用组件清单
- `lucide-react`: 图标库 (已使用Maximize2, List, Settings, Eye, EyeOff等)
- Toast组件: src/components/Toast.tsx - 用于通知反馈
- 主题系统: theme状态 + localStorage持久化
- 弹窗模式: 使用fixed定位 + 遮罩层

### 4. 测试策略
- **测试框架**: 项目未配置自动化测试
- **测试模式**: 手动测试 - 运行npm run dev
- **验证要点**:
  - 不同屏幕尺寸的响应式布局
  - 暗色/亮色主题切换
  - 全屏模式切换
  - 拖拽功能流畅性

### 5. 依赖和集成点
- **外部依赖**:
  - React 18.3.1
  - Tailwind CSS 3.4.1
  - lucide-react 0.344.0
  - zustand 5.0.8 (状态管理)
- **内部依赖**:
  - useAppStore, useAuthStore (状态管理)
  - booksAPI, dictionaryAPI (API服务)
- **集成方式**: 直接导入使用

### 6. 技术选型理由
- **为什么用Tailwind CSS**: 快速开发,utility-first,响应式支持好
- **为什么用lucide-react**: 图标库轻量,风格统一,tree-shaking支持
- **为什么用zustand**: 轻量级状态管理,无需Provider包裹
- **优势**: 开发效率高,代码简洁
- **劣势和风险**:
  - 缺少自动化测试
  - 拖拽功能需要手动实现事件处理

### 7. 关键风险点
- **并发问题**: 无
- **边界条件**:
  - 拖拽时需要限制最小/最大宽度
  - 不同屏幕尺寸下的布局适配
- **性能瓶颈**:
  - 拖拽时频繁的状态更新需要考虑节流
- **安全考虑**: 无(前端UI优化)

### 8. 具体实施要点

#### 需求1: 阅读区域5xl并居中
- 当前: `max-w-6xl`(常规), `max-w-7xl`(全屏)
- 修改: `max-w-5xl`(常规), `max-w-5xl`(全屏)
- 位置: ReaderPage.tsx:686

#### 需求2: 字体调节移至设置
- 当前: 独立按钮在509-516行,独立面板在538-571行
- 修改:
  - 删除字体大小按钮和面板
  - 在设置弹窗(573-638行)中添加字体大小选项

#### 需求3: 全屏按钮调整
- 当前: 在475-481行,使用Maximize2图标,w-5 h-5
- 修改:
  - 移动到设置按钮(517-523行)左侧
  - 缩小图标尺寸,统一为w-4 h-4或w-4.5 h-4.5

#### 需求4: 目录弹窗左侧显示
- 当前: right-0在645行
- 修改: 改为left-0

#### 需求5: 翻译界面按钮增强
- 当前:
  - 词典模式dictionaryMode: 'fixed' | 'floating' | 'hidden'
  - 只有隐藏按钮(EyeOff图标)在767-773行
- 修改:
  - 添加模式切换按钮(切换fixed/floating)
  - 更新隐藏按钮样式(使用用户提供的图片样式)
  - 新增图标可能需要:PanelRightClose, PanelRightOpen, Move等

#### 需求6: 可调整大小侧边栏
- 实现方案:
  - 添加拖拽手柄在词典侧边栏左侧
  - 监听mousedown/mousemove/mouseup事件
  - 更新侧边栏宽度状态(sidebarWidth)
  - 限制最小宽度(256px)和最大宽度(512px)
  - 考虑使用节流优化性能

### 9. 图标使用说明
从lucide-react可用的图标:
- Maximize2: 全屏图标
- Minimize2: 退出全屏
- Eye/EyeOff: 显示/隐藏
- PanelRightClose/PanelRightOpen: 侧边栏收起/展开
- Move: 拖拽/移动图标
- Settings: 设置图标
