# 英语分级阅读应用 - 设计系统规范

生成时间：2025-11-23

## 设计哲学

**核心理念**：「阅读即沉浸，学习即成长」

**美学方向**：现代图书馆 × 文学沙龙 × 极简主义
- 以内容为中心，移除所有视觉干扰
- 温暖、优雅、有呼吸感的空间设计
- 精致的排版和字体层次
- 克制使用色彩，强调内容本身

---

## 🎨 配色系统

### 主色调（Core Colors）
```css
--color-canvas: #FAFAF8;        /* 画布背景（温暖米白） */
--color-surface: #F5F5F0;       /* 卡片/次要背景（奶油米色） */
--color-elevated: #FFFFFF;      /* 悬浮元素背景 */
```

### 文本色（Text Colors）
```css
--color-text-primary: #1A1A1A;     /* 主文本（深灰黑） */
--color-text-secondary: #5A5A5A;   /* 次要文本（中性灰） */
--color-text-tertiary: #8A8A8A;    /* 辅助文本（浅灰） */
--color-text-disabled: #BFBFBF;    /* 禁用文本 */
```

### 强调色（Accent Colors）
```css
--color-accent-primary: #2C5F2D;   /* 主强调色（深林绿，象征成长） */
--color-accent-hover: #234A24;     /* hover 状态 */
--color-accent-light: #E8F5E9;     /* 浅色背景 */

--color-accent-secondary: #8B7355; /* 次要强调色（书本棕） */
```

### 功能色（Functional Colors）
```css
--color-success: #2E7D32;          /* 成功/已掌握 */
--color-warning: #E65100;          /* 警告 */
--color-info: #1565C0;             /* 信息 */
--color-error: #C62828;            /* 错误 */
```

### 中性灰阶（Neutrals）
```css
--color-gray-50: #FAFAFA;
--color-gray-100: #F5F5F5;
--color-gray-200: #EEEEEE;
--color-gray-300: #E0E0E0;
--color-gray-400: #BDBDBD;
--color-gray-500: #9E9E9E;
--color-gray-600: #757575;
--color-gray-700: #616161;
--color-gray-800: #424242;
--color-gray-900: #212121;
```

---

## 📝 字体系统

### 字体家族（Font Families）
```css
/* 标题字体 - 优雅的衬线体 */
--font-display: 'Noto Serif SC', 'Playfair Display', Georgia, serif;

/* 正文字体 - 清晰的无衬线体 */
--font-body: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;

/* 英文阅读字体 - 专为长文阅读优化 */
--font-reading: 'Literata', 'Merriweather', Georgia, serif;

/* 代码/等宽字体 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 字体尺寸（Font Sizes）
```css
--text-xs: 0.75rem;      /* 12px - 辅助信息 */
--text-sm: 0.875rem;     /* 14px - 次要文本 */
--text-base: 1rem;       /* 16px - 正文 */
--text-lg: 1.125rem;     /* 18px - 强调正文 */
--text-xl: 1.25rem;      /* 20px - 小标题 */
--text-2xl: 1.5rem;      /* 24px - 卡片标题 */
--text-3xl: 1.875rem;    /* 30px - 页面标题 */
--text-4xl: 2.25rem;     /* 36px - Hero 标题 */
--text-5xl: 3rem;        /* 48px - 大型标题 */
--text-6xl: 3.75rem;     /* 60px - 超大标题 */
```

### 字重（Font Weights）
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 行高（Line Heights）
```css
--leading-tight: 1.25;    /* 标题 */
--leading-snug: 1.375;    /* 副标题 */
--leading-normal: 1.5;    /* 正文 */
--leading-relaxed: 1.625; /* 舒适阅读 */
--leading-loose: 2;       /* 极度舒适 */
```

---

## 📏 间距系统

### 基础间距（Spacing Scale）
使用 8px 网格系统：
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### 容器宽度（Container Widths）
```css
--container-sm: 640px;   /* 小屏内容 */
--container-md: 768px;   /* 中等内容 */
--container-lg: 1024px;  /* 大屏内容 */
--container-xl: 1280px;  /* 超大内容 */
--container-reading: 720px; /* 阅读最佳宽度 */
```

---

## 🎭 视觉效果

### 圆角（Border Radius）
```css
--radius-sm: 0.25rem;   /* 4px - 小元素 */
--radius-base: 0.5rem;  /* 8px - 按钮、输入框 */
--radius-lg: 0.75rem;   /* 12px - 卡片 */
--radius-xl: 1rem;      /* 16px - 大卡片 */
--radius-2xl: 1.5rem;   /* 24px - 模态框 */
--radius-full: 9999px;  /* 圆形 */
```

### 阴影（Shadows）
极简风格，使用细边框代替重阴影：
```css
/* 轻微提升 */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);

/* 卡片 */
--shadow-base: 0 1px 3px rgba(0, 0, 0, 0.06);

/* 悬浮卡片 */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08);

/* 模态框 */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* 替代方案：细边框 */
--border-light: 1px solid #E8E8E8;
--border-base: 1px solid #D4D4D4;
--border-dark: 1px solid #A3A3A3;
```

### 毛玻璃效果（Backdrop Blur）
```css
--blur-sm: blur(4px);
--blur-base: blur(8px);
--blur-md: blur(12px);
--blur-lg: blur(16px);

/* 毛玻璃背景 */
--glass-background: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.2);
```

---

## 🎬 动画系统

### 过渡时长（Transition Durations）
```css
--duration-fast: 150ms;     /* 微交互 */
--duration-base: 250ms;     /* 标准过渡 */
--duration-slow: 350ms;     /* 复杂动画 */
--duration-slower: 500ms;   /* 页面级动画 */
```

### 缓动函数（Easing Functions）
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性效果 */
```

### 常用动画
```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 向上滑入 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 缩放弹出 */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 🧩 组件规范

### Button（按钮）

**主要按钮**：
- 背景：`--color-accent-primary`
- 文本：白色
- 圆角：`--radius-base`
- 内边距：`16px 32px`
- hover：轻微缩放（scale: 1.02）+ 颜色加深

**次要按钮**：
- 背景：透明
- 文本：`--color-text-primary`
- 边框：`--border-base`
- hover：背景变为 `--color-surface`

**文本按钮**：
- 背景：透明
- 文本：`--color-accent-primary`
- hover：下划线动画

### Card（卡片）

**标准卡片**：
- 背景：`--color-elevated`
- 边框：`--border-light`（不使用阴影）
- 圆角：`--radius-lg`
- 内边距：`24px`
- hover：边框颜色加深 + 轻微上移（translateY: -2px）

**书籍卡片**：
- 封面：3:4 比例
- 悬浮时：封面轻微放大（scale: 1.05）
- 标题：2 行截断（line-clamp）

### Input（输入框）

- 背景：`--color-surface`
- 边框：`--border-light`
- 圆角：`--radius-base`
- 内边距：`12px 16px`
- focus：边框变为 `--color-accent-primary`，添加 2px 外发光

### Navigation（导航栏）

- 背景：毛玻璃效果（`--glass-background` + `backdrop-filter: blur(12px)`）
- 高度：`64px`
- 内边距：`0 32px`
- sticky 定位，滚动时保持在顶部

---

## 📱 响应式断点

```css
/* 移动端 */
@media (max-width: 640px) { ... }

/* 平板 */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* 桌面端 */
@media (min-width: 1025px) { ... }
```

---

## 🎯 设计原则

1. **内容优先**：所有设计服务于阅读体验
2. **极简克制**：移除不必要的装饰，让内容呼吸
3. **温暖人性**：使用温暖的米色背景，避免纯白的冷感
4. **精致细节**：每个间距、每个过渡都经过精心调校
5. **一致性**：严格遵循设计系统，确保全局统一

---

## 🚀 实施优先级

1. **Phase 1**：全局样式重置、设计 token 定义、字体引入
2. **Phase 2**：通用组件库（Button、Card、Input、Navigation）
3. **Phase 3**：页面重构（HomePage → BooksPage → ReaderPage）
4. **Phase 4**：动画和微交互优化

---

生成工具：Claude Code + frontend-design skill
