# 校园论坛后台系统 - API 接口文档

## 📋 目录

- [1. 接口概述](#1-接口概述)
- [2. 认证模块](#2-认证模块)
- [3. 用户模块](#3-用户模块)
- [4. 帖子模块](#4-帖子模块)
- [5. 评论模块](#5-评论模块)
- [6. 点赞模块](#6-点赞模块)
- [7. 搜索模块](#7-搜索模块)
- [8. 通知模块](#8-通知模块)
- [9. 管理模块](#9-管理模块)
- [10. 文件上传](#10-文件上传)
- [11. 草稿模块](#11-草稿模块)
- [12. 收藏模块](#12-收藏模块)
- [13. 关注模块](#13-关注模块)
- [14. 推荐模块](#14-推荐模块)
- [15. 话题模块](#15-话题模块)
- [16. WebSocket 实时通知](#16-websocket-实时通知)

## 1. 接口概述

### 1.1 基本信息

- **Base URL**: `http://localhost:3000/api/v1` (开发环境)
- **Base URL**: `https://api.yourdomain.com/api/v1` (生产环境)
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: JWT Bearer Token

### 1.2 通用响应格式

#### 成功响应

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    // 响应数据
  }
}
```

#### 错误响应

```json
{
  "statusCode": 400,
  "message": "错误信息描述",
  "error": "Bad Request",
  "timestamp": "2025-11-15T12:00:00.000Z",
  "path": "/api/v1/posts"
}
```

### 1.3 HTTP 状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或 Token 失效） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 1.4 分页参数

所有列表接口支持分页，使用以下查询参数：

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| page | number | 否 | 页码 (从 1 开始) | 1 |
| limit | number | 否 | 每页条数 (最大 100) | 20 |

分页响应格式：

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 1.5 认证说明

大部分接口需要在 HTTP Header 中携带 JWT Token：

```
Authorization: Bearer <your-jwt-token>
```

---

## 2. 认证模块

### 2.1 用户注册

**POST** `/auth/register`

注册新用户账号。

#### 请求参数

```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "password123",
  "studentId": "2021001",
  "nickname": "张三",
  "role": "STUDENT"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 (3-20字符，字母数字下划线) |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 (6-50字符) |
| studentId | string | 否 | 学号/工号 |
| nickname | string | 否 | 昵称 |
| role | enum | 否 | 角色 (STUDENT/TEACHER)，默认 STUDENT |

#### 响应示例

```json
{
  "statusCode": 201,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "studentId": "2021001",
      "nickname": "张三",
      "role": "STUDENT",
      "createdAt": "2025-11-15T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.2 用户登录

**POST** `/auth/login`

用户登录获取访问令牌。

#### 请求参数

```json
{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "nickname": "张三",
      "avatar": "https://cdn.example.com/avatar.jpg",
      "role": "STUDENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.3 刷新令牌

**POST** `/auth/refresh`

使用 Refresh Token 获取新的 Access Token。

#### 请求参数

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 响应示例

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.4 登出

**POST** `/auth/logout`

🔒 需要认证

用户登出（可选实现，主要用于清理服务端 Token 黑名单）。

---

## 3. 用户模块

### 3.1 获取当前用户信息

**GET** `/users/me`

🔒 需要认证

获取当前登录用户的详细信息。

#### 响应示例

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-string",
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "studentId": "2021001",
    "nickname": "张三",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "bio": "这是我的个人简介",
    "role": "STUDENT",
    "isActive": true,
    "createdAt": "2025-11-15T12:00:00.000Z",
    "stats": {
      "postCount": 15,
      "commentCount": 48,
      "likeCount": 120
    }
  }
}
```

### 3.2 更新用户资料

**PATCH** `/users/me`

🔒 需要认证

更新当前用户的个人资料。

#### 请求参数

```json
{
  "nickname": "新昵称",
  "bio": "更新后的个人简介",
  "avatar": "https://cdn.example.com/new-avatar.jpg"
}
```

### 3.3 获取用户详情

**GET** `/users/:id`

获取指定用户的公开信息。

#### 响应示例

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-string",
    "username": "zhangsan",
    "nickname": "张三",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "bio": "这是我的个人简介",
    "role": "STUDENT",
    "createdAt": "2025-11-15T12:00:00.000Z",
    "stats": {
      "postCount": 15,
      "followerCount": 25,
      "followingCount": 30
    }
  }
}
```

### 3.4 获取用户发帖列表

**GET** `/users/:id/posts`

获取指定用户的发帖列表（支持分页）。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

---

## 4. 帖子模块

### 4.1 创建帖子

**POST** `/posts`

🔒 需要认证

创建新帖子。

#### 请求参数

```json
{
  "title": "帖子标题",
  "content": "帖子内容，支持 Markdown 格式...",
  "images": [
    "https://cdn.example.com/image1.jpg",
    "https://cdn.example.com/image2.jpg"
  ],
  "tags": ["校园生活", "学习"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 帖子标题 (5-200字符) |
| content | string | 是 | 帖子内容 (10-50000字符) |
| images | string[] | 否 | 图片 URL 数组 (最多9张) |
| tags | string[] | 否 | 标签数组 |

#### 响应示例

```json
{
  "statusCode": 201,
  "message": "帖子创建成功",
  "data": {
    "id": "uuid-string",
    "title": "帖子标题",
    "content": "帖子内容...",
    "images": ["https://cdn.example.com/image1.jpg"],
    "tags": ["校园生活"],
    "author": {
      "id": "uuid-string",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": "https://cdn.example.com/avatar.jpg"
    },
    "viewCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2025-11-15T12:00:00.000Z",
    "updatedAt": "2025-11-15T12:00:00.000Z"
  }
}
```

### 4.2 获取帖子列表

**GET** `/posts`

获取帖子列表（支持分页、排序、筛选）。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |
| sortBy | string | 否 | 排序字段 (createdAt/viewCount/likeCount) |
| order | string | 否 | 排序方式 (asc/desc)，默认 desc |
| tag | string | 否 | 按标签筛选 |
| authorId | string | 否 | 按作者筛选 |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-string",
      "title": "帖子标题",
      "content": "帖子内容摘要...",
      "images": ["https://cdn.example.com/image1.jpg"],
      "tags": ["校园生活"],
      "author": {
        "id": "uuid-string",
        "username": "zhangsan",
        "nickname": "张三",
        "avatar": "https://cdn.example.com/avatar.jpg"
      },
      "viewCount": 150,
      "likeCount": 25,
      "commentCount": 12,
      "createdAt": "2025-11-15T12:00:00.000Z"
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

### 4.3 获取帖子详情

**GET** `/posts/:id`

获取指定帖子的详细信息。

#### 响应示例

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-string",
    "title": "帖子标题",
    "content": "完整的帖子内容...",
    "images": ["https://cdn.example.com/image1.jpg"],
    "tags": ["校园生活", "学习"],
    "author": {
      "id": "uuid-string",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": "https://cdn.example.com/avatar.jpg",
      "role": "STUDENT"
    },
    "viewCount": 150,
    "likeCount": 25,
    "commentCount": 12,
    "isLikedByMe": false,
    "createdAt": "2025-11-15T12:00:00.000Z",
    "updatedAt": "2025-11-15T12:00:00.000Z"
  }
}
```

### 4.4 更新帖子

**PATCH** `/posts/:id`

🔒 需要认证 + 作者权限

更新帖子内容。

#### 请求参数

```json
{
  "title": "更新后的标题",
  "content": "更新后的内容...",
  "tags": ["新标签"]
}
```

### 4.5 删除帖子

**DELETE** `/posts/:id`

🔒 需要认证 + 作者/管理员权限

删除帖子（软删除）。

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "帖子删除成功"
}
```

---

## 5. 评论模块

### 5.1 创建评论

**POST** `/comments`

🔒 需要认证

对帖子或评论进行评论/回复。

#### 请求参数

```json
{
  "postId": "uuid-string",
  "content": "评论内容...",
  "parentId": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | string | 是 | 帖子 ID |
| content | string | 是 | 评论内容 (1-1000字符) |
| parentId | string | 否 | 父评论 ID（回复评论时提供） |

#### 响应示例

```json
{
  "statusCode": 201,
  "message": "评论成功",
  "data": {
    "id": "uuid-string",
    "content": "评论内容...",
    "postId": "uuid-string",
    "author": {
      "id": "uuid-string",
      "username": "lisi",
      "nickname": "李四",
      "avatar": "https://cdn.example.com/avatar2.jpg"
    },
    "parentId": null,
    "likeCount": 0,
    "createdAt": "2025-11-15T12:00:00.000Z"
  }
}
```

### 5.2 获取帖子评论列表

**GET** `/posts/:postId/comments`

获取指定帖子的评论列表（支持分页）。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |
| sortBy | string | 否 | 排序 (createdAt/likeCount) |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-string",
      "content": "一级评论内容...",
      "author": {
        "id": "uuid-string",
        "username": "lisi",
        "nickname": "李四",
        "avatar": "https://cdn.example.com/avatar2.jpg"
      },
      "likeCount": 5,
      "replyCount": 2,
      "createdAt": "2025-11-15T12:00:00.000Z",
      "replies": [
        {
          "id": "uuid-string-2",
          "content": "回复内容...",
          "author": {
            "id": "uuid-string-3",
            "username": "wangwu",
            "nickname": "王五"
          },
          "likeCount": 1,
          "createdAt": "2025-11-15T12:05:00.000Z"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### 5.3 删除评论

**DELETE** `/comments/:id`

🔒 需要认证 + 作者/管理员权限

删除评论（软删除）。

---

## 6. 点赞模块

### 6.1 点赞/取消点赞

**POST** `/likes/toggle`

🔒 需要认证

对帖子或评论进行点赞/取消点赞。

#### 请求参数

```json
{
  "targetId": "uuid-string",
  "targetType": "POST"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetId | string | 是 | 目标 ID (帖子或评论) |
| targetType | enum | 是 | 目标类型 (POST/COMMENT) |

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "点赞成功",
  "data": {
    "isLiked": true,
    "likeCount": 26
  }
}
```

### 6.2 获取用户点赞列表

**GET** `/users/:userId/likes`

获取用户的点赞列表。

---

## 7. 搜索模块

### 7.1 搜索帖子

**GET** `/search/posts`

全文搜索帖子。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| tag | string | 否 | 标签筛选 |
| sortBy | string | 否 | 排序 (relevance/createdAt/viewCount) |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-string",
      "title": "匹配关键词的帖子标题",
      "content": "...高亮显示关键词...",
      "author": {
        "username": "zhangsan",
        "nickname": "张三"
      },
      "viewCount": 150,
      "likeCount": 25,
      "createdAt": "2025-11-15T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "query": "搜索关键词"
  }
}
```

---

## 8. 通知模块

### 8.1 获取通知列表

**GET** `/notifications`

🔒 需要认证

获取当前用户的通知列表。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |
| isRead | boolean | 否 | 筛选已读/未读 |
| type | string | 否 | 通知类型 (COMMENT/REPLY/LIKE/SYSTEM) |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-string",
      "type": "COMMENT",
      "title": "新评论通知",
      "content": "李四 评论了你的帖子",
      "relatedId": "post-uuid",
      "isRead": false,
      "createdAt": "2025-11-15T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "unreadCount": 15
  }
}
```

### 8.2 标记通知已读

**PATCH** `/notifications/:id/read`

🔒 需要认证

标记单个通知为已读。

### 8.3 批量标记已读

**POST** `/notifications/read-all`

🔒 需要认证

标记所有通知为已读。

---

## 9. 管理模块

### 9.1 举报内容

**POST** `/reports`

🔒 需要认证

举报违规内容。

#### 请求参数

```json
{
  "targetId": "uuid-string",
  "targetType": "POST",
  "reason": "举报理由说明..."
}
```

### 9.2 获取举报列表

**GET** `/admin/reports`

🔒 需要管理员权限

获取所有举报记录。

### 9.3 处理举报

**PATCH** `/admin/reports/:id`

🔒 需要管理员权限

处理举报（通过/拒绝）。

---

## 10. 文件上传

### 10.1 上传图片

**POST** `/upload/image`

🔒 需要认证

上传图片文件（支持头像、帖子图片），系统会自动压缩并生成多种尺寸。

#### 请求

```
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 图片文件 (JPG/PNG/GIF/WebP, 最大10MB) |
| type | string | 否 | 上传类型 (avatar/post) |
| compress | boolean | 否 | 是否压缩 (默认 true) |
| quality | number | 否 | 压缩质量 (1-100, 默认 85) |

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "上传成功",
  "data": {
    "original": "https://cdn.example.com/uploads/2025/11/abc123.jpg",
    "large": "https://cdn.example.com/uploads/2025/11/abc123-large.webp",
    "medium": "https://cdn.example.com/uploads/2025/11/abc123-medium.webp",
    "thumbnail": "https://cdn.example.com/uploads/2025/11/abc123-thumb.webp",
    "filename": "abc123.jpg",
    "size": 102400,
    "width": 1920,
    "height": 1080,
    "mimeType": "image/jpeg"
  }
}
```

### 10.2 批量上传图片

**POST** `/upload/images`

🔒 需要认证

批量上传多张图片（最多9张）。

#### 请求

```
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| files | File[] | 是 | 图片文件数组 (最多9张) |
| type | string | 否 | 上传类型 (post) |

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "上传成功",
  "data": [
    {
      "original": "https://cdn.example.com/uploads/2025/11/abc123.jpg",
      "large": "https://cdn.example.com/uploads/2025/11/abc123-large.webp",
      "medium": "https://cdn.example.com/uploads/2025/11/abc123-medium.webp",
      "thumbnail": "https://cdn.example.com/uploads/2025/11/abc123-thumb.webp"
    },
    {
      "original": "https://cdn.example.com/uploads/2025/11/def456.jpg",
      "large": "https://cdn.example.com/uploads/2025/11/def456-large.webp",
      "medium": "https://cdn.example.com/uploads/2025/11/def456-medium.webp",
      "thumbnail": "https://cdn.example.com/uploads/2025/11/def456-thumb.webp"
    }
  ]
}
```

### 10.3 上传文件

**POST** `/upload/file`

🔒 需要认证

上传普通文件（PDF、Word、Excel等）。

#### 请求

```
Content-Type: multipart/form-data
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 文件 (最大20MB) |

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "上传成功",
  "data": {
    "url": "https://cdn.example.com/files/2025/11/document.pdf",
    "filename": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  }
}
```

---

## 11. 草稿模块

### 11.1 创建/更新草稿

**POST** `/posts/drafts`

🔒 需要认证

保存帖子草稿（自动保存）。

#### 请求参数

```json
{
  "title": "草稿标题",
  "content": "草稿内容...",
  "images": ["https://cdn.example.com/image1.jpg"],
  "tags": ["标签1", "标签2"],
  "postId": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 否 | 草稿标题 |
| content | string | 否 | 草稿内容 |
| images | string[] | 否 | 图片 URL 数组 |
| tags | string[] | 否 | 标签数组 |
| postId | string | 否 | 关联的已发布帖子 ID（编辑时） |

#### 响应示例

```json
{
  "statusCode": 201,
  "message": "草稿保存成功",
  "data": {
    "id": "uuid-string",
    "title": "草稿标题",
    "content": "草稿内容...",
    "images": ["https://cdn.example.com/image1.jpg"],
    "tags": ["标签1"],
    "authorId": "uuid-string",
    "postId": null,
    "createdAt": "2025-11-15T12:00:00.000Z",
    "updatedAt": "2025-11-15T12:00:00.000Z"
  }
}
```

### 11.2 获取草稿列表

**GET** `/posts/drafts`

🔒 需要认证

获取当前用户的所有草稿。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-string",
      "title": "草稿标题",
      "content": "草稿内容...",
      "images": [],
      "tags": [],
      "updatedAt": "2025-11-15T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### 11.3 获取单个草稿

**GET** `/posts/drafts/:id`

🔒 需要认证

获取指定草稿的详细信息。

### 11.4 删除草稿

**DELETE** `/posts/drafts/:id`

🔒 需要认证

删除指定草稿。

### 11.5 发布草稿

**POST** `/posts/drafts/:id/publish`

🔒 需要认证

将草稿发布为正式帖子。

#### 响应示例

```json
{
  "statusCode": 201,
  "message": "发布成功",
  "data": {
    "id": "post-uuid-string",
    "title": "帖子标题",
    "content": "帖子内容...",
    "createdAt": "2025-11-15T12:00:00.000Z"
  }
}
```

---

## 12. 收藏模块

### 12.1 收藏帖子

**POST** `/favorites`

🔒 需要认证

收藏帖子到指定收藏夹。

#### 请求参数

```json
{
  "postId": "uuid-string",
  "folderId": "folder-uuid",
  "note": "收藏备注（可选）"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | string | 是 | 帖子 ID |
| folderId | string | 是 | 收藏夹 ID |
| note | string | 否 | 收藏备注 |

#### 响应示例

```json
{
  "statusCode": 201,
  "message": "收藏成功",
  "data": {
    "id": "uuid-string",
    "postId": "uuid-string",
    "folderId": "folder-uuid",
    "note": "收藏备注",
    "createdAt": "2025-11-15T12:00:00.000Z"
  }
}
```

### 12.2 取消收藏

**DELETE** `/favorites/:id`

🔒 需要认证

取消收藏指定帖子。

### 12.3 获取收藏列表

**GET** `/favorites`

🔒 需要认证

获取当前用户的收藏列表。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| folderId | string | 否 | 按收藏夹筛选 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-string",
      "post": {
        "id": "post-uuid",
        "title": "被收藏的帖子",
        "author": {
          "username": "zhangsan",
          "nickname": "张三"
        },
        "viewCount": 100,
        "likeCount": 25
      },
      "folder": {
        "id": "folder-uuid",
        "name": "我的收藏夹"
      },
      "note": "收藏备注",
      "createdAt": "2025-11-15T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### 12.4 创建收藏夹

**POST** `/folders`

🔒 需要认证

创建新的收藏夹。

#### 请求参数

```json
{
  "name": "我的收藏夹",
  "description": "收藏夹描述"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 收藏夹名称 (1-50字符) |
| description | string | 否 | 收藏夹描述 |

#### 响应示例

```json
{
  "statusCode": 201,
  "message": "收藏夹创建成功",
  "data": {
    "id": "uuid-string",
    "name": "我的收藏夹",
    "description": "收藏夹描述",
    "isDefault": false,
    "createdAt": "2025-11-15T12:00:00.000Z"
  }
}
```

### 12.5 获取收藏夹列表

**GET** `/folders`

🔒 需要认证

获取当前用户的所有收藏夹。

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid-string",
      "name": "默认收藏夹",
      "description": null,
      "isDefault": true,
      "favoriteCount": 15,
      "createdAt": "2025-11-15T12:00:00.000Z"
    },
    {
      "id": "uuid-string-2",
      "name": "技术文章",
      "description": "技术相关的收藏",
      "isDefault": false,
      "favoriteCount": 8,
      "createdAt": "2025-11-15T13:00:00.000Z"
    }
  ]
}
```

### 12.6 更新收藏夹

**PATCH** `/folders/:id`

🔒 需要认证

更新收藏夹信息。

#### 请求参数

```json
{
  "name": "新的收藏夹名称",
  "description": "新的描述"
}
```

### 12.7 删除收藏夹

**DELETE** `/folders/:id`

🔒 需要认证

删除收藏夹（不会删除收藏的帖子）。

---

## 13. 关注模块

### 13.1 关注用户

**POST** `/users/:id/follow`

🔒 需要认证

关注指定用户。

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "关注成功",
  "data": {
    "isFollowing": true,
    "followerCount": 26
  }
}
```

### 13.2 取消关注

**DELETE** `/users/:id/follow`

🔒 需要认证

取消关注指定用户。

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "取消关注成功",
  "data": {
    "isFollowing": false,
    "followerCount": 25
  }
}
```

### 13.3 获取粉丝列表

**GET** `/users/:id/followers`

获取指定用户的粉丝列表。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "user-uuid",
      "username": "lisi",
      "nickname": "李四",
      "avatar": "https://cdn.example.com/avatar.jpg",
      "bio": "个人简介",
      "isFollowing": false,
      "followedAt": "2025-11-15T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25
  }
}
```

### 13.4 获取关注列表

**GET** `/users/:id/following`

获取指定用户的关注列表。

#### 查询参数

同粉丝列表

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "user-uuid",
      "username": "wangwu",
      "nickname": "王五",
      "avatar": "https://cdn.example.com/avatar.jpg",
      "bio": "个人简介",
      "isFollowing": true,
      "followedAt": "2025-11-14T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 30
  }
}
```

### 13.5 获取关注动态

**GET** `/feed`

🔒 需要认证

获取关注用户的最新动态（帖子）。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "post-uuid",
      "title": "关注的用户发布的帖子",
      "content": "帖子内容...",
      "author": {
        "id": "user-uuid",
        "username": "wangwu",
        "nickname": "王五",
        "avatar": "https://cdn.example.com/avatar.jpg"
      },
      "viewCount": 50,
      "likeCount": 10,
      "commentCount": 5,
      "createdAt": "2025-11-15T11:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## 14. 推荐模块

### 14.1 获取热门帖子

**GET** `/posts/hot`

获取热门帖子列表（基于点赞、评论、浏览量综合评分）。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |
| timeRange | string | 否 | 时间范围 (day/week/month/all) |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "post-uuid",
      "title": "热门帖子标题",
      "content": "帖子内容摘要...",
      "author": {
        "username": "zhangsan",
        "nickname": "张三",
        "avatar": "https://cdn.example.com/avatar.jpg"
      },
      "viewCount": 1500,
      "likeCount": 250,
      "commentCount": 120,
      "hotScore": 95.6,
      "createdAt": "2025-11-14T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 14.2 获取趋势帖子

**GET** `/posts/trending`

获取当前趋势帖子（时间衰减算法）。

#### 查询参数

同热门帖子

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "post-uuid",
      "title": "趋势帖子标题",
      "content": "帖子内容摘要...",
      "author": {
        "username": "lisi",
        "nickname": "李四"
      },
      "viewCount": 500,
      "likeCount": 80,
      "commentCount": 45,
      "trendingScore": 87.3,
      "createdAt": "2025-11-15T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20
  }
}
```

### 14.3 获取个性化推荐

**GET** `/recommendations`

🔒 需要认证

基于用户行为的个性化推荐帖子。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "post-uuid",
      "title": "推荐给你的帖子",
      "content": "根据你的兴趣推荐...",
      "author": {
        "username": "wangwu",
        "nickname": "王五"
      },
      "reason": "基于你的兴趣标签: 技术, 学习",
      "viewCount": 300,
      "likeCount": 60,
      "createdAt": "2025-11-15T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20
  }
}
```

---

## 15. 话题模块

### 15.1 获取话题列表

**GET** `/topics`

获取所有话题列表。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |
| sortBy | string | 否 | 排序 (postCount/followerCount/createdAt) |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "topic-uuid",
      "name": "校园生活",
      "description": "分享校园生活点滴",
      "postCount": 1250,
      "followerCount": 3500,
      "isHot": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "topic-uuid-2",
      "name": "学习交流",
      "description": "学习经验分享与讨论",
      "postCount": 980,
      "followerCount": 2800,
      "isHot": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### 15.2 获取热门话题

**GET** `/topics/hot`

获取当前热门话题。

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "topic-uuid",
      "name": "期末考试",
      "description": "期末考试相关讨论",
      "postCount": 350,
      "followerCount": 1500,
      "isHot": true,
      "recentPostCount": 120
    }
  ]
}
```

### 15.3 获取话题详情

**GET** `/topics/:id`

获取指定话题的详细信息。

#### 响应示例

```json
{
  "statusCode": 200,
  "data": {
    "id": "topic-uuid",
    "name": "校园生活",
    "description": "分享校园生活点滴",
    "postCount": 1250,
    "followerCount": 3500,
    "isHot": true,
    "isFollowing": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 15.4 获取话题下的帖子

**GET** `/topics/:id/posts`

获取指定话题下的帖子列表。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |
| sortBy | string | 否 | 排序 (createdAt/viewCount/likeCount) |

#### 响应示例

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "post-uuid",
      "title": "关于校园生活的帖子",
      "content": "帖子内容...",
      "author": {
        "username": "zhangsan",
        "nickname": "张三"
      },
      "viewCount": 200,
      "likeCount": 50,
      "commentCount": 20,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1250
  }
}
```

### 15.5 关注话题

**POST** `/topics/:id/follow`

🔒 需要认证

关注指定话题。

#### 响应示例

```json
{
  "statusCode": 200,
  "message": "关注成功",
  "data": {
    "isFollowing": true,
    "followerCount": 3501
  }
}
```

### 15.6 取消关注话题

**DELETE** `/topics/:id/follow`

🔒 需要认证

取消关注指定话题。

---

## 16. WebSocket 实时通知

### 16.1 连接说明

**连接地址**: `ws://localhost:3000` (开发环境) 或 `wss://api.yourdomain.com` (生产环境)

**认证方式**: 连接时需要在查询参数中携带 JWT Token

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 16.2 事件监听

#### 16.2.1 连接成功

**事件名**: `connect`

```javascript
socket.on('connect', () => {
  console.log('WebSocket 连接成功');
});
```

#### 16.2.2 新通知

**事件名**: `notification`

收到新通知时触发。

```javascript
socket.on('notification', (data) => {
  console.log('收到新通知:', data);
});
```

**数据格式**:

```json
{
  "id": "notification-uuid",
  "type": "COMMENT",
  "title": "新评论通知",
  "content": "李四 评论了你的帖子",
  "relatedId": "post-uuid",
  "isRead": false,
  "createdAt": "2025-11-15T12:00:00.000Z"
}
```

#### 16.2.3 新点赞

**事件名**: `like`

有人点赞你的内容时触发。

```javascript
socket.on('like', (data) => {
  console.log('收到新点赞:', data);
});
```

**数据格式**:

```json
{
  "type": "POST",
  "targetId": "post-uuid",
  "user": {
    "id": "user-uuid",
    "username": "lisi",
    "nickname": "李四",
    "avatar": "https://cdn.example.com/avatar.jpg"
  },
  "createdAt": "2025-11-15T12:00:00.000Z"
}
```

#### 16.2.4 新评论

**事件名**: `comment`

有人评论你的帖子时触发。

```javascript
socket.on('comment', (data) => {
  console.log('收到新评论:', data);
});
```

**数据格式**:

```json
{
  "id": "comment-uuid",
  "content": "评论内容...",
  "postId": "post-uuid",
  "author": {
    "id": "user-uuid",
    "username": "lisi",
    "nickname": "李四",
    "avatar": "https://cdn.example.com/avatar.jpg"
  },
  "createdAt": "2025-11-15T12:00:00.000Z"
}
```

#### 16.2.5 新关注

**事件名**: `follow`

有人关注你时触发。

```javascript
socket.on('follow', (data) => {
  console.log('新增关注者:', data);
});
```

**数据格式**:

```json
{
  "follower": {
    "id": "user-uuid",
    "username": "lisi",
    "nickname": "李四",
    "avatar": "https://cdn.example.com/avatar.jpg"
  },
  "followedAt": "2025-11-15T12:00:00.000Z"
}
```

#### 16.2.6 系统消息

**事件名**: `system`

系统消息推送。

```javascript
socket.on('system', (data) => {
  console.log('系统消息:', data);
});
```

**数据格式**:

```json
{
  "title": "系统通知",
  "content": "系统维护通知：今晚 22:00-23:00 进行系统升级",
  "level": "info",
  "createdAt": "2025-11-15T12:00:00.000Z"
}
```

### 16.3 发送事件

#### 16.3.1 标记通知已读

**事件名**: `notification:read`

```javascript
socket.emit('notification:read', {
  notificationId: 'notification-uuid'
});
```

#### 16.3.2 在线状态更新

**事件名**: `status:update`

```javascript
socket.emit('status:update', {
  status: 'online' // online/away/busy/offline
});
```

### 16.4 错误处理

#### 16.4.1 连接错误

**事件名**: `connect_error`

```javascript
socket.on('connect_error', (error) => {
  console.error('连接错误:', error.message);
});
```

#### 16.4.2 认证失败

**事件名**: `auth_error`

```javascript
socket.on('auth_error', (error) => {
  console.error('认证失败:', error.message);
});
```

### 16.5 断开连接

**事件名**: `disconnect`

```javascript
socket.on('disconnect', (reason) => {
  console.log('连接断开:', reason);
});

// 手动断开
socket.disconnect();
```

### 16.6 完整示例

```javascript
import io from 'socket.io-client';

// 连接
const socket = io('ws://localhost:3000', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

// 连接成功
socket.on('connect', () => {
  console.log('已连接到服务器');
});

// 监听通知
socket.on('notification', (notification) => {
  // 显示通知
  showNotification(notification);

  // 更新未读数
  updateUnreadCount();
});

// 监听新评论
socket.on('comment', (comment) => {
  // 实时更新评论列表
  addCommentToList(comment);
});

// 监听新点赞
socket.on('like', (like) => {
  // 更新点赞数
  updateLikeCount(like.targetId);
});

// 错误处理
socket.on('connect_error', (error) => {
  console.error('连接失败:', error);
});

// 组件卸载时断开连接
onUnmount(() => {
  socket.disconnect();
});
```

---

## 附录

### A. 错误码说明

| 错误码 | 说明 |
|-------|------|
| AUTH_001 | Token 无效或已过期 |
| AUTH_002 | 用户名或密码错误 |
| AUTH_003 | 权限不足 |
| USER_001 | 用户名已存在 |
| USER_002 | 邮箱已被注册 |
| USER_003 | 用户不存在 |
| POST_001 | 帖子不存在 |
| POST_002 | 无权限编辑此帖子 |
| COMMENT_001 | 评论不存在 |
| UPLOAD_001 | 文件类型不支持 |
| UPLOAD_002 | 文件大小超出限制 |
| RATE_LIMIT | 请求过于频繁，请稍后再试 |

### B. 请求示例 (cURL)

#### 登录

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zhangsan@example.com",
    "password": "password123"
  }'
```

#### 创建帖子

```bash
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "我的第一篇帖子",
    "content": "帖子内容...",
    "tags": ["校园生活"]
  }'
```

### C. Postman Collection

建议使用 Postman 导入 API 集合进行测试，集合文件：`postman/school-forum-api.json`

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-15
**维护者**: 后端开发团队
