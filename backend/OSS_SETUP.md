# 阿里云OSS配置指南

本文档详细说明如何配置阿里云OSS来存储书籍图片，替代本地存储。

## 📋 为什么使用OSS？

### 优势对比

| 特性 | 本地存储 | OSS对象存储 |
|------|---------|------------|
| 磁盘占用 | 占用本地磁盘 | 零本地占用 ✅ |
| 扩展性 | 受限于磁盘大小 | 无限扩展 ✅ |
| 访问速度 | 依赖服务器带宽 | CDN全球加速 ✅ |
| 分布式部署 | 需要共享存储（NFS） | 天然支持 ✅ |
| 成本 | 硬件成本高 | 按量付费，极低 ✅ |
| 备份容灾 | 需要自行备份 | 自动多副本 ✅ |

### 成本估算

- **存储费用**：0.12元/GB/月
- **外网流量**：0.50元/GB（配置CDN后降至0.18元/GB）
- **示例**：100本书约1GB图片，每月成本约 **0.12元**

---

## 🚀 快速开始

### 步骤1：注册阿里云账号

1. 访问 [阿里云官网](https://www.aliyun.com/)
2. 注册并完成实名认证
3. 首次使用OSS有免费额度（6个月，40GB存储）

### 步骤2：创建OSS Bucket

1. 登录 [OSS控制台](https://oss.console.aliyun.com/)
2. 点击「创建Bucket」
3. 填写配置：
   ```
   Bucket名称：english-class-books（自定义，全局唯一）
   地域：华东1（杭州）或选择离你最近的节点
   存储类型：标准存储
   读写权限：公共读 ⚠️ 重要！
   版本控制：不启用
   服务端加密：不启用
   ```
4. 点击「确定」创建

**⚠️ 重要提示**：必须设置为「公共读」权限，否则前端无法访问图片！

### 步骤3：获取访问密钥（AccessKey）

**方式一：主账号密钥（快速但不推荐）**
1. 访问 [AccessKey管理](https://ram.console.aliyun.com/manage/ak)
2. 点击「创建AccessKey」
3. 保存 `AccessKey ID` 和 `AccessKey Secret`

**方式二：RAM子账号（推荐，更安全）**
1. 访问 [RAM控制台](https://ram.console.aliyun.com/users)
2. 创建用户 → 勾选「OpenAPI调用访问」
3. 为用户授权：`AliyunOSSFullAccess`（OSS完全权限）
4. 保存生成的 `AccessKey ID` 和 `AccessKey Secret`

### 步骤4：配置环境变量

1. 复制环境变量模板：
   ```bash
   cd backend
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入OSS配置：
   ```bash
   # 启用OSS
   USE_OSS=true

   # 填入你的AccessKey
   OSS_ACCESS_KEY_ID=你的AccessKey_ID
   OSS_ACCESS_KEY_SECRET=你的AccessKey_Secret

   # 填入地域节点（根据你创建Bucket时选择的地域）
   OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

   # 填入Bucket名称
   OSS_BUCKET_NAME=english-class-books
   ```

3. 保存文件

### 步骤5：安装依赖并启动服务

```bash
# 安装oss2依赖
pip install -r requirements.txt

# 重启后端服务
python main.py
```

### 步骤6：验证配置

启动后端后，查看日志应该看到：
```
INFO:app.utils.oss_helper:OSS初始化成功: bucket=english-class-books
```

如果看到警告信息，请检查配置是否正确。

---

## 🌍 常用地域节点（Endpoint）

| 地域 | Endpoint |
|------|----------|
| 华东1（杭州） | oss-cn-hangzhou.aliyuncs.com |
| 华东2（上海） | oss-cn-shanghai.aliyuncs.com |
| 华北2（北京） | oss-cn-beijing.aliyuncs.com |
| 华北3（张家口） | oss-cn-zhangjiakou.aliyuncs.com |
| 华南1（深圳） | oss-cn-shenzhen.aliyuncs.com |
| 西南1（成都） | oss-cn-chengdu.aliyuncs.com |
| 中国香港 | oss-cn-hongkong.aliyuncs.com |
| 美国（硅谷） | oss-us-west-1.aliyuncs.com |
| 美国（弗吉尼亚） | oss-us-east-1.aliyuncs.com |

**选择建议**：选择离你服务器或用户最近的节点，可降低延迟。

---

## ⚙️ 高级配置

### 配置CDN加速（推荐）

OSS支持绑定自定义域名并配置CDN，进一步提升访问速度：

1. 在OSS控制台选择Bucket → 域名管理
2. 绑定自定义域名（如：img.yourdomain.com）
3. 开启CDN加速
4. 修改 `oss_helper.py` 中的URL生成逻辑，使用CDN域名

### 配置跨域访问（CORS）

如果前端域名与OSS不同，需要配置CORS：

1. OSS控制台 → 选择Bucket → 权限管理 → 跨域设置
2. 添加规则：
   ```
   来源：* （或指定你的前端域名）
   允许Methods：GET, HEAD
   允许Headers：*
   暴露Headers：ETag
   ```

### 设置生命周期规则（降低成本）

如果有临时图片或想自动删除旧数据：

1. OSS控制台 → 选择Bucket → 基础设置 → 生命周期
2. 创建规则，设置自动删除或转为低频存储

---

## 🔄 从本地存储迁移到OSS

### 自动迁移（推荐）

配置完OSS后，新上传的书籍会自动使用OSS。已有本地图片可以继续使用。

### 手动迁移已有图片

如果想将已有本地图片迁移到OSS：

1. 使用OSS命令行工具（ossutil）批量上传：
   ```bash
   # 安装ossutil
   wget http://gosspublic.alicdn.com/ossutil/1.7.15/ossutil64
   chmod 755 ossutil64

   # 配置
   ./ossutil64 config

   # 批量上传
   ./ossutil64 cp -r backend/data/images/ oss://your-bucket-name/ -u
   ```

2. 更新数据库中的图片URL（需要手动编写SQL脚本）

---

## 🛡️ 安全最佳实践

### 1. 使用RAM子账号

不要使用主账号AccessKey，创建RAM子账号并授予最小权限：
- 仅授予OSS相关权限
- 定期轮换AccessKey
- 为不同环境（开发/生产）使用不同的子账号

### 2. 保护密钥安全

- ✅ 使用 `.env` 文件存储密钥
- ✅ 确保 `.env` 在 `.gitignore` 中（已配置）
- ❌ 永远不要将密钥提交到代码仓库
- ❌ 不要在日志中打印密钥

### 3. Bucket权限设置

- 对于图片资源：使用「公共读」权限
- 对于敏感数据：使用「私有」权限，通过签名URL访问

---

## 🐛 常见问题

### Q1: 启动后提示"OSS未启用或初始化失败"

**原因**：配置不正确或 `USE_OSS=false`

**解决**：
1. 检查 `.env` 文件中 `USE_OSS=true`
2. 确认所有配置项都已填写
3. 检查AccessKey是否正确
4. 检查Endpoint是否匹配Bucket所在地域

### Q2: 图片上传成功但前端无法显示

**原因**：Bucket权限设置为「私有」

**解决**：
1. OSS控制台 → 选择Bucket → 权限控制 → 读写权限
2. 修改为「公共读」
3. 重新上传测试

### Q3: 上传速度很慢

**原因**：网络问题或地域选择不当

**解决**：
1. 选择离你服务器最近的地域节点
2. 配置CDN加速
3. 检查网络带宽

### Q4: OSS费用超出预期

**原因**：外网流量费用或存储量过大

**解决**：
1. 配置CDN，降低外网流量费用
2. 开启图片压缩（在代码层面实现）
3. 设置生命周期规则，自动清理过期数据
4. 查看费用账单，定位问题

### Q5: 如何临时禁用OSS测试本地存储？

**解决**：修改 `.env` 文件：
```bash
USE_OSS=false
```
重启服务即可，系统会自动fallback到本地存储。

---

## 📊 监控与管理

### 查看OSS使用情况

1. 登录 [OSS控制台](https://oss.console.aliyun.com/)
2. 选择Bucket → 数据统计
3. 可查看：
   - 存储量趋势
   - 流量统计
   - 请求次数
   - 费用明细

### 查看访问日志

在OSS控制台启用日志存储功能，记录所有访问请求。

---

## 📞 技术支持

- **阿里云OSS文档**：https://help.aliyun.com/product/31815.html
- **OSS SDK文档**：https://help.aliyun.com/document_detail/32026.html
- **问题反馈**：如遇到集成问题，请提Issue或联系开发者

---

## 🎯 总结

配置OSS后，你将获得：
- ✅ 零本地存储占用
- ✅ 无限扩展能力
- ✅ 更快的图片加载速度
- ✅ 天然支持分布式部署
- ✅ 极低的运维成本

立即开始配置，享受云存储的便利吧！
