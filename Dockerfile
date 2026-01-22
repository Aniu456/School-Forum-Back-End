# 多阶段构建 - 基础镜像
FROM node:20-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml ./

# ================================
# 依赖安装阶段
# ================================
FROM base AS dependencies

# 安装 openssl (Prisma 需要)
RUN apk add --no-cache openssl

# 安装所有依赖（包括 devDependencies）
RUN pnpm install --frozen-lockfile

# ================================
# 生产依赖阶段
# ================================
FROM base AS production-dependencies

RUN apk add --no-cache openssl

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# ================================
# 构建阶段
# ================================
FROM base AS build

RUN apk add --no-cache openssl

# 复制所有依赖
COPY --from=dependencies /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN pnpm exec prisma generate

# 构建应用
RUN pnpm run build

# ================================
# 生产运行阶段
# ================================
FROM node:20-alpine AS production

# 安装 PM2 和必要的系统依赖
RUN npm install -g pm2 && \
    apk add --no-cache openssl dumb-init

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 复制生产依赖
COPY --from=production-dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# 复制构建产物
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# 复制 Prisma schema 和 PM2 配置
COPY --chown=nestjs:nodejs prisma ./prisma
COPY --chown=nestjs:nodejs ecosystem.config.js ./

# 复制 package.json（用于脚本）
COPY --chown=nestjs:nodejs package.json ./

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 dumb-init 作为 PID 1，使用 PM2 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
