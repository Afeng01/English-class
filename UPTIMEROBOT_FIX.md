# 🤖 UptimeRobot 配置指南

## 问题：405 Method Not Allowed

**错误截图显示**：
```
Root cause: 405 Method Not Allowed
Status: Ongoing
```

**原因**：UptimeRobot默认使用HEAD请求，但后端不支持。

---

## ✅ 解决方案：修改为GET请求

### Step 1：登录UptimeRobot

访问 https://uptimerobot.com/dashboard

### Step 2：编辑监控配置

1. 找到你创建的监控（`enacquire.onrender.com`）
2. 点击右侧的**编辑**按钮（铅笔图标）

### Step 3：修改HTTP方法

在编辑界面找到 **Advanced Settings**（高级设置）：

1. 展开 **Advanced Settings**
2. 找到 **HTTP Method**（HTTP方法）
3. 从 `HEAD` 改为 `GET`
4. 点击 **Save Changes**（保存更改）

**配置截图参考**：
```
┌─────────────────────────────────────────┐
│ Monitor Type: HTTP(s)                    │
│ URL: https://enacquire.onrender.com     │
│                                          │
│ Advanced Settings ▼                      │
│   HTTP Method: [GET ▼]  ← 选择GET       │
│   Custom HTTP Headers: (empty)           │
│   Keyword: (optional)                    │
│                                          │
│ [Save Changes]                           │
└─────────────────────────────────────────┘
```

### Step 4：等待下次检查

UptimeRobot会在下次检查时使用GET请求，错误应该会消失。

---

## 🎯 推荐的UptimeRobot配置

### 监控设置

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| **Monitor Type** | HTTP(s) | 监控类型 |
| **Friendly Name** | English Reading App Backend | 自定义名称 |
| **URL** | `https://enacquire.onrender.com` | 后端URL |
| **Monitoring Interval** | 5 minutes | 每5分钟检查一次（免费版） |
| **HTTP Method** | GET | ⚠️ 重要：使用GET而不是HEAD |
| **Keyword** | (留空或填"English Reading App API") | 可选：检查响应内容 |

### Alert Contacts（告警联系人）

建议配置邮箱或Webhook：
- 当服务宕机时立即收到通知
- 当服务恢复时也会通知

---

## 🔍 验证配置

### 测试后端API是否正常

打开浏览器或终端，测试后端：

```bash
# 测试根路径
curl https://enacquire.onrender.com/

# 预期返回（JSON格式）：
# {"message":"English Reading App API"}

# 测试API端点
curl https://enacquire.onrender.com/api/books/levels/options

# 预期返回：书籍等级选项列表
```

如果都返回正常，说明后端正常运行，只是不支持HEAD请求。

---

## ⚠️ 如果修改后仍然报错

### 检查1：后端是否正常运行

访问 Render Dashboard → 你的服务 → Logs

查看是否有错误日志。

### 检查2：URL是否正确

确认UptimeRobot中的URL是：
```
https://enacquire.onrender.com
```

**不要**加 `/api` 或其他路径。

### 检查3：后端是否休眠

Render免费版会在15分钟无访问后休眠：
- 首次访问需要30-60秒唤醒
- UptimeRobot可能在唤醒期间超时
- 解决方法：将Timeout设置为60秒

在UptimeRobot的Advanced Settings中：
```
Timeout: 60 seconds (默认30秒，改为60秒)
```

---

## 📊 预期效果

配置完成后，UptimeRobot应该显示：

```
✅ Status: Up
✅ Uptime: 100%
✅ Response Time: 200-500ms (首次唤醒可能更长)
```

**注意**：Render免费版首次唤醒需要30-60秒，这是正常的。

---

## 💡 进阶配置（可选）

### 配置关键词检测

在Advanced Settings中设置：
```
Keyword: English Reading App API
Keyword Type: exists
```

这样UptimeRobot不仅检查HTTP状态码，还会验证响应内容是否包含关键词。

### 配置多个监控

建议同时监控：
1. **后端API**: `https://enacquire.onrender.com`
2. **前端应用**: `https://enacquire.vercel.app`

这样前后端都能保持活跃。

---

## 🆘 仍然无法解决？

如果修改后仍然报错，提供以下信息：

1. UptimeRobot的错误详情截图
2. 后端Render的日志（最近10行）
3. 手动访问后端URL的结果（浏览器或curl）

---

**文档版本**：1.0
**更新时间**：2025-11-28
**适用场景**：Render免费版 + UptimeRobot监控
