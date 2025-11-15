# School Forum 后端接口文档

> 说明：除特别标注为「公开」的接口外，其余接口均需携带登录态（JWT）。管理员接口需要 `role = ADMIN`。

---

## 一、全局说明

### 1. 基础信息

- 协议：HTTP / HTTPS
- 基础地址示例：`http://127.0.0.1:3000`
- 返回格式：`application/json`

### 2. 认证方式

- 全局启用了 JWT 守卫：
  - 标记 `@Public()` 的接口：**无需认证**
  - 未标记 `@Public()`：**需要登录**
  - 标记 `@Roles(Role.ADMIN)`：**需要登录 + 管理员角色**

- Token 携带方式：

  ```http
  Authorization: Bearer <accessToken>
  ```

- Token 来源：
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`

### 3. 分页约定

常用 Query 参数：

- `page`: 页码（默认 `1`）
- `limit`: 每页数量（默认 `20`，部分接口限制在 1–100）

常见返回结构：

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "unreadCount": 3
  }
}
```

部分接口使用 `pagination` 字段，说明会在对应接口标注。

---

## 二、认证模块（Auth）

基路径：`/auth`

### 1. 注册（公开）

- 方法：`POST /auth/register`
- 认证：公开
- 请求体（`RegisterDto`）：

```json
{
  "username": "必填，3-20 字符",
  "email": "必填，邮箱格式",
  "password": "必填，6-50 字符",
  "studentId": "可选，<=50 字符",
  "nickname": "可选，<=100 字符，不传则使用 username",
  "role": "可选，枚举 Role，默认 STUDENT"
}
```

- 响应示例：

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "studentId": "...",
    "nickname": "...",
    "role": "STUDENT",
    "createdAt": "..."
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

- 典型错误：
  - 409：用户名已存在 / 邮箱已被注册

---

### 2. 登录（公开）

- 方法：`POST /auth/login`
- 认证：公开
- 请求体（`LoginDto`）：

```json
{
  "email": "必填，邮箱",
  "password": "必填，字符串"
}
```

- 响应示例：

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "email": "...",
    "studentId": "...",
    "nickname": "...",
    "avatar": "...",
    "role": "STUDENT",
    "isActive": true,
    "isBanned": false
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

- 典型错误：
  - 401：邮箱或密码错误 / 用户未激活 / 用户已被封禁

---

### 3. 刷新令牌（公开）

- 方法：`POST /auth/refresh`
- 认证：公开
- 请求体（`RefreshTokenDto`）：

```json
{
  "refreshToken": "必填，refresh token 字符串"
}
```

- 响应示例：

```json
{
  "accessToken": "新的 access token",
  "refreshToken": "新的 refresh token"
}
```

- 典型错误：
  - 401：Refresh Token 无效或已过期 / 用户状态异常

---

### 4. 登出

- 方法：`POST /auth/logout`
- 认证：需要登录
- 请求体：无
- 响应：

```json
{
  "message": "登出成功"
}
```

> 当前实现为占位，未做服务端 Token 黑名单处理。

---

## 三、用户模块（Users + Follows + 用户点赞列表）

基路径：`/users`

### 1. 获取当前用户资料

- 方法：`GET /users/me`
- 认证：需要登录
- 请求：无额外参数
- 响应示例：

```json
{
  "id": "...",
  "username": "...",
  "email": "...",
  "studentId": "...",
  "nickname": "...",
  "avatar": "...",
  "bio": "...",
  "role": "STUDENT",
  "isActive": true,
  "isBanned": false,
  "createdAt": "...",
  "updatedAt": "...",
  "_count": {
    "posts": 10,
    "comments": 5,
    "likes": 20
  }
}
```

---

### 2. 更新当前用户资料

- 方法：`PATCH /users/me`
- 认证：需要登录
- 请求体（`UpdateUserDto`）：

```json
{
  "nickname": "可选，<=100 字符",
  "bio": "可选，<=500 字符",
  "avatar": "可选，URL"
}
```

- 响应：更新后的用户资料（不包含密码）。

---

### 3. 获取指定用户详情

- 方法：`GET /users/:id`
- 认证：需要登录
- 路径参数：
  - `id`: 用户 ID
- 响应示例：

```json
{
  "id": "...",
  "username": "...",
  "nickname": "...",
  "avatar": "...",
  "bio": "...",
  "role": "...",
  "createdAt": "...",
  "stats": {
    "postCount": 10,
    "followerCount": 0,
    "followingCount": 0
  }
}
```

---

### 4. 获取用户发帖列表

- 方法：`GET /users/:id/posts`
- 认证：需要登录
- 路径参数：
  - `id`: 用户 ID
- Query：
  - `page`：默认 `1`
  - `limit`：默认 `20`
- 响应示例：

```json
{
  "data": [
    {
      "id": "...",
      "title": "...",
      "content": "...",
      "images": ["..."],
      "viewCount": 0,
      "createdAt": "...",
      "updatedAt": "...",
      "author": {
        "id": "...",
        "username": "...",
        "nickname": "...",
        "avatar": "..."
      },
      "commentCount": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 5. 获取用户点赞列表（公开）

- 方法：`GET /users/:id/likes`
- 认证：公开
- 路径参数：
  - `id`: 用户 ID
- Query：
  - `page`：默认 `1`
  - `limit`：默认 `20`
- 响应示例：

```json
{
  "data": [
    {
      "id": "...",
      "userId": "...",
      "targetId": "...",
      "targetType": "POST",
      "createdAt": "...",
      "target": {
        "id": "...",
        "title": "...",
        "content": "...",
        "images": ["..."],
        "viewCount": 0,
        "createdAt": "...",
        "author": { "id": "...", "username": "...", "nickname": "...", "avatar": "..." }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

目标是帖子或评论时，`targetType` 分别为 `POST` 或 `COMMENT`，`target` 字段结构略有差异。

---

## 四、关注模块（Follows）

仍使用 `/users` 前缀。

### 1. 关注用户

- 方法：`POST /users/:id/follow`
- 认证：需要登录
- 路径参数：
  - `id`: 要关注的用户 ID
- 请求体（`CreateFollowDto`）：

```json
{
  "followingId": "可传任意，后端会覆盖为路径 :id"
}
```

- 响应：

```json
{
  "message": "关注成功",
  "followingId": "..."
}
```

---

### 2. 取消关注

- 方法：`DELETE /users/:id/follow`
- 认证：需要登录
- 响应：

```json
{
  "message": "已取消关注",
  "followingId": "..."
}
```

---

### 3. 获取用户的关注列表

- 方法：`GET /users/:id/following`
- 认证：需要登录
- Query：`page`，`limit`
- 响应：

```json
{
  "data": [
    {
      "id": "...",
      "username": "...",
      "nickname": "...",
      "avatar": "...",
      "bio": "...",
      "role": "...",
      "followerCount": 10,
      "followingCount": 5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 30
  }
}
```

---

### 4. 获取用户的粉丝列表

- 方法：`GET /users/:id/followers`
- 认证：需要登录
- Query：`page`，`limit`
- 响应结构与关注列表类似，只是数据来源为粉丝。

---

## 五、帖子模块（Posts）

基路径：`/posts`

### 1. 创建帖子

- 方法：`POST /posts`
- 认证：需要登录
- 请求体（`CreatePostDto`）：

```json
{
  "title": "必填，5-200 字符",
  "content": "必填，10-50000 字符",
  "images": ["可选，URL 数组，最多 9 个"],
  "tags": ["可选，字符串数组，最多 10 个"]
}
```

- 响应：帖子对象，包含作者信息，以及 `likeCount: 0`、`commentCount: 0`。

---

### 2. 获取帖子列表（公开）

- 方法：`GET /posts`
- 认证：公开
- Query：
  - `page`：默认 `1`
  - `limit`：默认 `20`
  - `sortBy`：`createdAt | viewCount`，默认 `createdAt`
  - `order`：`asc | desc`，默认 `desc`
  - `tag`：可选，按标签过滤
  - `authorId`：可选，按作者过滤
- 响应示例：

```json
{
  "data": [
    {
      "id": "...",
      "title": "...",
      "content": "...",
      "images": ["..."],
      "tags": ["..."],
      "viewCount": 0,
      "createdAt": "...",
      "updatedAt": "...",
      "author": {
        "id": "...",
        "username": "...",
        "nickname": "...",
        "avatar": "..."
      },
      "likeCount": 0,
      "commentCount": 0
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

### 3. 获取帖子详情（公开）

- 方法：`GET /posts/:id`
- 认证：公开（带登录态时会多返回 `isLikedByMe`）
- 路径参数：
  - `id`: 帖子 ID
- 响应示例：

```json
{
  "id": "...",
  "title": "...",
  "content": "...",
  "images": ["..."],
  "tags": ["..."],
  "viewCount": 0,
  "createdAt": "...",
  "updatedAt": "...",
  "author": {
    "id": "...",
    "username": "...",
    "nickname": "...",
    "avatar": "...",
    "role": "STUDENT"
  },
  "likeCount": 0,
  "commentCount": 0,
  "isLikedByMe": true
}
```

> 每次获取详情会自动增加浏览量。

---

### 4. 获取帖子评论列表（公开，带嵌套回复）

- 方法：`GET /posts/:id/comments`
- 认证：公开
- 路径参数：
  - `id`: 帖子 ID
- Query：
  - `page`：默认 `1`（针对于一级评论）
  - `limit`：默认 `20`
  - `sortBy`：`createdAt | likeCount`，默认 `createdAt`
- 响应示例：

```json
{
  "data": [
    {
      "id": "...",
      "content": "...",
      "postId": "...",
      "author": {
        "id": "...",
        "username": "...",
        "nickname": "...",
        "avatar": "..."
      },
      "likeCount": 0,
      "replyCount": 3,
      "replies": [
        {
          "id": "...",
          "content": "...",
          "author": { "id": "...", "username": "...", "nickname": "...", "avatar": "..." },
          "likeCount": 0
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 30
  }
}
```

---

### 5. 更新帖子

- 方法：`PATCH /posts/:id`
- 认证：需要登录（仅作者）
- 请求体（`UpdatePostDto`）：同 `CreatePostDto`，全部字段可选。
- 响应：更新后的帖子对象。

---

### 6. 删除帖子

- 方法：`DELETE /posts/:id`
- 认证：需要登录（作者或管理员）
- 响应：

```json
{
  "message": "帖子删除成功"
}
```

> 为软删除，会设置 `isDeleted: true` 和 `deletedAt`。

---

## 六、草稿模块（Drafts）

基路径：`/posts/drafts`

### 1. 创建或更新草稿

- 方法：`POST /posts/drafts`
- 认证：需要登录
- 请求体（`CreatePostDraftDto`）：

```json
{
  "title": "可选，<=200 字符",
  "content": "可选",
  "images": ["可选，字符串数组"],
  "tags": ["可选，字符串数组"]
}
```

- 行为：如果当前用户已有草稿，则更新最近的草稿，否则创建新草稿。
- 响应：草稿对象。

---

### 2. 获取草稿列表

- 方法：`GET /posts/drafts`
- 认证：需要登录
- Query：`page`，`limit`
- 响应：

```json
{
  "data": [
    { "id": "...", "title": "...", "content": "...", "updatedAt": "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

---

### 3. 获取单个草稿

- 方法：`GET /posts/drafts/:id`
- 认证：需要登录（作者本人）
- 响应：草稿对象。

---

### 4. 更新草稿

- 方法：`PATCH /posts/drafts/:id`
- 认证：需要登录（作者本人）
- 请求体：`UpdatePostDraftDto`，字段同 `CreatePostDraftDto`，全部可选。
- 响应：更新后的草稿对象。

---

### 5. 删除草稿

- 方法：`DELETE /posts/drafts/:id`
- 认证：需要登录（作者本人）
- 响应：

```json
{
  "message": "草稿已删除"
}
```

---

### 6. 从草稿发布帖子

- 方法：`POST /posts/drafts/:id/publish`
- 认证：需要登录（作者本人）
- 要求：草稿必须包含 `title` 和 `content`。
- 响应：

```json
{
  "message": "帖子已发布",
  "post": { ...帖子对象... }
}
```

---

## 七、评论模块（Comments）

基路径：`/comments`

### 1. 创建评论或回复

- 方法：`POST /comments`
- 认证：需要登录
- 请求体（`CreateCommentDto`）：

```json
{
  "postId": "必填，UUID 帖子 ID",
  "content": "必填，1-1000 字符",
  "parentId": "可选，UUID 父评论 ID；不传表示一级评论"
}
```

- 响应：评论对象 + `likeCount`。

---

### 2. 获取评论的所有回复（分页）

- 方法：`GET /comments/:id/replies`
- 认证：公开
- Query：`page`，`limit`
- 响应：

```json
{
  "data": [
    {
      "id": "...",
      "content": "...",
      "author": { "id": "...", "username": "...", "nickname": "...", "avatar": "..." },
      "likeCount": 0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

---

### 3. 删除评论

- 方法：`DELETE /comments/:id`
- 认证：需要登录（作者或管理员）
- 响应：

```json
{
  "message": "评论删除成功"
}
```

---

## 八、点赞模块（Likes）

基路径：`/likes`

### 1. 点赞 / 取消点赞切换

- 方法：`POST /likes/toggle`
- 认证：需要登录
- 请求体（`ToggleLikeDto`）：

```json
{
  "targetId": "必填，UUID",
  "targetType": "必填，枚举 TargetType：'POST' 或 'COMMENT'"
}
```

- 响应：

```json
{
  "message": "点赞成功",
  "data": {
    "isLiked": true,
    "likeCount": 10
  }
}
```

再次调用同一目标会变为取消点赞：`"isLiked": false`。

---

## 九、收藏模块（Favorites）

基路径：`/favorites`

### 1. 创建收藏夹

- 方法：`POST /favorites/folders`
- 认证：需要登录
- 请求体（`CreateFolderDto`）：

```json
{
  "name": "必填，<=50 字符",
  "description": "可选，<=200 字符"
}
```

- 响应：收藏夹对象。

---

### 2. 获取收藏夹列表

- 方法：`GET /favorites/folders`
- 认证：需要登录
- Query：`page`，`limit`
- 响应：

```json
{
  "data": [
    {
      "id": "...",
      "name": "...",
      "description": "...",
      "userId": "...",
      "isDefault": false,
      "favoriteCount": 3
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### 3. 获取收藏夹详情

- 方法：`GET /favorites/folders/:id`
- 认证：需要登录（只能访问自己的收藏夹）
- 响应：收藏夹对象。

---

### 4. 更新收藏夹

- 方法：`PATCH /favorites/folders/:id`
- 认证：需要登录（自己的收藏夹）
- 请求体（`UpdateFolderDto`）：

```json
{
  "name": "可选，<=50 字符",
  "description": "可选，<=200 字符"
}
```

- 响应：更新后的收藏夹。

---

### 5. 删除收藏夹

- 方法：`DELETE /favorites/folders/:id`
- 认证：需要登录（自己的收藏夹，且不能删除默认收藏夹）
- 响应：

```json
{
  "message": "收藏夹已删除"
}
```

---

### 6. 收藏帖子

- 方法：`POST /favorites`
- 认证：需要登录
- 请求体（`CreateFavoriteDto`）：

```json
{
  "postId": "必填，帖子 UUID",
  "folderId": "必填，收藏夹 UUID（必须属于当前用户）",
  "note": "可选，备注 <=500 字符"
}
```

- 响应：收藏记录对象（包含帖子部分字段）。

---

### 7. 取消收藏

- 方法：`DELETE /favorites/:id`
- 认证：需要登录（自己的收藏记录）
- 响应：

```json
{
  "message": "取消收藏成功"
}
```

---

### 8. 获取收藏夹中的帖子列表

- 方法：`GET /favorites/folders/:folderId/posts`
- 认证：需要登录（自己的收藏夹）
- Query：`page`，`limit`
- 响应：

```json
{
  "data": [
    {
      "id": "favoriteId",
      "userId": "...",
      "postId": "...",
      "folderId": "...",
      "note": "...",
      "post": {
        "id": "...",
        "title": "...",
        "content": "...",
        "images": ["..."],
        "tags": ["..."],
        "viewCount": 0,
        "likeCount": 0,
        "commentCount": 0,
        "authorId": "...",
        "createdAt": "...",
        "author": { "id": "...", "username": "...", "nickname": "...", "avatar": "..." }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

---

## 十、通知模块（Notifications）

基路径：`/notifications`

### 1. 获取通知列表

- 方法：`GET /notifications`
- 认证：需要登录
- Query：
  - `page`：默认 `1`
  - `limit`：默认 `20`
  - `isRead`：可选，字符串 `"true" | "false"`
  - `type`：可选，枚举 `NotificationType`
- 响应：

```json
{
  "data": [
    {
      "id": "...",
      "userId": "...",
      "type": "COMMENT | REPLY | LIKE | SYSTEM ...",
      "title": "...",
      "content": "...",
      "relatedId": "...",
      "isRead": false,
      "createdAt": "..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "unreadCount": 3
  }
}
```

---

### 2. 获取未读通知数量

- 方法：`GET /notifications/unread/count`
- 认证：需要登录
- 响应：

```json
{
  "unreadCount": 3
}
```

---

### 3. 标记单个通知为已读

- 方法：`PATCH /notifications/:id/read`
- 认证：需要登录（只能操作自己的通知）
- 响应：更新后的通知对象。

---

### 4. 全部标记为已读

- 方法：`POST /notifications/read-all`
- 认证：需要登录
- 响应：

```json
{
  "message": "所有通知已标记为已读",
  "count": 10
}
```

---

### 5. 删除通知

- 方法：`DELETE /notifications/:id`
- 认证：需要登录（自己的通知）
- 响应：

```json
{
  "message": "通知删除成功"
}
```

---

## 十一、搜索模块（Search）

基路径：`/search`

### 1. 搜索帖子（公开）

- 方法：`GET /search/posts`
- 认证：公开
- Query：
  - `q`：必填，搜索关键词，不能为空
  - `page`：默认 `1`
  - `limit`：默认 `20`
  - `sortBy`：`relevance | createdAt | viewCount`，默认 `relevance`
  - `tag`：可选，按标签过滤
- 响应：

```json
{
  "data": [
    {
      "id": "...",
      "title": "...",
      "content": "内容摘要，<=200 字符",
      "images": ["..."],
      "tags": ["..."],
      "viewCount": 0,
      "createdAt": "...",
      "updatedAt": "...",
      "author": { "id": "...", "username": "...", "nickname": "...", "avatar": "..." },
      "commentCount": 0,
      "likeCount": 0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "query": "关键词"
  }
}
```

> `content` 字段为截断后的摘要。

---

### 2. 搜索用户（公开）

- 方法：`GET /search/users`
- 认证：公开
- Query：
  - `q`：必填，关键词
  - `page`：默认 `1`
  - `limit`：默认 `20`
- 响应：

```json
{
  "data": [
    {
      "id": "...",
      "username": "...",
      "nickname": "...",
      "avatar": "...",
      "bio": "...",
      "role": "...",
      "createdAt": "...",
      "postCount": 10
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 20,
    "query": "关键词"
  }
}
```

---

### 3. 获取热门标签（公开）

- 方法：`GET /search/tags/popular`
- 认证：公开
- Query：
  - `limit`：默认 `10`
- 响应：

```json
[
  { "tag": "tag1", "count": 100 },
  { "tag": "tag2", "count": 80 }
]
```

---

## 十二、推荐模块（Recommendations）

基路径：`/recommendations`

### 1. 热门帖子（公开）

- 方法：`GET /recommendations/posts/hot`
- 认证：公开
- Query：`page`，`limit`（1–100）
- 响应：`data` 为热门帖子列表，`meta` 为分页信息。

### 2. 趋势帖子（新晋热门，公开）

- 方法：`GET /recommendations/posts/trending`
- 认证：公开
- Query：`page`，`limit`（1–100）
- 响应：最近 7 天内评论数较高的帖子列表。

### 3. 最新帖子（公开）

- 方法：`GET /recommendations/posts/latest`
- 认证：公开
- Query：`page`，`limit`（1–100）
- 响应：按创建时间倒序的帖子列表。

### 4. 个性化推荐（关注关系）

- 方法：`GET /recommendations/personalized`
- 认证：需要登录
- Query：`page`，`limit`
- 行为：
  - 若当前用户有关注的人：返回这些人发布的帖子列表
  - 否则：等价于热门帖子列表

### 5. 热门话题（公开）

- 方法：`GET /recommendations/topics/hot`
- 认证：公开
- Query：`page`，`limit`（1–100）
- 响应：`isHot = true` 的话题列表，按 `postCount` 排序。

### 6. 所有话题（公开）

- 方法：`GET /recommendations/topics`
- 认证：公开
- Query：`page`，`limit`（1–100）
- 响应：所有话题，按 `postCount` 排序。

---

## 十三、管理员模块（Admin）

部分接口是普通用户可调用的举报创建，部分仅管理员可用。

### 1. 创建举报（普通用户）

- 方法：`POST /reports`
- 认证：需要登录
- 请求体（`CreateReportDto`）：

```json
{
  "targetId": "必填，被举报对象 ID",
  "targetType": "必填，枚举 ReportTarget: 'POST' | 'COMMENT' | 'USER'",
  "reason": "必填，>=5 字符"
}
```

- 响应：举报记录对象。

---

### 2. 获取举报列表（管理员）

- 方法：`GET /admin/reports`
- 认证：管理员
- Query：
  - `page`，`limit`
  - `status`：可选，枚举 `ReportStatus`（如：`PENDING`、`APPROVED`、`REJECTED`）
  - `targetType`：可选，`ReportTarget`（`POST` / `COMMENT` / `USER`）
- 响应：`data` 为举报记录列表（带 `reporter`、`handler` 信息），`meta` 分页。

---

### 3. 处理举报（管理员）

- 方法：`PATCH /admin/reports/:id`
- 认证：管理员
- 请求体（`HandleReportDto`）：

```json
{
  "status": "必填，ReportStatus 枚举，如 'APPROVED' 或 'REJECTED'",
  "handleNote": "可选，处理备注"
}
```

- 行为（当 `status = APPROVED` 时）：
  - 举报帖子：软删除该帖子
  - 举报评论：软删除该评论
  - 举报用户：封禁该用户

---

### 4. 获取用户列表（管理员）

- 方法：`GET /admin/users`
- 认证：管理员
- Query：
  - `page`，`limit`
  - `role`：可选，按角色过滤
  - `isBanned`：可选，`"true" | "false"`
- 响应：`data` 为用户列表（包含 `postCount`、`commentCount`），`meta` 分页。

---

### 5. 封禁 / 解封用户（管理员）

- 方法：
  - `POST /admin/users/:id/ban`
  - `POST /admin/users/:id/unban`
- 认证：管理员
- 响应示例：

```json
{
  "message": "用户已被封禁"
}
```

```json
{
  "message": "用户已被解封"
}
```

---

### 6. 获取系统统计（管理员）

- 方法：`GET /admin/statistics`
- 认证：管理员
- 响应示例：

```json
{
  "totalUsers": 0,
  "totalPosts": 0,
  "totalComments": 0,
  "totalReports": 0,
  "pendingReports": 0,
  "bannedUsers": 0
}
```

---

## 十四、根接口（健康检查）

### 1. 根路由

- 方法：`GET /`
- 认证：需要登录（未标记公开，受全局 JWT 守卫保护）
- 响应：字符串（示例：`"Hello World!"`）。

---

> 如需补充字段示例或错误码规范，可以在此文件基础上继续追加表格说明。