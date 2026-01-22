# 校园论坛 API 文档

> **版本**: v2.1
> **更新时间**: 2026-01-09
> **基础 URL**: `http://localhost:3000` (开发) / `https://api.your-domain.com` (生产)
> **接口总数**: 120+

---

## 📋 目录

1. [认证模块 (Auth)](#1-认证模块-auth)
2. [用户模块 (Users)](#2-用户模块-users)
3. [帖子模块 (Posts)](#3-帖子模块-posts)
4. [评论模块 (Comments)](#4-评论模块-comments)
5. [社交模块 (Social)](#5-社交模块-social)
6. [通知模块 (Notifications)](#6-通知模块-notifications)
7. [私信模块 (Conversations)](#7-私信模块-conversations)
8. [公告模块 (Announcements)](#8-公告模块-announcements)
9. [搜索模块 (Search)](#9-搜索模块-search)
10. [推荐模块 (Recommendations)](#10-推荐模块-recommendations)
11. [算法模块 (Algorithms)](#11-算法模块-algorithms)
12. [服务中心 (Service Center)](#12-服务中心-service-center)
13. [动态流 (Activities)](#13-动态流-activities)
14. [文件上传 (Upload)](#14-文件上传-upload)
15. [管理员模块 (Admin)](#15-管理员模块-admin)
16. [已禁用功能](#16-已禁用功能)

---

## 🔑 认证说明

### JWT Token

大部分接口需要在请求头中携带 JWT Token:

```http
Authorization: Bearer <your_access_token>
```

### 公开接口

标记为 `🌐 Public` 的接口无需认证即可访问。

---

## 1. 认证模块 (Auth)

### 1.1 用户注册

```http
POST /auth/register
```

**🌐 Public** | 普通学生注册

**请求体**:

```json
{
  "username": "string", // 用户名，3-50字符
  "email": "string", // 邮箱
  "password": "string", // 密码，6-50字符
  "nickname": "string" // 昵称（可选）
}
```

**响应**:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "nickname": "string",
    "role": "USER"
  }
}
```

---

### 1.2 管理员注册

```http
POST /auth/register-admin
```

**🌐 Public** | 需要管理员密钥

**请求体**:

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "nickname": "string",
  "adminSecret": "string" // 管理员密钥（环境变量配置）
}
```

---

### 1.3 用户登录

```http
POST /auth/login
```

**🌐 Public**

**请求体**:

```json
{
  "email": "string", // 邮箱或用户名
  "password": "string"
}
```

**响应**:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    /* 用户信息 */
  }
}
```

---

### 1.4 刷新 Token

```http
POST /auth/refresh
```

**🌐 Public**

**请求体**:

```json
{
  "refreshToken": "string"
}
```

---

### 1.5 忘记密码 - 发送验证码

```http
POST /auth/forgot-password
```

**🌐 Public**

**请求体**:

```json
{
  "email": "string"
}
```

---

### 1.6 重置密码

```http
POST /auth/reset-password
```

**🌐 Public**

**请求体**:

```json
{
  "email": "string",
  "code": "string", // 验证码
  "newPassword": "string"
}
```

---

### 1.7 登出

```http
POST /auth/logout
```

**🔒 需要认证**

---

## 2. 用户模块 (Users)

### 2.1 获取当前用户资料

```http
GET /users/me
```

**🔒 需要认证**

**响应**:

```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "nickname": "string",
  "avatar": "string",
  "bio": "string",
  "role": "USER" | "ADMIN",
  "followerCount": 0,
  "followingCount": 0,
  "createdAt": "datetime"
}
```

---

### 2.2 更新当前用户资料

```http
PATCH /users/me
```

**🔒 需要认证**

**请求体**:

```json
{
  "nickname": "string", // 可选
  "avatar": "string", // 可选，图片URL
  "bio": "string" // 可选，个人简介
}
```

---

### 2.3 获取用户详情

```http
GET /users/:id
```

**🔒 需要认证**

**路径参数**:

- `id`: 用户 ID (UUID)

---

### 2.4 获取用户发帖列表

```http
GET /users/:id/posts
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 2.5 获取用户点赞列表

```http
GET /users/:id/likes
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 2.6 获取用户活动

```http
GET /users/:id/activity
```

**🌐 Public**

**查询参数**:

- `type`: 活动类型（可选）
- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

## 3. 帖子模块 (Posts)

### 3.1 创建帖子

```http
POST /posts
```

**🔒 需要认证**

**请求体**:

```json
{
  "title": "string", // 标题，1-200字符
  "content": "string", // 内容
  "images": ["string"], // 图片URL数组（可选）
  "tags": ["string"] // 标签数组（可选）
}
```

**标签示例**:

- `["校园活动", "社团招新"]` - 普通话题
- `["二手交易", "自行车"]` - 二手交易（替代专门的二手交易表）
- `["学习资源", "高数"]` - 学习资源（替代专门的学习资源表）

---

### 3.2 获取帖子列表

```http
GET /posts
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20
- `sortBy`: 排序字段，`createdAt` | `viewCount`，默认 `createdAt`
- `order`: 排序方向，`asc` | `desc`，默认 `desc`
- `tag`: 按标签筛选（可选）
- `authorId`: 按作者筛选（可选）

**响应**:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "images": ["string"],
      "tags": ["string"],
      "viewCount": 0,
      "likeCount": 0,
      "commentCount": 0,
      "isPinned": false,
      "isHighlighted": false,
      "author": {
        "id": "uuid",
        "username": "string",
        "nickname": "string",
        "avatar": "string"
      },
      "createdAt": "datetime"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 3.3 获取帖子详情

```http
GET /posts/:id
```

**🌐 Public**

**路径参数**:

- `id`: 帖子 ID (UUID)

**功能**: 自动增加浏览计数

---

### 3.4 获取帖子评论列表

```http
GET /posts/:id/comments
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20
- `sortBy`: 排序，`createdAt` | `likeCount`，默认 `createdAt`
- `previewLimit`: 二级评论预览数量，默认 3

---

### 3.5 更新帖子

```http
PATCH /posts/:id
```

**🔒 需要认证** | 仅作者或管理员

**请求体**:

```json
{
  "title": "string", // 可选
  "content": "string", // 可选
  "images": ["string"], // 可选
  "tags": ["string"] // 可选
}
```

---

### 3.6 删除帖子

```http
DELETE /posts/:id
```

**🔒 需要认证** | 仅作者或管理员

---

## 4. 评论模块 (Comments)

### 4.1 创建评论

```http
POST /comments
```

**🔒 需要认证**

**请求体**:

```json
{
  "postId": "uuid", // 帖子ID
  "content": "string", // 评论内容
  "parentId": "uuid" // 父评论ID（可选，用于回复）
}
```

---

### 4.2 获取评论的回复列表

```http
GET /comments/:id/replies
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 4.3 删除评论

```http
DELETE /comments/:id
```

**🔒 需要认证** | 仅作者或管理员

---

## 5. 社交模块 (Social)

### 5.1 点赞/取消点赞

```http
POST /likes/toggle
```

**🔒 需要认证**

**请求体**:

```json
{
  "targetId": "uuid",        // 目标ID（帖子或评论）
  "targetType": "POST" | "COMMENT"
}
```

**响应**:

```json
{
  "action": "liked" | "unliked",
  "likeCount": 10
}
```

---

### 5.2 关注用户

```http
POST /users/:id/follow
```

**🔒 需要认证**

**路径参数**:

- `id`: 要关注的用户 ID

---

### 5.3 取消关注用户

```http
DELETE /users/:id/follow
```

**🔒 需要认证**

---

### 5.4 获取关注状态

```http
GET /users/:id/follow/status
```

**🔒 需要认证**

**响应**:

```json
{
  "isFollowing": true
}
```

---

### 5.5 获取用户关注列表

```http
GET /users/:id/following
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 5.6 获取用户粉丝列表

```http
GET /users/:id/followers
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 5.7 收藏帖子

```http
POST /favorites
```

**🔒 需要认证**

**请求体**:

```json
{
  "postId": "uuid",
  "note": "string"
}
```

---

### 5.8 切换收藏状态

```http
POST /favorites/toggle
```

**🔒 需要认证**

**请求体**:

```json
{
  "postId": "uuid"
}
```

**响应示例**:

```json
{
  "isFavorited": true,
  "message": "收藏成功"
}
```

---

### 5.9 获取用户收藏列表

```http
GET /favorites
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

**响应示例**:

```json
{
  "data": [
    {
      "id": "uuid",
      "postId": "uuid",
      "note": "收藏备注",
      "createdAt": "datetime",
      "post": {
        "id": "uuid",
        "title": "帖子标题",
        "content": "帖子内容",
        "author": {
          "id": "uuid",
          "username": "string",
          "nickname": "string"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 5.10 检查收藏状态

```http
GET /favorites/check/:postId
```

**🔒 需要认证**

**路径参数**:

- `postId`: 帖子 ID

**响应示例**:

```json
{
  "isFavorited": true
}
```

---

### 5.11 取消收藏（通过收藏ID）

```http
DELETE /favorites/:id
```

**🔒 需要认证**

**路径参数**:

- `id`: 收藏记录 ID

---

### 5.12 取消收藏（通过帖子ID）

```http
DELETE /favorites/post/:postId
```

**🔒 需要认证**

**路径参数**:

- `postId`: 帖子 ID

---

## 6. 通知模块 (Notifications)

### 6.1 获取通知列表

```http
GET /notifications
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20
- `isRead`: 筛选已读/未读，`true` | `false`（可选）
- `type`: 通知类型（可选）
  - `COMMENT` - 评论通知
  - `REPLY` - 回复通知
  - `LIKE` - 点赞通知
  - `SYSTEM` - 系统通知
  - `NEW_POST` - 关注的人发布新帖
  - `NEW_FOLLOWER` - 新粉丝关注

---

### 6.2 获取未读通知数量

```http
GET /notifications/unread/count
```

**🔒 需要认证**

**响应**:

```json
{
  "count": 5
}
```

---

### 6.3 标记通知为已读

```http
PATCH /notifications/:id/read
```

**🔒 需要认证**

---

### 6.4 标记所有通知为已读

```http
POST /notifications/read-all
```

**🔒 需要认证**

---

### 6.5 按关联ID标记通知已读

```http
PATCH /notifications/related/:relatedId/read
```

**🔒 需要认证**

**路径参数**:

- `relatedId`: 关联ID（如会话ID）

**查询参数**:

- `type`: 通知类型（可选）

**功能**: 批量标记某个关联对象（如私信会话）的所有通知为已读

---

### 6.6 删除通知

```http
DELETE /notifications/:id
```

**🔒 需要认证**

---

## 7. 私信模块 (Conversations)

### 7.1 创建或获取会话

```http
POST /conversations
```

**🔒 需要认证**

**请求体**:

```json
{
  "participantId": "uuid" // 对方用户ID
}
```

**响应**:

```json
{
  "id": "uuid",
  "type": "DIRECT",
  "participants": [
    {
      "userId": "uuid",
      "user": {
        /* 用户信息 */
      }
    }
  ],
  "createdAt": "datetime"
}
```

---

### 7.2 获取会话列表

```http
GET /conversations
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 7.3 获取未读消息数

```http
GET /conversations/unread-count
```

**🔒 需要认证**

**响应**:

```json
{
  "count": 3
}
```

---

### 7.4 获取会话详情

```http
GET /conversations/:id
```

**🔒 需要认证**

---

### 7.5 获取会话消息列表

```http
GET /conversations/:id/messages
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 50

---

### 7.6 发送消息

```http
POST /conversations/:id/messages
```

**🔒 需要认证**

**请求体**:

```json
{
  "content": "string" // 消息内容
}
```

---

### 7.7 删除消息

```http
DELETE /conversations/messages/:messageId
```

**🔒 需要认证**

---

### 7.8 删除会话

```http
DELETE /conversations/:id
```

**🔒 需要认证**

**功能**: 会级联删除所有消息

---

## 8. 公告模块 (Announcements)

### 8.1 获取公告列表

```http
GET /announcements
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

**响应**:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "type": "INFO" | "WARNING" | "URGENT",
      "isPinned": false,
      "publishedAt": "datetime",
      "author": {
        "id": "uuid",
        "username": "string",
        "nickname": "string"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 8.2 获取公告详情

```http
GET /announcements/:id
```

**🌐 Public**

**路径参数**:

- `id`: 公告 ID (UUID)

---

### 8.3 创建公告

```http
POST /announcements
```

**🔒 需要认证** | **仅管理员**

**请求体**:

```json
{
  "title": "string",
  "content": "string",
  "type": "INFO" | "WARNING" | "URGENT",
  "targetRole": "USER" | "ADMIN",
  "isPinned": false,
  "isPublished": true
}
```

---

### 8.4 更新公告

```http
PUT /announcements/:id
```

**🔒 需要认证** | **仅管理员**

---

### 8.5 删除公告

```http
DELETE /announcements/:id
```

**🔒 需要认证** | **仅管理员**

---

### 8.6 隐藏/显示公告

```http
PATCH /announcements/:id/toggle-hidden
```

**🔒 需要认证** | **仅管理员**

**请求体**:

```json
{
  "isHidden": true | false
}
```

---

### 8.7 获取所有公告（管理员视图）

```http
GET /announcements/admin/all
```

**🔒 需要认证** | **仅管理员**

**功能**: 返回所有公告，包括未发布和已隐藏的

---

### 8.8 批量删除公告

```http
POST /announcements/admin/bulk-delete
```

**🔒 需要认证** | **仅管理员**

**请求体**:

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 9. 搜索模块 (Search)

### 9.1 搜索帖子

```http
GET /search/posts
```

**🌐 Public**

**查询参数**:

- `q`: 搜索关键词（**必填**）
- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20
- `sortBy`: 排序方式，`relevance` | `createdAt` | `viewCount`，默认 `relevance`
- `tag`: 按标签筛选（可选）

**响应**:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "images": ["string"],
      "tags": ["string"],
      "viewCount": 0,
      "likeCount": 0,
      "commentCount": 0,
      "author": {
        "id": "uuid",
        "username": "string",
        "nickname": "string",
        "avatar": "string"
      },
      "createdAt": "datetime"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 9.2 搜索用户

```http
GET /search/users
```

**🌐 Public**

**查询参数**:

- `q`: 搜索关键词（**必填**）
- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

**响应**:

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string",
      "bio": "string",
      "followerCount": 0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 9.3 获取热门标签

```http
GET /search/tags/popular
```

**🌐 Public**

**查询参数**:

- `limit`: 返回数量，默认 10

**响应**:

```json
{
  "data": [
    {
      "tag": "校园活动",
      "count": 156
    },
    {
      "tag": "学习交流",
      "count": 120
    }
  ]
}
```

---

## 10. 推荐模块 (Recommendations)

### 10.1 获取热门帖子

```http
GET /recommendations/posts/hot
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20（最大 100）

**说明**: 基于点赞、评论、浏览量综合评分的热门帖子

---

### 10.2 获取趋势帖子

```http
GET /recommendations/posts/trending
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20（最大 100）

**说明**: 最近时间段内热度增长最快的帖子

---

### 10.3 获取最新帖子

```http
GET /recommendations/posts/latest
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20（最大 100）

---

### 10.4 获取关注用户的帖子

```http
GET /recommendations/following
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

**说明**: 返回当前用户关注的人发布的帖子

---

### 10.5 获取关注动态（别名）

```http
GET /recommendations/following-feed
```

**🔒 需要认证**

**说明**: 与 `/recommendations/following` 功能相同

---

### 10.6 获取个性化推荐

```http
GET /recommendations/personalized
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20（最大 100）

**说明**: 基于用户关注和互动行为的个性化推荐

---

### 10.7 获取热门话题

```http
GET /recommendations/topics/hot
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20（最大 100）

---

### 10.8 获取所有话题

```http
GET /recommendations/topics
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20（最大 100）

---

## 11. 算法模块 (Algorithms)

> 提供底层算法接口，用于热帖计算、标签分析等

### 11.1 获取热门帖子

```http
GET /algorithms/hot-posts
```

**🌐 Public**

**查询参数**:

- `limit`: 返回数量，默认 20

---

### 11.2 获取趋势帖子

```http
GET /algorithms/trending-posts
```

**🌐 Public**

**查询参数**:

- `limit`: 返回数量，默认 20

---

### 11.3 获取优质帖子

```http
GET /algorithms/quality-posts
```

**🌐 Public**

**查询参数**:

- `limit`: 返回数量，默认 20

**说明**: 基于点赞率和评论质量筛选的优质帖子

---

### 11.4 获取热门标签

```http
GET /algorithms/hot-tags
```

**🌐 Public**

**查询参数**:

- `limit`: 返回数量，默认 20

---

### 11.5 获取趋势标签

```http
GET /algorithms/trending-tags
```

**🌐 Public**

**查询参数**:

- `limit`: 返回数量，默认 10

**说明**: 最近增长最快的标签

---

### 11.6 搜索标签

```http
GET /algorithms/search-tags
```

**🌐 Public**

**查询参数**:

- `q`: 搜索关键词
- `limit`: 返回数量，默认 10

---

### 11.7 获取相关标签

```http
GET /algorithms/related-tags
```

**🌐 Public**

**查询参数**:

- `tags`: 标签列表（逗号分隔，如 `数学,学习`）
- `limit`: 返回数量，默认 5

**说明**: 返回经常与指定标签一起使用的相关标签

---

## 12. 服务中心 (Service Center)

> 提供垂直场景化的内容分类接口，基于标签系统实现

### 12.1 获取服务中心分类

```http
GET /service-center/categories
```

**🌐 Public**

**响应**:

```json
{
  "data": [
    {
      "key": "club-recruitment",
      "name": "社团招新",
      "tag": "社团招新",
      "icon": "users"
    },
    {
      "key": "lost-and-found",
      "name": "失物招领",
      "tag": "失物招领",
      "icon": "search"
    },
    {
      "key": "carpool",
      "name": "拼车拼单",
      "tag": "拼车拼单",
      "icon": "car"
    },
    {
      "key": "secondhand",
      "name": "二手交易",
      "tag": "二手交易",
      "icon": "shopping-bag"
    },
    {
      "key": "study-resource",
      "name": "学习资源",
      "tag": "学习资源",
      "icon": "book"
    }
  ],
  "message": "获取服务中心分类成功"
}
```

---

### 12.2 获取社团招新列表

```http
GET /service-center/club-recruitment
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 12.3 获取失物招领列表

```http
GET /service-center/lost-and-found
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 12.4 获取拼车拼单列表

```http
GET /service-center/carpool
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 12.5 获取二手交易列表

```http
GET /service-center/secondhand
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

### 12.6 获取学习资源列表

```http
GET /service-center/study-resource
```

**🌐 Public**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

---

## 13. 动态流 (Activities)

> 用户动态聚合，展示关注用户的活动

### 13.1 获取关注用户的动态

```http
GET /activities/following
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

**响应**:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "POST",
      "user": {
        "id": "uuid",
        "username": "string",
        "nickname": "string",
        "avatar": "string"
      },
      "content": {
        "id": "uuid",
        "title": "string",
        "content": "string"
      },
      "createdAt": "datetime"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 13.2 获取我的动态

```http
GET /activities/my
```

**🔒 需要认证**

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

**说明**: 返回当前用户自己发布的帖子和评论

---

## 14. 文件上传 (Upload)

> 所有上传接口需要认证，使用 `multipart/form-data` 格式

### 14.1 上传头像

```http
POST /upload/avatar
```

**🔒 需要认证**

**请求**: `multipart/form-data`

- `file`: 图片文件

**文件限制**:

- 格式: JPG, PNG, GIF, WebP
- 大小: 最大 2MB

**响应**:

```json
{
  "url": "/uploads/avatar/xxx.jpg",
  "filename": "xxx.jpg"
}
```

---

### 14.2 上传单张图片

```http
POST /upload/image
```

**🔒 需要认证**

**请求**: `multipart/form-data`

- `file`: 图片文件

**文件限制**:

- 格式: JPG, PNG, GIF, WebP
- 大小: 最大 5MB

---

### 14.3 上传多张图片

```http
POST /upload/images
```

**🔒 需要认证**

**请求**: `multipart/form-data`

- `files`: 图片文件数组（最多 9 张）

**文件限制**:

- 格式: JPG, PNG, GIF, WebP
- 单张大小: 最大 5MB

**响应**:

```json
{
  "urls": ["/uploads/image/xxx1.jpg", "/uploads/image/xxx2.jpg"],
  "filenames": ["xxx1.jpg", "xxx2.jpg"]
}
```

---

### 14.4 上传文档

```http
POST /upload/document
```

**🔒 需要认证**

**请求**: `multipart/form-data`

- `file`: 文档文件

**文件限制**:

- 格式: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- 大小: 最大 10MB

---

## 15. 管理员模块 (Admin)

> **权限**: 所有管理员接口需要 `ADMIN` 角色

### 15.1 用户管理

#### 15.1.1 获取用户列表

```http
GET /admin/users
```

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20
- `role`: 角色筛选，`USER` | `ADMIN`（可选）
- `isBanned`: 封禁状态，`true` | `false`（可选）

---

#### 15.1.2 封禁用户

```http
POST /admin/users/:id/ban
```

---

#### 15.1.3 解封用户

```http
POST /admin/users/:id/unban
```

---

#### 15.1.4 删除用户

```http
DELETE /admin/users/:id
```

**功能**: 级联删除用户的所有内容

---

#### 15.1.5 重置用户密码

```http
POST /admin/users/:id/reset-password
```

**请求体**:

```json
{
  "newPassword": "string"
}
```

---

#### 15.1.6 修改用户角色

```http
PATCH /admin/users/:id/role
```

**请求体**:

```json
{
  "role": "USER" | "ADMIN"
}
```

---

#### 15.1.7 查看用户登录历史

```http
GET /admin/users/:id/login-history
```

**查询参数**:

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

> **注意**: 简化版只返回最后一次登录记录

---

#### 15.1.8 禁止/允许用户发帖

```http
POST /admin/users/:id/toggle-post-permission
```

**请求体**:

```json
{
  "canPost": true | false
}
```

---

#### 15.1.9 禁止/允许用户评论

```http
POST /admin/users/:id/toggle-comment-permission
```

**请求体**:

```json
{
  "canComment": true | false
}
```

---

### 15.2 内容管理

#### 15.2.1 获取帖子列表

```http
GET /admin/posts
```

**查询参数**:

- `page`: 页码
- `limit`: 每页数量
- `isPinned`: 是否置顶（可选）
- `isHighlighted`: 是否精华（可选）
- `keyword`: 关键词搜索（可选）
- `authorId`: 作者 ID（可选）
- `tag`: 标签筛选（可选）

---

#### 15.2.2 获取帖子详情

```http
GET /admin/posts/:id
```

---

#### 15.2.3 置顶帖子

```http
POST /admin/posts/:id/pin
```

---

#### 15.2.4 取消置顶

```http
DELETE /admin/posts/:id/pin
```

---

#### 15.2.5 加精华

```http
POST /admin/posts/:id/highlight
```

---

#### 15.2.6 取消精华

```http
DELETE /admin/posts/:id/highlight
```

---

#### 15.2.7 锁定帖子（禁止评论）

```http
POST /admin/posts/:id/lock
```

---

#### 15.2.8 解锁帖子

```http
DELETE /admin/posts/:id/lock
```

---

#### 15.2.9 隐藏帖子

```http
POST /admin/posts/:id/hide
```

---

#### 15.2.10 取消隐藏

```http
POST /admin/posts/:id/unhide
```

---

#### 15.2.11 批量删除帖子

```http
POST /admin/posts/bulk-delete
```

**请求体**:

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

#### 15.2.12 获取评论列表

```http
GET /admin/comments
```

**查询参数**:

- `page`: 页码
- `limit`: 每页数量
- `keyword`: 关键词搜索（可选）
- `authorId`: 作者 ID（可选）
- `postId`: 帖子 ID（可选）

---

#### 15.2.13 获取评论详情

```http
GET /admin/comments/:id
```

---

#### 15.2.14 删除评论

```http
DELETE /admin/comments/:id
```

---

#### 15.2.15 批量删除评论

```http
POST /admin/comments/bulk-delete
```

**请求体**:

```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

### 15.3 系统统计

#### 15.3.1 获取系统统计数据

```http
GET /admin/statistics
```

**响应**:

```json
{
  "users": {
    "total": 1000,
    "active": 800,
    "banned": 10
  },
  "posts": {
    "total": 5000
  },
  "comments": {
    "total": 15000
  }
}
```

---

## 16. 已禁用功能

以下功能在简化版中已被禁用，调用相关接口会返回错误提示：

### ❌ 16.1 积分系统

**影响接口**:

- `GET /users/:id/points` - 获取用户积分
- `GET /users/:id/points/history` - 积分历史
- `GET /points/leaderboard` - 积分排行榜

**替代方案**: 使用点赞数、粉丝数作为用户活跃度指标

---

### ❌ 16.2 草稿箱

**影响接口**:

- `POST /drafts` - 创建草稿
- `GET /drafts` - 获取草稿列表
- `PATCH /drafts/:id` - 更新草稿
- `DELETE /drafts/:id` - 删除草稿
- `POST /drafts/:id/publish` - 发布草稿

**替代方案**: 前端使用 `localStorage` 实现草稿自动保存

---

### ❌ 16.3 二手交易专区（独立模块）

**说明**: 独立的二手交易模块已禁用，但可以通过以下两种方式实现相同功能：

1. **服务中心接口**: `GET /service-center/secondhand`（推荐）
2. **帖子标签筛选**: `GET /posts?tag=二手交易`

**禁用的接口**:

- `POST /secondhand` - 发布二手商品
- `GET /secondhand` - 获取二手商品列表
- `GET /secondhand/:id` - 商品详情
- `PATCH /secondhand/:id` - 更新商品
- `DELETE /secondhand/:id` - 删除商品

**使用方式**: 使用普通帖子 + `#二手交易` 标签

```json
{
  "title": "出售二手自行车",
  "content": "9成新，价格200元，联系方式...",
  "tags": ["二手交易", "自行车"],
  "images": ["..."]
}
```

---

### ❌ 16.4 学习资源专区（独立模块）

**说明**: 独立的学习资源模块已禁用，但可以通过以下两种方式实现相同功能：

1. **服务中心接口**: `GET /service-center/study-resource`（推荐）
2. **帖子标签筛选**: `GET /posts?tag=学习资源`

**禁用的接口**:

- `POST /study-resources` - 上传学习资源
- `GET /study-resources` - 获取资源列表
- `GET /study-resources/:id` - 资源详情
- `POST /study-resources/:id/download` - 下载资源

**使用方式**: 使用普通帖子 + `#学习资源` 标签

```json
{
  "title": "高等数学复习资料",
  "content": "包含历年真题和答案，下载链接: ...",
  "tags": ["学习资源", "数学", "期末复习"],
  "images": ["..."]
}
```

---

## 📌 常用标签建议

为了更好地组织内容，建议使用以下标签体系：

### 内容分类

- `#校园活动` - 校园活动相关
- `#社团招新` - 社团招新信息
- `#学习交流` - 学习讨论
- `#生活分享` - 日常生活
- `#求助问答` - 求助提问

### 功能性标签

- `#二手交易` - 二手物品交易
- `#学习资源` - 学习资料分享
- `#失物招领` - 失物招领信息
- `#拼车出行` - 拼车信息

### 学科标签

- `#数学` `#英语` `#计算机` `#物理` 等

---

## 🔄 分页响应格式

所有列表接口统一返回格式：

```json
{
  "data": [
    /* 数据数组 */
  ],
  "meta": {
    "page": 1, // 当前页码
    "limit": 20, // 每页数量
    "total": 100, // 总记录数
    "totalPages": 5 // 总页数
  }
}
```

---

## ⚠️ 错误响应格式

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

### 常见状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源不存在
- `500` - 服务器错误

---

## 📝 数据模型

### User (用户)

```typescript
{
  id: string; // UUID
  username: string; // 用户名
  email: string; // 邮箱
  nickname: string; // 昵称
  avatar: string; // 头像URL
  bio: string; // 个人简介
  role: 'USER' | 'ADMIN'; // 角色
  isActive: boolean; // 是否激活
  isBanned: boolean; // 是否封禁
  canPost: boolean; // 是否允许发帖
  canComment: boolean; // 是否允许评论
  followerCount: number; // 粉丝数
  followingCount: number; // 关注数
  lastLoginAt: DateTime; // 最后登录时间
  lastLoginIp: string; // 最后登录IP
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Post (帖子)

```typescript
{
  id: string
  title: string          // 标题
  content: string        // 内容
  images: string[]       // 图片URL数组
  tags: string[]         // 标签数组
  authorId: string       // 作者ID
  viewCount: number      // 浏览数
  likeCount: number      // 点赞数
  commentCount: number   // 评论数
  isPinned: boolean      // 是否置顶
  isHighlighted: boolean // 是否精华
  isLocked: boolean      // 是否锁定
  isHidden: boolean      // 是否隐藏
  pinnedAt: DateTime     // 置顶时间
  highlightedAt: DateTime // 加精时间
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Comment (评论)

```typescript
{
  id: string;
  content: string; // 评论内容
  postId: string; // 帖子ID
  authorId: string; // 作者ID
  parentId: string; // 父评论ID（回复）
  likeCount: number; // 点赞数
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Favorite (收藏)

```typescript
{
  id: string;
  userId: string; // 用户ID
  postId: string; // 帖子ID
  note: string; // 收藏备注
  createdAt: DateTime;
}
```

---

## 🚀 快速开始

### 1. 注册账号

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "123456",
    "nickname": "测试用户"
  }'
```

### 2. 登录获取 Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

### 3. 使用 Token 访问接口

```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📞 技术支持

如有疑问，请查阅：

- [README.md](./README.md) - 快速开始指南
- [AUTH.md](./AUTH.md) - 认证详解
- [ERROR_CODES.md](./ERROR_CODES.md) - 错误代码参考

**文档版本**: v2.1
**最后更新**: 2026-01-09
**接口总数**: 120+
**维护者**: 开发团队
