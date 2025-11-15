# 阿里云部署指南

## 📋 目录

1. [部署准备](#1-部署准备)
2. [阿里云资源配置](#2-阿里云资源配置)
3. [服务器环境搭建](#3-服务器环境搭建)
4. [应用部署](#4-应用部署)
5. [Nginx 配置](#5-nginx-配置)
6. [SSL 证书配置](#6-ssl-证书配置)
7. [监控与运维](#7-监控与运维)
8. [故障排查](#8-故障排查)

---

## 1. 部署准备

### 1.1 前置要求

**阿里云账号**
- 完成实名认证
- 充值一定金额（建议至少 500 元）
- 开通相关云服务权限

**本地环境**
- Git 客户端
- SSH 客户端
- 阿里云 CLI（可选）

### 1.2 费用预估

| 服务 | 规格 | 月费用（预估） |
|-----|------|---------------|
| ECS 服务器 | ecs.c6.large (2核4G) | ¥200-300 |
| RDS PostgreSQL | pg.n2.small.1 (1核2G) | ¥150-200 |
| Redis | redis.master.small | ¥80-120 |
| OSS | 标准存储 50GB | ¥10-20 |
| CDN | 流量 100GB | ¥20-30 |
| SLB 负载均衡 | 标准型 | ¥30-50 |
| **总计** | - | **¥490-720/月** |

*以上价格仅供参考，实际费用以阿里云官网为准*

---

## 2. 阿里云资源配置

### 2.1 创建 VPC 专有网络

1. 登录阿里云控制台
2. 进入 **VPC > 专有网络**
3. 点击创建专有网络

**配置参数**：
```
名称: school-forum-vpc
地域: 华东1（杭州）或就近选择
IPv4 网段: 192.168.0.0/16
```

**创建交换机**：
```
名称: school-forum-vswitch
可用区: 可用区A
IPv4 网段: 192.168.1.0/24
```

### 2.2 配置安全组

创建安全组并配置规则：

**入方向规则**：
| 协议 | 端口 | 授权对象 | 描述 |
|-----|------|---------|------|
| SSH | 22 | 你的 IP/0.0.0.0/0 | SSH 远程连接 |
| HTTP | 80 | 0.0.0.0/0 | HTTP 访问 |
| HTTPS | 443 | 0.0.0.0/0 | HTTPS 访问 |
| 自定义 | 3000 | 内网 | Node.js 应用 |
| PostgreSQL | 5432 | 内网 | 数据库连接 |
| Redis | 6379 | 内网 | Redis 连接 |

**出方向规则**：
- 允许所有流量

### 2.3 创建 ECS 实例

**实例配置**：
```
规格: ecs.c6.large (2核 4GB)
镜像: Ubuntu 22.04 64位
系统盘: 40GB SSD
数据盘: 100GB SSD（可选）
网络: 选择已创建的 VPC 和交换机
安全组: 选择已创建的安全组
公网IP: 分配公网 IPv4 地址
带宽: 按使用流量 5Mbps
```

**登录方式**：
- 创建密钥对或设置root密码
- 保存密钥文件到本地 `~/.ssh/aliyun-key.pem`

### 2.4 创建 RDS PostgreSQL 实例

1. 进入 **RDS > 创建实例**

**基础配置**：
```
版本: PostgreSQL 14
规格: pg.n2.small.1 (1核 2GB)
存储: 20GB SSD 云盘
网络: 选择已创建的 VPC
可用区: 与 ECS 相同可用区
```

**账号配置**：
```
账号名: school_forum_admin
密码: 设置强密码
```

**数据库配置**：
```
数据库名: school_forum
字符集: UTF8
排序规则: C
```

**白名单配置**：
- 添加 ECS 内网 IP
- 如需外网访问，添加 0.0.0.0/0（仅开发测试）

2. 获取连接信息：
```
内网地址: rm-xxxxx.pg.rds.aliyuncs.com
端口: 5432
```

### 2.5 创建 Redis 实例

1. 进入 **Redis > 创建实例**

**配置**：
```
版本: Redis 6.0
架构: 标准版-双副本
规格: redis.master.small.default (1核 1GB)
网络: 选择已创建的 VPC
可用区: 与 ECS 相同
```

**密码配置**：
- 设置 Redis 访问密码

2. 获取连接信息：
```
连接地址: r-xxxxx.redis.rds.aliyuncs.com
端口: 6379
```

### 2.6 创建 OSS Bucket

1. 进入 **OSS > Bucket 管理 > 创建 Bucket**

**配置**：
```
Bucket 名称: school-forum-files-[随机字符]
地域: 华东1（杭州）
存储类型: 标准存储
访问权限: 私有
版本控制: 不开启
```

**跨域配置（CORS）**：
```json
[
  {
    "allowedOrigins": [
      "https://yourdomain.com",
      "http://localhost:3000"
    ],
    "allowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "allowedHeaders": [
      "*"
    ],
    "exposeHeaders": [],
    "maxAgeSeconds": 3600
  }
]
```

**创建 RAM 用户**：
1. 进入 **RAM 访问控制 > 用户 > 创建用户**
2. 添加权限：AliyunOSSFullAccess
3. 创建 AccessKey

保存：
```
AccessKeyId: LTAI...
AccessKeySecret: xxx...
```

### 2.7 配置 CDN（可选）

1. 开通 CDN 服务
2. 添加加速域名：`cdn.yourdomain.com`
3. 源站类型：OSS 域名
4. 源站域名：选择已创建的 Bucket
5. 端口：443
6. 开启 HTTPS 加速

---

## 3. 服务器环境搭建

### 3.1 连接到 ECS 服务器

```bash
# 使用密钥连接
chmod 400 ~/.ssh/aliyun-key.pem
ssh -i ~/.ssh/aliyun-key.pem root@[ECS公网IP]

# 使用密码连接
ssh root@[ECS公网IP]
```

### 3.2 系统初始化

```bash
# 更新系统
apt update && apt upgrade -y

# 设置时区
timedatectl set-timezone Asia/Shanghai

# 安装基础工具
apt install -y curl wget git vim htop ufw
```

### 3.3 创建应用用户

```bash
# 创建非 root 用户
adduser deploy
usermod -aG sudo deploy

# 配置 sudo 免密码
echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 切换到 deploy 用户
su - deploy
```

### 3.4 安装 Node.js

```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 加载 NVM
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node -v  # v18.x.x
npm -v   # 9.x.x
```

### 3.5 安装 pnpm

```bash
npm install -g pnpm

# 验证
pnpm -v
```

### 3.6 安装 PM2

```bash
npm install -g pm2

# 设置开机自启
pm2 startup
# 按照提示执行命令
```

### 3.7 安装 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证
sudo nginx -v
curl http://localhost
```

### 3.8 配置防火墙

```bash
# 启用 UFW
sudo ufw enable

# 允许 SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

---

## 4. 应用部署

### 4.1 克隆代码

```bash
# 创建项目目录
sudo mkdir -p /var/www
sudo chown -R deploy:deploy /var/www

# 克隆代码
cd /var/www
git clone <your-repository-url> school-forum-backend
cd school-forum-backend
```

### 4.2 安装依赖

```bash
# 安装生产依赖
pnpm install --prod

# 如果需要构建，安装全部依赖
pnpm install
```

### 4.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

**生产环境配置**：
```env
NODE_ENV=production
PORT=3000

# 数据库（阿里云 RDS）
DATABASE_URL="postgresql://school_forum_admin:password@rm-xxxxx.pg.rds.aliyuncs.com:5432/school_forum"

# Redis（阿里云 Redis）
REDIS_HOST=r-xxxxx.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT（使用强密钥）
JWT_SECRET=生成的32位以上随机字符串
JWT_REFRESH_SECRET=生成的32位以上随机字符串

# 阿里云 OSS
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=你的AccessKeyId
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET=school-forum-files-xxx
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
```

### 4.4 数据库迁移

```bash
# 生成 Prisma Client
pnpm prisma generate

# 应用数据库迁移
pnpm prisma migrate deploy

# （可选）填充测试数据
# pnpm prisma db seed
```

### 4.5 构建应用

```bash
# 编译 TypeScript
pnpm run build

# 验证构建产物
ls -la dist/
```

### 4.6 使用 PM2 启动应用

```bash
# 启动应用
pm2 start dist/main.js --name school-forum-api

# 查看状态
pm2 status

# 查看日志
pm2 logs school-forum-api

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

**PM2 配置文件** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'school-forum-api',
    script: './dist/main.js',
    instances: 2,  // 多实例
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};
```

使用配置文件启动：
```bash
pm2 start ecosystem.config.js
```

---

## 5. Nginx 配置

### 5.1 创建 Nginx 配置文件

```bash
sudo vim /etc/nginx/sites-available/school-forum
```

**配置内容**：
```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;

    # 强制 HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/your-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/your-key.key;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 日志配置
    access_log /var/log/nginx/school-forum-access.log;
    error_log /var/log/nginx/school-forum-error.log;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain application/json application/javascript text/css application/xml;
    gzip_min_length 1000;

    # 反向代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # 限制请求体大小（文件上传）
    client_max_body_size 10M;
}
```

### 5.2 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/school-forum /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 6. SSL 证书配置

### 6.1 使用阿里云 SSL 证书

1. 在阿里云控制台申请免费 SSL 证书
2. 下载证书（Nginx 格式）
3. 上传到服务器

```bash
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl

# 上传证书文件（在本地执行）
scp -i ~/.ssh/aliyun-key.pem your-cert.pem deploy@[ECS-IP]:/tmp/
scp -i ~/.ssh/aliyun-key.pem your-key.key deploy@[ECS-IP]:/tmp/

# 在服务器上移动证书
sudo mv /tmp/your-cert.pem /etc/nginx/ssl/
sudo mv /tmp/your-key.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

### 6.2 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d api.yourdomain.com

# 设置自动续期
sudo certbot renew --dry-run

# 添加 cron 任务自动续期
sudo crontab -e
# 添加：
0 3 * * * /usr/bin/certbot renew --quiet
```

---

## 7. 监控与运维

### 7.1 PM2 监控

```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs school-forum-api
pm2 logs school-forum-api --lines 100

# 查看状态
pm2 status
pm2 describe school-forum-api

# 重启应用
pm2 restart school-forum-api

# 重载应用（零停机）
pm2 reload school-forum-api
```

### 7.2 系统监控

```bash
# 安装 htop
sudo apt install htop

# 监控系统资源
htop

# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看网络连接
netstat -tulnp
```

### 7.3 日志管理

```bash
# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/school-forum-access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/school-forum-error.log

# 查看应用日志
pm2 logs school-forum-api --lines 200
```

### 7.4 数据库备份

```bash
# 创建备份脚本
vim ~/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/backups/postgres"
DB_NAME="school_forum"
DB_HOST="rm-xxxxx.pg.rds.aliyuncs.com"
DB_USER="school_forum_admin"

mkdir -p $BACKUP_DIR

PGPASSWORD="your-password" pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > $BACKUP_DIR/backup-$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "backup-*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup-$DATE.sql"
```

```bash
# 添加执行权限
chmod +x ~/backup-db.sh

# 添加定时任务（每天凌晨 2 点备份）
crontab -e
# 添加：
0 2 * * * /home/deploy/backup-db.sh
```

---

## 8. 故障排查

### 8.1 常见问题

**应用无法启动**
```bash
# 检查端口占用
lsof -i :3000
netstat -tulnp | grep 3000

# 检查环境变量
cat .env

# 查看详细日志
pm2 logs school-forum-api --err
```

**数据库连接失败**
```bash
# 测试数据库连接
psql -h rm-xxxxx.pg.rds.aliyuncs.com -U school_forum_admin -d school_forum

# 检查白名单配置
# 在阿里云 RDS 控制台检查白名单

# 检查 VPC 网络配置
```

**Nginx 502 错误**
```bash
# 检查应用是否运行
pm2 status

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 8.2 性能优化

**启用 PM2 集群模式**
```bash
pm2 start dist/main.js -i max --name school-forum-api
```

**配置 Nginx 缓存**
```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# 在 location 块中添加
location / {
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    # ... 其他配置
}
```

---

## 9. 更新部署

### 9.1 应用更新流程

```bash
# 1. 拉取最新代码
cd /var/www/school-forum-backend
git pull origin main

# 2. 安装新依赖
pnpm install --prod

# 3. 运行数据库迁移
pnpm prisma generate
pnpm prisma migrate deploy

# 4. 重新构建
pnpm run build

# 5. 重载应用（零停机）
pm2 reload school-forum-api
```

### 9.2 自动化部署（可选）

创建部署脚本 `deploy.sh`：

```bash
#!/bin/bash
set -e

echo "🚀 开始部署..."

# 进入项目目录
cd /var/www/school-forum-backend

# 拉取最新代码
echo "📦 拉取最新代码..."
git pull origin main

# 安装依赖
echo "📦 安装依赖..."
pnpm install --prod

# 数据库迁移
echo "🗄️ 运行数据库迁移..."
pnpm prisma generate
pnpm prisma migrate deploy

# 构建应用
echo "🔨 构建应用..."
pnpm run build

# 重载应用
echo "♻️ 重载应用..."
pm2 reload school-forum-api

echo "✅ 部署完成！"
```

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-15
**维护者**: 后端开发团队
