# 校园论坛用户端 API 接口文档

> **Base URL**: `http://localhost:30000`
> **认证方式**: JWT Bearer Token (部分接口可公开访问)

---

## 认证说明

大部分接口需要在 Header 中携带 JWT Token:

```
Authorization: Bearer <your_access_token>
```

标记为 🔓 的接口无需登录即可访问。

---

## 1. 认证接口

### 1.1 用户注册

```
POST /auth/register
```
🔓 无需登录

**请求体**:
```json
{
  "username": "student01",
  "email": "student01@example.com",
  "password": "password123",
  "studentId": "2024001",
  "nickname": "小明"
}
```

**响应示例**:
```json
{
  "user": {
    "id": "user-uuid",
    "username": "student01",
    "email": "student01@example.com",
    "studentId": "2024001",
    "nickname": "小明",
    "role": "STUDENT",
    "createdAt": "2025-11-15T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 用户登录

```
POST /auth/login
```
🔓 无需登录

**请求体**:
```json
{
  "email": "student01@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "user": {
    "id": "user-uuid",
    "username": "student01",
    "email": "student01@example.com",
    "nickname": "小明",
    "role": "STUDENT",
    "avatar": "https://example.com/avatar.jpg",
    "isActive": true,
    "isBanned": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.3 刷新 Token

```
POST /auth/refresh
```
🔓 无需登录

**请求体**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

**响应示例**:
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

### 1.4 登出

```
POST /auth/logout
```

**响应示例**:
```json
{
  "message": "登出成功"
}
```

---

## 2. 帖子管理

### 2.1 创建帖子

```
POST /posts
```

**请求体**:
```json
{
  "title": "这是帖子标题",
  "content": "这是帖子内容...",
  "tags": ["技术", "前端"],
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}
```

**响应示例**:
```json
{
  "id": "post-uuid",
  "title": "这是帖子标题",
  "content": "这是帖子内容...",
  "tags": ["技术", "前端"],
  "images": ["https://example.com/image1.jpg"],
  "author": {
    "id": "user-uuid",
    "username": "student01",
    "nickname": "小明",
    "avatar": "https://example.com/avatar.jpg"
  },
  "viewCount": 0,
  "likeCount": 0,
  "commentCount": 0,
  "createdAt": "2025-11-15T10:00:00.000Z"
}
```

### 2.2 获取帖子列表

```
GET /posts?page=1&limit=20&sortBy=createdAt&order=desc&tag=技术&authorId=user-uuid
```
🔓 无需登录

**Query 参数**:
- `page` (可选): 页码,默认 1
- `limit` (可选): 每页数量,默认 20
- `sortBy` (可选): 排序字段 (`createdAt` / `viewCount`),默认 `createdAt`
- `order` (可选): 排序顺序 (`asc` / `desc`),默认 `desc`
- `tag` (可选): 按标签筛选
- `authorId` (可选): 按作者筛选

**响应示例**:
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "帖子标题",
      "content": "帖子内容预览...",
      "tags": ["技术"],
      "images": ["https://example.com/image.jpg"],
      "author": {
        "id": "user-uuid",
        "username": "student01",
        "nickname": "小明",
        "avatar": "https://example.com/avatar.jpg"
      },
      "viewCount": 100,
      "likeCount": 10,
      "commentCount": 5,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 2.3 获取帖子详情

```
GET /posts/:id
```
🔓 无需登录

**响应示例**:
```json
{
  "id": "post-uuid",
  "title": "帖子标题",
  "content": "完整的帖子内容...",
  "tags": ["技术", "前端"],
  "images": ["https://example.com/image.jpg"],
  "author": {
    "id": "user-uuid",
    "username": "student01",
    "nickname": "小明",
    "avatar": "https://example.com/avatar.jpg",
    "role": "STUDENT"
  },
  "viewCount": 101,
  "likeCount": 10,
  "commentCount": 5,
  "isLiked": false,
  "isFavorited": false,
  "createdAt": "2025-11-15T10:00:00.000Z",
  "updatedAt": "2025-11-15T10:00:00.000Z"
}
```

### 2.4 更新帖子

```
PATCH /posts/:id
```

**请求体**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "tags": ["新标签"]
}
```

**响应示例**:
```json
{
  "message": "帖子已更新",
  "post": {
    "id": "post-uuid",
    "title": "更新后的标题",
    "content": "更新后的内容",
    "updatedAt": "2025-11-15T11:00:00.000Z"
  }
}
```

### 2.5 删除帖子

```
DELETE /posts/:id
```

**响应示例**:
```json
{
  "message": "帖子已删除"
}
```

### 2.6 获取帖子评论列表

```
GET /posts/:id/comments?page=1&limit=20&sortBy=createdAt
```
🔓 无需登录

**Query 参数**:
- `page` (可选): 页码,默认 1
- `limit` (可选): 每页数量,默认 20
- `sortBy` (可选): 排序 (`createdAt` / `likeCount`),默认 `createdAt`

**响应示例**:
```json
{
  "data": [
    {
      "id": "comment-uuid",
      "content": "评论内容",
      "author": {
        "id": "user-uuid",
        "username": "student02",
        "nickname": "小红",
        "avatar": "https://example.com/avatar2.jpg"
      },
      "likeCount": 5,
      "replyCount": 2,
      "replies": [
        {
          "id": "reply-uuid",
          "content": "回复内容",
          "author": {
            "id": "user-uuid-3",
            "username": "student03",
            "nickname": "小刚"
          },
          "likeCount": 1,
          "createdAt": "2025-11-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

## 3. 评论管理

### 3.1 创建评论

```
POST /comments
```

**请求体 (一级评论)**:
```json
{
  "postId": "post-uuid",
  "content": "这是我的评论"
}
```

**请求体 (回复评论)**:
```json
{
  "postId": "post-uuid",
  "parentId": "comment-uuid",
  "content": "这是我的回复"
}
```

**响应示例**:
```json
{
  "id": "comment-uuid",
  "postId": "post-uuid",
  "parentId": null,
  "content": "这是我的评论",
  "author": {
    "id": "user-uuid",
    "username": "student01",
    "nickname": "小明",
    "avatar": "https://example.com/avatar.jpg"
  },
  "likeCount": 0,
  "createdAt": "2025-11-15T10:00:00.000Z"
}
```

### 3.2 获取评论的回复列表

```
GET /comments/:id/replies?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "id": "reply-uuid",
      "content": "回复内容",
      "author": {
        "id": "user-uuid",
        "username": "student02",
        "nickname": "小红"
      },
      "likeCount": 3,
      "createdAt": "2025-11-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### 3.3 删除评论

```
DELETE /comments/:id
```

**响应示例**:
```json
{
  "message": "评论已删除"
}
```

---

## 4. 点赞功能

### 4.1 点赞/取消点赞

```
POST /likes/toggle
```

**请求体**:
```json
{
  "targetType": "POST",
  "targetId": "post-uuid"
}
```

**targetType 可选值**: `POST` / `COMMENT`

**响应示例**:
```json
{
  "action": "liked",
  "likeCount": 11
}
```

或

```json
{
  "action": "unliked",
  "likeCount": 10
}
```

---

## 5. 用户管理

### 5.1 获取当前用户资料

```
GET /users/me
```

**响应示例**:
```json
{
  "id": "user-uuid",
  "username": "student01",
  "email": "student01@example.com",
  "nickname": "小明",
  "studentId": "2024001",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "个人简介",
  "role": "STUDENT",
  "postCount": 10,
  "followerCount": 50,
  "followingCount": 30,
  "createdAt": "2025-11-01T10:00:00.000Z"
}
```

### 5.2 更新当前用户资料

```
PATCH /users/me
```

**请求体**:
```json
{
  "nickname": "新昵称",
  "bio": "新的个人简介",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**响应示例**:
```json
{
  "message": "资料已更新",
  "user": {
    "id": "user-uuid",
    "nickname": "新昵称",
    "bio": "新的个人简介",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

### 5.3 获取用户详情

```
GET /users/:id
```

**响应示例**:
```json
{
  "id": "user-uuid",
  "username": "student01",
  "nickname": "小明",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "个人简介",
  "role": "STUDENT",
  "postCount": 10,
  "followerCount": 50,
  "followingCount": 30,
  "createdAt": "2025-11-01T10:00:00.000Z"
}
```

### 5.4 获取用户发帖列表

```
GET /users/:id/posts?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "帖子标题",
      "content": "帖子内容预览...",
      "viewCount": 100,
      "likeCount": 10,
      "commentCount": 5,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### 5.5 获取用户点赞列表

```
GET /users/:id/likes?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "id": "like-uuid",
      "targetType": "POST",
      "post": {
        "id": "post-uuid",
        "title": "帖子标题",
        "author": {
          "nickname": "作者昵称"
        }
      },
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 20,
    "page": 1,
    "limit": 20
  }
}
```

---

## 6. 关注功能

### 6.1 关注用户

```
POST /users/:id/follow
```

**请求体**:
```json
{
  "followingId": "target-user-uuid"
}
```

**响应示例**:
```json
{
  "message": "关注成功"
}
```

### 6.2 取消关注

```
DELETE /users/:id/follow
```

**响应示例**:
```json
{
  "message": "已取消关注"
}
```

### 6.3 获取关注列表

```
GET /users/:id/following?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "user-uuid",
      "username": "student02",
      "nickname": "小红",
      "avatar": "https://example.com/avatar2.jpg",
      "bio": "个人简介",
      "followedAt": "2025-11-10T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "limit": 20
  }
}
```

### 6.4 获取粉丝列表

```
GET /users/:id/followers?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "user-uuid",
      "username": "student03",
      "nickname": "小刚",
      "avatar": "https://example.com/avatar3.jpg",
      "followedAt": "2025-11-12T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

## 7. 收藏功能

### 7.1 创建收藏夹

```
POST /favorites/folders
```

**请求体**:
```json
{
  "name": "技术文章",
  "description": "收藏的技术类帖子",
  "isPublic": true
}
```

**响应示例**:
```json
{
  "id": "folder-uuid",
  "name": "技术文章",
  "description": "收藏的技术类帖子",
  "isPublic": true,
  "postCount": 0,
  "createdAt": "2025-11-15T10:00:00.000Z"
}
```

### 7.2 获取收藏夹列表

```
GET /favorites/folders?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "folder-uuid",
      "name": "技术文章",
      "description": "收藏的技术类帖子",
      "isPublic": true,
      "postCount": 5,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 20
  }
}
```

### 7.3 获取收藏夹详情

```
GET /favorites/folders/:id
```

**响应示例**:
```json
{
  "id": "folder-uuid",
  "name": "技术文章",
  "description": "收藏的技术类帖子",
  "isPublic": true,
  "postCount": 5,
  "createdAt": "2025-11-15T10:00:00.000Z"
}
```

### 7.4 更新收藏夹

```
PATCH /favorites/folders/:id
```

**请求体**:
```json
{
  "name": "新名称",
  "description": "新描述",
  "isPublic": false
}
```

**响应示例**:
```json
{
  "message": "收藏夹已更新"
}
```

### 7.5 删除收藏夹

```
DELETE /favorites/folders/:id
```

**响应示例**:
```json
{
  "message": "收藏夹已删除"
}
```

### 7.6 收藏帖子

```
POST /favorites
```

**请求体**:
```json
{
  "postId": "post-uuid",
  "folderId": "folder-uuid"
}
```

**响应示例**:
```json
{
  "id": "favorite-uuid",
  "message": "收藏成功"
}
```

### 7.7 取消收藏

```
DELETE /favorites/:id
```

**响应示例**:
```json
{
  "message": "已取消收藏"
}
```

### 7.8 获取收藏夹中的帖子

```
GET /favorites/folders/:folderId/posts?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "favorite-uuid",
      "post": {
        "id": "post-uuid",
        "title": "帖子标题",
        "author": {
          "nickname": "作者昵称"
        },
        "viewCount": 100,
        "likeCount": 10
      },
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

## 8. 通知功能

### 8.1 获取通知列表

```
GET /notifications?page=1&limit=20&isRead=false&type=LIKE
```

**Query 参数**:
- `page` (可选): 页码
- `limit` (可选): 每页数量
- `isRead` (可选): 是否已读 (`true` / `false`)
- `type` (可选): 通知类型 (`LIKE` / `COMMENT` / `FOLLOW` / `SYSTEM`)

**响应示例**:
```json
{
  "data": [
    {
      "id": "notification-uuid",
      "type": "LIKE",
      "title": "有人点赞了你的帖子",
      "content": "小红点赞了你的帖子《帖子标题》",
      "relatedUser": {
        "id": "user-uuid",
        "username": "student02",
        "nickname": "小红",
        "avatar": "https://example.com/avatar.jpg"
      },
      "relatedPost": {
        "id": "post-uuid",
        "title": "帖子标题"
      },
      "isRead": false,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 8.2 获取未读通知数量

```
GET /notifications/unread/count
```

**响应示例**:
```json
{
  "count": 10
}
```

### 8.3 标记单个通知为已读

```
PATCH /notifications/:id/read
```

**响应示例**:
```json
{
  "message": "通知已标记为已读"
}
```

### 8.4 标记所有通知为已读

```
POST /notifications/read-all
```

**响应示例**:
```json
{
  "message": "所有通知已标记为已读"
}
```

### 8.5 删除通知

```
DELETE /notifications/:id
```

**响应示例**:
```json
{
  "message": "通知已删除"
}
```

---

## 9. 搜索功能

### 9.1 搜索帖子

```
GET /search/posts?q=关键词&page=1&limit=20&sortBy=relevance&tag=技术
```
🔓 无需登录

**Query 参数**:
- `q` (必需): 搜索关键词
- `page` (可选): 页码
- `limit` (可选): 每页数量
- `sortBy` (可选): 排序 (`relevance` / `createdAt` / `viewCount`)
- `tag` (可选): 标签筛选

**响应示例**:
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "包含关键词的帖子标题",
      "content": "帖子内容预览...",
      "author": {
        "nickname": "作者昵称"
      },
      "viewCount": 100,
      "likeCount": 10,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "limit": 20,
    "keyword": "关键词"
  }
}
```

### 9.2 搜索用户

```
GET /search/users?q=用户名&page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "id": "user-uuid",
      "username": "student01",
      "nickname": "小明",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "个人简介",
      "followerCount": 50
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### 9.3 获取热门标签

```
GET /search/tags/popular?limit=10
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "tag": "技术",
      "count": 500
    },
    {
      "tag": "前端",
      "count": 300
    },
    {
      "tag": "生活",
      "count": 250
    }
  ]
}
```

---

## 10. 公告功能

### 10.1 获取公告列表

```
GET /announcements?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "id": "announcement-uuid",
      "title": "系统维护通知",
      "content": "本周五晚上 10 点进行系统维护...",
      "priority": "HIGH",
      "author": {
        "nickname": "管理员"
      },
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### 10.2 获取公告详情

```
GET /announcements/:id
```
🔓 无需登录

**响应示例**:
```json
{
  "id": "announcement-uuid",
  "title": "系统维护通知",
  "content": "本周五晚上 10 点进行系统维护,预计时长 2 小时...",
  "priority": "HIGH",
  "author": {
    "id": "admin-uuid",
    "username": "admin",
    "nickname": "管理员"
  },
  "createdAt": "2025-11-15T10:00:00.000Z"
}
```

---

## 11. 举报功能

### 11.1 创建举报

```
POST /reports
```

**请求体**:
```json
{
  "targetType": "POST",
  "targetId": "post-uuid",
  "reason": "包含不当内容",
  "description": "详细描述违规内容..."
}
```

**targetType 可选值**: `POST` / `COMMENT` / `USER`

**响应示例**:
```json
{
  "id": "report-uuid",
  "message": "举报已提交,我们会尽快处理"
}
```

---

## 12. 草稿功能

### 12.1 创建或更新草稿 (自动保存)

```
POST /posts/drafts
```

**请求体**:
```json
{
  "title": "草稿标题",
  "content": "草稿内容...",
  "tags": ["技术"],
  "images": ["https://example.com/image.jpg"]
}
```

**响应示例**:
```json
{
  "id": "draft-uuid",
  "title": "草稿标题",
  "content": "草稿内容...",
  "tags": ["技术"],
  "images": ["https://example.com/image.jpg"],
  "createdAt": "2025-11-16T10:00:00.000Z",
  "updatedAt": "2025-11-16T10:00:00.000Z"
}
```

### 12.2 获取草稿列表

```
GET /posts/drafts?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "draft-uuid",
      "title": "草稿标题",
      "content": "草稿内容预览...",
      "tags": ["技术"],
      "createdAt": "2025-11-16T10:00:00.000Z",
      "updatedAt": "2025-11-16T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### 12.3 获取草稿详情

```
GET /posts/drafts/:id
```

**响应示例**:
```json
{
  "id": "draft-uuid",
  "title": "草稿标题",
  "content": "完整的草稿内容...",
  "tags": ["技术", "前端"],
  "images": ["https://example.com/image.jpg"],
  "createdAt": "2025-11-16T10:00:00.000Z",
  "updatedAt": "2025-11-16T10:30:00.000Z"
}
```

### 12.4 更新草稿

```
PATCH /posts/drafts/:id
```

**请求体**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "tags": ["新标签"]
}
```

**响应示例**:
```json
{
  "message": "草稿已更新",
  "draft": {
    "id": "draft-uuid",
    "title": "更新后的标题",
    "updatedAt": "2025-11-16T11:00:00.000Z"
  }
}
```

### 12.5 删除草稿

```
DELETE /posts/drafts/:id
```

**响应示例**:
```json
{
  "message": "草稿已删除"
}
```

### 12.6 从草稿发布帖子

```
POST /posts/drafts/:id/publish
```

**响应示例**:
```json
{
  "message": "帖子已发布",
  "post": {
    "id": "post-uuid",
    "title": "帖子标题",
    "createdAt": "2025-11-16T11:00:00.000Z"
  }
}
```

---

## 13. 推荐功能

### 13.1 获取热门帖子

```
GET /recommendations/posts/hot?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "热门帖子标题",
      "content": "内容预览...",
      "author": {
        "nickname": "作者昵称"
      },
      "viewCount": 5000,
      "likeCount": 500,
      "commentCount": 100,
      "createdAt": "2025-11-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 13.2 获取趋势帖子 (新晋热门)

```
GET /recommendations/posts/trending?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "趋势帖子标题",
      "viewCount": 1000,
      "likeCount": 100,
      "commentCount": 20,
      "createdAt": "2025-11-16T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 13.3 获取最新帖子

```
GET /recommendations/posts/latest?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "最新帖子标题",
      "createdAt": "2025-11-16T11:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 20
  }
}
```

### 13.4 获取个性化推荐 (基于关注)

```
GET /recommendations/personalized?page=1&limit=20
```

**响应示例**:
```json
{
  "data": [
    {
      "id": "post-uuid",
      "title": "推荐帖子标题",
      "author": {
        "id": "user-uuid",
        "nickname": "你关注的用户"
      },
      "createdAt": "2025-11-16T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "limit": 20
  }
}
```

### 13.5 获取热门话题

```
GET /recommendations/topics/hot?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "name": "前端技术",
      "postCount": 500,
      "description": "关于前端开发的讨论"
    },
    {
      "name": "校园生活",
      "postCount": 300,
      "description": "分享校园趣事"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 13.6 获取所有话题

```
GET /recommendations/topics?page=1&limit=20
```
🔓 无需登录

**响应示例**:
```json
{
  "data": [
    {
      "name": "技术",
      "postCount": 1000,
      "description": "技术类话题"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

## 错误响应格式

所有接口在出错时都会返回以下格式:

```json
{
  "statusCode": 401,
  "message": "未授权,请先登录",
  "error": "Unauthorized",
  "timestamp": "2025-11-15T10:00:00.000Z",
  "path": "/posts"
}
```

**常见错误码**:
- `400`: 请求参数错误
- `401`: 未登录或 Token 失效
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突 (如用户名已存在)
- `500`: 服务器内部错误

---

## 开发建议

1. **保存 Token**: 登录/注册后保存 `accessToken` 和 `refreshToken`
2. **Token 刷新**: `accessToken` 过期 (401) 时使用 `refreshToken` 刷新
3. **错误处理**: 统一处理 401 错误,自动跳转到登录页
4. **分页**: 所有列表接口都支持分页,建议实现无限滚动或分页器
5. **图片上传**: 先调用文件上传接口获取图片 URL,再传给帖子创建接口

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-16
