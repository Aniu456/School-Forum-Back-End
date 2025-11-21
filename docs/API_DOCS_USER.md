# 网站用户端 API 接口文档

> **文档范围说明**：本文档描述的是后端提供的「**网站用户端服务**」的所有 HTTP 接口。  
> 服务对象：**网站前台前端**，供普通用户使用网站的所有功能（注册登录、浏览帖子、发帖评论、收藏关注、私信通知等）。  
> 如需查看管理端/后台系统接口，请参阅《管理端 / 后台系统端 API 接口文档》（`API_DOCS_BACKEND.md`）。

## 基础说明

- **基础 URL（开发环境）**：`http://localhost:30000`
- **认证方式**：除标记为"公开接口"的路由外，请在请求头中携带：

  `Authorization: Bearer <accessToken>`

- **角色说明**：`USER` 为普通用户，`ADMIN` 为管理员
- **统一成功响应结构**（由全局拦截器包装）：

  ```json
  {
    "success": true,
    "data": { ... },
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
  ```

- **统一错误响应结构**（由全局异常过滤器返回）：

  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "错误信息",
    "path": "/请求路径",
    "method": "GET",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
  ```

下文如果未特别标注"公开接口"，默认均需要携带 JWT 访问。

## 文件上传 `/upload`

文件上传功能支持本地存储，上传成功后会返回可访问的文件 URL。

### 上传头像
**POST** `/upload/avatar`

- 需要认证
- Content-Type: `multipart/form-data`
- 文件大小限制：2MB
- 支持格式：JPEG, PNG, GIF, WebP

```typescript
// 请求（Form Data）
{
  file: File;  // 表单字段名必须是 "file"
}

// 响应
{
  filename: string;  // 服务器上的文件名（UUID + 扩展名）
  url: string;       // 完整访问URL，如 http://localhost:30000/uploads/avatars/xxx.jpg
}
```

### 上传单张图片
**POST** `/upload/image`

- 需要认证
- Content-Type: `multipart/form-data`
- 文件大小限制：5MB
- 支持格式：JPEG, PNG, GIF, WebP

```typescript
// 请求（Form Data）
{
  file: File;  // 表单字段名必须是 "file"
}

// 响应
{
  filename: string;
  url: string;
}
```

### 上传多张图片
**POST** `/upload/images`

- 需要认证
- Content-Type: `multipart/form-data`
- 最多上传：9张
- 单个文件大小限制：5MB
- 支持格式：JPEG, PNG, GIF, WebP

```typescript
// 请求（Form Data）
{
  files: File[];  // 表单字段名必须是 "files"
}

// 响应
{
  filenames: string[];  // 文件名数组
  urls: string[];       // URL数组
}
```

### 上传文档
**POST** `/upload/document`

- 需要认证
- Content-Type: `multipart/form-data`
- 文件大小限制：20MB
- 支持格式：PDF, Word (doc/docx), Excel (xls/xlsx), PowerPoint (ppt/pptx), TXT, ZIP, RAR

```typescript
// 请求（Form Data）
{
  file: File;  // 表单字段名必须是 "file"
}

// 响应
{
  filename: string;      // 服务器上的文件名
  originalName: string;  // 原始文件名
  url: string;           // 完整访问URL
}
```

**使用说明**：
1. 上传成功后，返回的 `url` 字段可以直接用于更新用户资料、发布帖子等操作
2. 例如上传头像后，调用 `PATCH /users/me` 并传入 `{ avatar: "返回的url" }`
3. 发布帖子图片时，先批量上传图片获取 URLs，再调用 `POST /posts` 并传入 `{ images: ["url1", "url2", ...] }`
4. 上传的文件会自动重命名为 UUID，避免文件名冲突
5. 文件存储在服务器的 `uploads/` 目录下，按类型分为 `avatars/`、`images/`、`documents/` 三个子目录

---

## 认证相关 `/auth`

### 注册
**POST** `/auth/register`

```typescript
// 请求体
{
  email: string;          // 邮箱
  username: string;       // 用户名，3-20字符
  password: string;       // 密码，6-20字符
  nickname?: string;      // 昵称，可选
}

// 响应
{
  user: {
    id: string;           // 用户ID
    username: string;     // 用户名
    email: string;        // 邮箱
    nickname: string;     // 昵称
    avatar: string;       // 头像URL
    role: "USER";         // 角色
    createdAt: Date;      // 注册时间
  };
  accessToken: string;    // 访问令牌，前端在 Authorization 头中携带
  refreshToken: string;   // 刷新令牌，用于调用刷新接口
}
```

### 登录
**POST** `/auth/login`

```typescript
// 请求体
{
  email: string;          // 邮箱
  password: string;       // 密码
}

// 响应
{
  accessToken: string;    // 访问令牌，前端在 Authorization 头中携带
  refreshToken: string;   // 刷新令牌，用于 /auth/refresh
  user: {
    id: string;
    username: string;
    email: string;
    nickname: string;
    avatar: string;
    role: string;
  };
}
```

### 刷新令牌
**POST** `/auth/refresh`

```typescript
// 请求体
{
  refreshToken: string;   // 刷新令牌
}

// 响应
{
  accessToken: string;    // 新的访问令牌
  refreshToken: string;   // 新的刷新令牌
}
```

### 登出
**POST** `/auth/logout`

需要认证。

### 忘记密码（发送验证码）
**POST** `/auth/forgot-password`

```typescript
// 请求体
{
  email: string;          // 注册邮箱
}

// 响应
{
  message: string;
  // 开发环境会返回 code 便于调试
  code?: string;
}
```

### 重置密码
**POST** `/auth/reset-password`

```typescript
// 请求体
{
  email: string;
  code: string;           // 验证码
  newPassword: string;
}

// 响应
{
  message: string;
}
```

### 管理员注册（需管理员密钥）
**POST** `/auth/register-admin`

```typescript
// 请求体
{
  email: string;
  username: string;
  password: string;
  adminKey: string;       // ADMIN_REGISTRATION_KEY
  nickname?: string;
}

// 响应同普通注册，role 固定为 ADMIN
}

#### 接口认证要求一览

- 公开接口（无需携带 Authorization 头）：
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `POST /auth/register-admin`（仅用于初始化管理员，正式环境不要暴露在前台 UI 中）
- 需要认证（必须携带 `Authorization: Bearer <accessToken>`）：
  - `POST /auth/logout`

#### 推荐使用流程（给前端/实习生）

1. **首次登录 / 注册**：
   - 调用 `POST /auth/register` 或 `POST /auth/login`；
   - 将返回的 `accessToken` 保存在内存/状态管理或安全存储中，将 `refreshToken` 保存在 HttpOnly Cookie 或安全存储中。
2. **后续请求业务接口**：
   - 在除文档标注为“公开接口”的所有请求中，统一带上：
     - `Authorization: Bearer <accessToken>`。
3. **AccessToken 过期时**：
   - 捕获 401/403 错误后，调用 `POST /auth/refresh`，传入 `refreshToken`；
   - 用新的 `accessToken` 覆盖旧值（必要时同时更新 `refreshToken`）。
4. **忘记密码**：
   - 调用 `POST /auth/forgot-password` 获取验证码（开发环境可在响应中看到 `code`）；
   - 再调用 `POST /auth/reset-password` 完成重置。
5. **退出登录**：
   - 调用 `POST /auth/logout`（前端同时清理本地保存的 token / 用户信息）。

---

## 用户相关 `/users`

### 获取当前用户信息
**GET** `/users/me`

```typescript
// 响应
{
  id: string;             // 用户ID
  username: string;       // 用户名
  email: string;          // 邮箱
  nickname: string;       // 昵称
  avatar: string;         // 头像
  bio: string;            // 个人简介
  role: string;           // 角色
  isActive: boolean;      // 是否激活
  isBanned: boolean;      // 是否被封禁
  createdAt: Date;        // 注册时间
  updatedAt: Date;        // 更新时间
  _count: {
    posts: number;        // 帖子数
    comments: number;     // 评论数
    likes: number;        // 点赞数
  }
}
```

### 更新当前用户资料
**PATCH** `/users/me`

```typescript
// 请求体
{
  nickname?: string;      // 昵称
  avatar?: string;        // 头像URL
  bio?: string;           // 个人简介
}

// 响应：同用户信息
```

### 获取用户详情
**GET** `/users/:id`

公开接口。响应同上。

### 获取用户发帖列表
**GET** `/users/:id/posts?page=1&limit=20`

```typescript
// 响应
{
  data: Post[];           // 帖子列表
  meta: {
    page: number;         // 当前页
    limit: number;        // 每页条数
    total: number;        // 总数
  }
}
```

### 获取用户点赞列表
**GET** `/users/:id/likes?page=1&limit=20`

公开接口。

### 获取用户动态
**GET** `/users/:id/activity?type=posts&page=1&limit=20`

```typescript
// type: posts | comments | likes | favorites | following | followers

// 响应：不传type返回统计数据
{
  stats: {
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    totalFavorites: number;
    totalFollowing: number;
    totalFollowers: number;
  },
  recentPosts: Post[];    // 最近5条帖子
  recentComments: Comment[]; // 最近5条评论
}

// 传type返回分页数据
{
  data: any[];
  meta: { page, limit, total }
}
```

---

## 帖子相关 `/posts`

### 创建帖子
**POST** `/posts`

```typescript
// 请求体
{
  title: string;          // 标题，1-200字符
  content: string;        // 内容
  tags?: string[];        // 标签数组
  images?: string[];      // 图片URL数组
}

// 响应
{
  id: string;             // 帖子ID
  title: string;          // 标题
  content: string;        // 内容
  tags: string[];         // 标签
  images: string[];       // 图片
  authorId: string;       // 作者ID
  viewCount: number;      // 浏览量
  likeCount: number;      // 点赞数
  commentCount: number;   // 评论数
  isPinned: boolean;      // 是否置顶
  isHighlighted: boolean; // 是否加精
  createdAt: Date;        // 创建时间
  updatedAt: Date;        // 更新时间
  author: {               // 作者信息
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  }
}
```

### 获取帖子列表
**GET** `/posts?page=1&limit=20&sortBy=createdAt&order=desc&tag=前端`

```typescript
// sortBy: createdAt | viewCount
// order: asc | desc
// tag: 标签筛选

// 响应
{
  data: Post[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

### 获取帖子详情
**GET** `/posts/:id`

公开接口。响应同创建帖子。

### 更新帖子
**PATCH** `/posts/:id`

只能更新自己的帖子。

### 删除帖子
**DELETE** `/posts/:id`

只能删除自己的帖子。**物理删除**，删除后数据将不可恢复。

---

## 评论相关 `/comments`

### 创建评论
**POST** `/comments`

```typescript
// 请求体
{
  postId: string;         // 帖子ID
  content: string;        // 评论内容
  parentId?: string;      // 父评论ID（回复）
}

// 响应
{
  id: string;
  postId: string;
  content: string;
  authorId: string;
  parentId: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  }
}
```

### 获取帖子评论
**GET** `/posts/:id/comments?page=1&limit=20&sortBy=createdAt`

- `sortBy`: `createdAt | likeCount`，默认 `createdAt`
- 公开接口。

### 获取评论回复
**GET** `/comments/:id/replies?page=1&limit=10`

公开接口。

### 删除评论
**DELETE** `/comments/:id`

只能删除自己的评论。**物理删除**，删除后数据将不可恢复。

---

## 点赞相关 `/likes`

### 点赞/取消点赞
**POST** `/likes/toggle`

```typescript
// 请求体
{
  targetId: string;       // 目标ID（帖子或评论）
  targetType: "POST" | "COMMENT"; // 目标类型
}

// 响应
{
  message: string;        // "点赞成功" 或 "取消点赞成功"
  data: {
    isLiked: boolean;     // 当前点赞状态
    likeCount: number;    // 最新点赞数
  };
}
```

---

## 收藏相关 `/favorites`

### 创建收藏夹
**POST** `/favorites/folders`

```typescript
// 请求体
{
  name: string;           // 收藏夹名称
  description?: string;   // 描述
}

// 响应
{
  id: string;
  name: string;
  description: string;
  postCount: number;
  isDefault: boolean;
  createdAt: Date;
}
```

### 收藏帖子
**POST** `/favorites`

```typescript
// 请求体
{
  postId: string;         // 帖子ID
  folderId?: string;      // 收藏夹ID（可选，前端通常传当前选中的收藏夹）
}
```

### 获取我的收藏夹
**GET** `/favorites/folders`

### 获取收藏夹详情
**GET** `/favorites/folders/:id`

### 获取收藏夹中的帖子
**GET** `/favorites/folders/:folderId/posts?page=1&limit=20`

### 更新收藏夹
**PATCH** `/favorites/folders/:id`

```typescript
// 请求体
{
  name?: string;           // 收藏夹名称
  description?: string;    // 描述
}
```

### 删除收藏夹
**DELETE** `/favorites/folders/:id`

> 删除收藏夹会同时删除该收藏夹中的收藏记录（不影响帖子本身）。

### 取消收藏
**DELETE** `/favorites/:id`

---

## 关注相关 `/users/:id/follow`

### 关注用户
**POST** `/users/:id/follow`

```typescript
// 响应
{
  message: "关注成功";
  followingId: string;
}
```

### 取消关注
**DELETE** `/users/:id/follow`

### 获取关注列表
**GET** `/users/:id/following?page=1&limit=20`

公开接口。

### 获取粉丝列表
**GET** `/users/:id/followers?page=1&limit=20`

公开接口。

---

## 草稿相关 `/posts/drafts`

### 创建/更新草稿
**POST** `/posts/drafts`

```typescript
// 请求体
{
  title?: string;
  content?: string;
  tags?: string[];
  images?: string[];
}

// 响应：草稿对象
```

### 获取我的草稿列表
**GET** `/posts/drafts?page=1&limit=20`

### 获取草稿详情
**GET** `/posts/drafts/:id`

### 发布草稿
**POST** `/posts/drafts/:id/publish`

### 删除草稿
**DELETE** `/posts/drafts/:id`

---

## 搜索 `/search`

### 搜索帖子
**GET** `/search/posts?q=关键词&page=1&limit=20&sortBy=relevance&tag=前端`

公开接口。

### 搜索用户
**GET** `/search/users?q=用户名&page=1&limit=20`

公开接口。

### 获取热门搜索标签
**GET** `/search/tags/popular?limit=10`

公开接口。返回当前热门的搜索标签，用于搜索建议。

---

## 推荐相关 `/recommendations`

### 获取推荐帖子（个性化）
**GET** `/recommendations/personalized?page=1&limit=20`

需要登录，根据当前用户的关注关系等生成个性化推荐。

### 获取热门帖子
**GET** `/recommendations/posts/hot?page=1&limit=20`

公开接口。

### 获取趋势帖子
**GET** `/recommendations/posts/trending?page=1&limit=20`

公开接口。

### 获取最新帖子
**GET** `/recommendations/posts/latest?page=1&limit=20`

公开接口。

### 获取关注用户动态
**GET** `/recommendations/following?page=1&limit=20`

需要登录，返回关注用户最新发布的帖子。

> 别名：`GET /recommendations/following-feed`，行为与 `/recommendations/following` 相同。

### 获取热门话题
**GET** `/recommendations/topics/hot?limit=20`

公开接口。

### 获取所有话题
**GET** `/recommendations/topics?page=1&limit=20`

公开接口。

---

## 算法相关 `/algorithms`

### 获取热门帖子（算法）
**GET** `/algorithms/hot-posts?limit=20`

公开接口。Reddit热度算法。

### 获取趋势帖子（算法）
**GET** `/algorithms/trending-posts?limit=20`

公开接口。

### 获取优质帖子
**GET** `/algorithms/quality-posts?limit=20`

公开接口。

### 获取热门标签
**GET** `/algorithms/hot-tags?limit=50`

公开接口。

### 获取趋势标签
**GET** `/algorithms/trending-tags?limit=30`

公开接口。

### 搜索标签
**GET** `/algorithms/search-tags?q=关键词&limit=20`

- `limit`：可选，默认 `10`。

公开接口。

### 获取相关标签
**GET** `/algorithms/related-tags?tags=前端,React&limit=10`

- `tags`：以逗号分隔的标签列表，例如 `tags=前端,React`；
- `limit`：可选，默认 `5`。

公开接口。

---

## 积分相关 `/points`

### 获取我的积分
**GET** `/points/me`

```typescript
// 响应
{
  id: string;
  userId: string;
  totalPoints: number;    // 总积分
  level: number;          // 等级
  nextLevelPoints: number; // 下一级所需积分
  progress: number;       // 进度百分比
  createdAt: Date;
  updatedAt: Date;
}
```

### 获取积分历史
**GET** `/points/history?page=1&limit=20`

```typescript
// 响应
{
  data: [
    {
      id: string;
      action: string;     // POST_CREATED, RECEIVED_LIKE等
      points: number;     // 积分变化（正负）
      reason: string;     // 原因
      relatedId: string;  // 关联ID
      createdAt: Date;    // 时间
    }
  ],
  meta: { page, limit, total, totalPages }
}
```

### 获取积分排行榜
**GET** `/points/leaderboard?limit=50`

需要登录（用于在应用内展示积分排行榜）。

---

## 校园服务中心功能总览

前端“校园服务中心”中的每个卡片，都对应后端的一组 REST 接口：

| 功能卡片   | 路由前缀              | 主要能力（简要）                                      |
|------------|-----------------------|--------------------------------------------------------|
| 二手交易   | `/secondhand`         | 发布/编辑/删除二手商品，按分类和状态分页浏览、查看详情 |
| 学习资源   | `/study-resources`    | 上传/浏览/下载学习资源，按分类和类型筛选，统计浏览/下载 |
| 社团招新   | `/posts` + `tags`     | 通过带标签的帖子实现，使用 `tags: ["社团招新", "技术类"]` 等 |
| 失物招领   | `/posts` + `tags`     | 通过带标签的帖子实现，使用 `tags: ["失物招领", "寻物"]` 或 `tags: ["失物招领", "招领"]` |
| 拼车拼单   | `/posts` + `tags`     | 通过带标签的帖子实现，使用 `tags: ["拼车拼单", "拼车"]` 或 `tags: ["拼车拼单", "拼单"]` |
| 论坛广场   | `/posts`、`/comments` | 发帖、评论、点赞、收藏、关注、搜索、推荐等             |

**说明**：
- **社团招新、失物招领、拼车拼单** 已统一使用 `/posts` 接口实现，通过 `tags` 标签区分不同类型。
- 创建这些类型的内容时，只需在 `POST /posts` 请求中添加相应的标签即可。
- 查询时使用 `GET /posts?tag=社团招新` 等参数进行筛选。
- **二手交易、学习资源** 保留独立模块，因为它们有特殊的状态管理（上架/下架/已售等）。

下面的"市场模块"章节对二手交易和学习资源的接口做了详细说明。

## 服务中心专用接口 `/service-center`

> 如果希望直接使用专用路径（而不是自己拼 `tag`），可调用以下接口，它们底层会自动带上对应标签。

### 获取服务中心分类
**GET** `/service-center/categories`

返回所有分类及其标签/描述，数据来源于服务端常量：

```typescript
[
  { key: "CLUB_RECRUITMENT", label: "社团招新", tag: "社团招新", description: "校园社团招募新成员" },
  { key: "LOST_AND_FOUND",  label: "失物招领", tag: "失物招领", description: "失物寻找和拾物招领" },
  { key: "CARPOOL",         label: "拼车拼单", tag: "拼车拼单", description: "拼车出行和团购拼单" },
  { key: "SECONDHAND",      label: "二手交易", tag: "二手交易", description: "二手物品买卖交换" },
  { key: "STUDY_RESOURCE",  label: "学习资源", tag: "学习资源", description: "学习资料和资源分享" },
]
```

### 获取社团招新列表
**GET** `/service-center/club-recruitment?page=1&limit=20`

### 获取失物招领列表
**GET** `/service-center/lost-and-found?page=1&limit=20`

### 获取拼车拼单列表
**GET** `/service-center/carpool?page=1&limit=20`

### 获取二手交易列表（帖子形式）
**GET** `/service-center/secondhand?page=1&limit=20`

### 获取学习资源列表（帖子形式）
**GET** `/service-center/study-resource?page=1&limit=20`

> 返回结构与 `GET /posts` 相同。

## 市场模块

### 二手交易 `/secondhand`

#### 发布商品
**POST** `/secondhand`

```typescript
// 请求体
{
  title: string;          // 商品标题
  description: string;    // 描述
  price: number;          // 价格
  images: string[];       // 图片
  category: string;       // 分类
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR"; // 新旧程度
  location?: string;      // 位置
  contact: string;        // 联系方式
}

// 响应：商品对象
{
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD"; // 状态
  sellerId: string;
  viewCount: number;
  location: string;
  contact: string;
  createdAt: Date;
  seller: { id, username, nickname, avatar }
}
```

#### 获取商品列表
**GET** `/secondhand?page=1&limit=20&category=电子产品&status=AVAILABLE`

公开接口。

#### 获取商品详情
**GET** `/secondhand/:id`

公开接口。

#### 更新商品
**PATCH** `/secondhand/:id`

仅作者可操作；请求体同创建接口（字段可选）。
返回更新后的商品对象。

#### 删除商品
**DELETE** `/secondhand/:id`

仅作者可操作，删除后商品被标记下架/已售。

---

### 学习资源 `/study-resources`

#### 上传资源
**POST** `/study-resources`

```typescript
// 请求体
{
  title: string;          // 资源标题
  description: string;    // 描述
  category: string;       // 分类
  type: "DOCUMENT" | "VIDEO" | "LINK" | "CODE" | "OTHER"; // 类型
  fileUrl?: string;       // 文件URL
  link?: string;          // 链接
  tags?: string[];        // 标签
}

// 响应：资源对象
```

#### 获取资源列表
**GET** `/study-resources?page=1&limit=20&category=算法&type=DOCUMENT`

公开接口。

#### 下载资源（增加下载量）
**POST** `/study-resources/:id/download`

#### 更新资源
**PATCH** `/study-resources/:id`

仅作者可操作；请求体同创建接口（字段可选），返回更新后的资源。

#### 删除资源
**DELETE** `/study-resources/:id`

仅作者可操作，物理删除。

---

### 服务中心：社团招新、失物招领、拼车拼单

> **统一实现**：这些功能已统一使用 `/posts` 接口 + `tags` 标签实现。

#### 发布社团招新信息

**POST** `/posts`

```typescript
// 请求体示例
{
  title: "技术部招新 | 欢迎前后端小伙伴加入",
  content: "我们是XX社团技术部，正在招募新成员...\n\n要求：熟悉前端/后端开发\n联系方式：xxx@example.com",
  tags: ["社团招新", "技术类"],  // 必须包含"社团招新"标签
  images: ["logo.jpg", "poster.jpg"]
}
```

#### 发布失物招领信息

**POST** `/posts`

```typescript
// 寻物示例
{
  title: "【寻物】在图书馆丢失蓝色书包",
  content: "日期：2025-01-15\n地点：图书馆三楼\n描述：蓝色双肩包，内有身份证和学生卡\n联系方式：13800138000",
  tags: ["失物招领", "寻物"],     // 必须包含"失物招领"标签，第二个标签区分寻物/招领
  images: ["bag.jpg"]
}

// 招领示例
{
  title: "【招领】捡到一张校园卡",
  content: "日期：2025-01-15\n地点：食堂二楼\n描述：姓名王XX的校园卡\n联系方式：13900139000",
  tags: ["失物招领", "招领"],
  images: ["card.jpg"]
}
```

#### 发布拼车拼单信息

**POST** `/posts`

```typescript
// 拼车示例
{
  title: "周末拼车回市区，还差2人",
  content: "出发地：学校南门\n目的地：市中心XX广场\n出发时间：2025-01-20 14:00\n剩余座位：2个\n费用：每人30元\n联系方式：微信 xxx",
  tags: ["拼车拼单", "拼车"],     // 必须包含"拼车拼单"标签
}

// 拼单示例
{
  title: "拼单买水果，满100减20",
  content: "XX超市水果拼单，满100减20，现在已有60元，还差40元\n截止时间：今晚8点\n联系方式：微信 xxx",
  tags: ["拼车拼单", "拼单"],
}
```

#### 查询服务中心内容

使用 `GET /posts?tag=xxx` 进行筛选：

- **社团招新列表**：`GET /posts?tag=社团招新&page=1&limit=20`
- **失物招领列表**：`GET /posts?tag=失物招领&page=1&limit=20`
- **拼车拼单列表**：`GET /posts?tag=拼车拼单&page=1&limit=20`

可以组合多个标签进一步筛选，例如：
- **技术类社团**：`GET /posts?tag=社团招新&tag=技术类`
- **寻物信息**：`GET /posts?tag=失物招领&tag=寻物`
- **拼车信息**：`GET /posts?tag=拼车拼单&tag=拼车`

#### 更新和删除

- **更新**：`PATCH /posts/:id` （仅作者可操作）
- **删除**：`DELETE /posts/:id` （物理删除，仅作者可操作）

---

## 动态流 `/activities`

动态流用于聚合用户及其关注对象的最新活动（新帖、新评论、公告等）。

### 获取关注用户的动态流
**GET** `/activities/following?page=1&limit=20`

需要登录，基于当前用户关注的人聚合活动。

```typescript
// 响应
{
  data: [
    {
      type: "POST" | "COMMENT" | "ANNOUNCEMENT"; // 活动类型
      id: string;           // 目标ID（帖子/评论/公告）
      author?: {
        id: string;
        username: string;
        nickname: string;
        avatar: string;
      };                    // 触发该活动的用户（帖子作者/评论作者/公告作者）
      content: string;      // 简要内容（帖子标题、评论内容、公告标题）
      postTitle?: string;   // 针对评论活动，附带所属帖子的标题
      createdAt: Date;      // 活动时间
      data: any;            // 原始对象（Post / Comment / Announcement）
    }
  ];
  meta: {
    page: number;
    limit: number;
    total: number;          // 实际返回条数
  };
}
```

### 获取我的动态
**GET** `/activities/my?page=1&limit=20`

基于当前用户自己发布的帖子和评论生成时间线，常用于“我的动态”页。

```typescript
// 响应结构类似，但只有 POST / COMMENT 两种类型
{
  data: [
    {
      type: "POST" | "COMMENT";
      id: string;
      content: string;      // 帖子标题或评论内容
      postTitle?: string;   // 针对评论活动
      createdAt: Date;
      data: any;            // 原始 Post / Comment 对象
    }
  ];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
```

---

## 私信会话 `/conversations`

用于实现用户之间的一对一私信聊天。

### 创建或获取会话
**POST** `/conversations`

```typescript
// 请求体
{
  participantId: string;    // 想要聊天的对方用户ID
}

// 响应（会话对象）
{
  id: string;               // 会话ID
  type: "DIRECT";
  otherUser: {              // 对方用户信息
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;                 // 最近一条消息
  lastReadAt?: Date | null; // 当前用户在该会话的最后已读时间
  createdAt: Date;
}
```

> 接口具有幂等性：如果已存在与该用户的会话，会直接返回已有会话，而不是重复创建。

### 获取会话列表
**GET** `/conversations?page=1&limit=20`

```typescript
// 响应
{
  data: Conversation[];     // 会话列表，结构同上
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### 获取未读私信数量
**GET** `/conversations/unread-count`

```typescript
// 响应
{
  count: number;            // 所有会话中未读消息总数
}
```

### 获取会话详情
**GET** `/conversations/:id`

返回单个会话的基础信息（不含完整消息列表），结构同创建/获取会话接口。

### 获取会话消息列表
**GET** `/conversations/:id/messages?page=1&limit=50`

```typescript
// 响应
{
  data: [
    {
      id: string;
      conversationId: string;
      senderId: string;
      content: string;
      isRead: boolean;
      readAt?: Date | null;
      createdAt: Date;
      sender: {
        id: string;
        username: string;
        nickname: string;
        avatar: string;
      };
    }
  ];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
```

> 注意：接口返回的消息列表会自动将“对方发给我且未读”的消息标记为已读，并更新会话的 `lastReadAt`。

### 发送消息
**POST** `/conversations/:id/messages`

```typescript
// 请求体
{
  content: string;          // 消息内容
}

// 响应：刚发送的消息对象（结构同上）
```

发送成功后，会：

- 更新会话的 `updatedAt`，用于会话列表排序；
- 通过通知系统给对方发送一条系统通知（type = SYSTEM）。

### 删除消息
**DELETE** `/conversations/messages/:messageId`

只能删除自己发送的消息，且为**软删除**（数据库中保留记录，仅前端不再展示）。

---

## 公告 `/announcements`

### 获取公告列表
**GET** `/announcements?page=1&limit=20`

- 公开接口。
- 登录用户会根据自己的角色，额外看到只对某角色可见的公告。

```typescript
// 响应（data 内每条记录）
{
  id: string;
  title: string;      // 标题
  content: string;    // 内容
  type: "INFO" | "WARNING" | "URGENT"; // 类型
  targetRole: "USER" | "ADMIN" | null; // 目标角色，null 表示所有人
  isPinned: boolean;  // 是否置顶
  createdAt: Date;
  author: { id, username, nickname, avatar }
}
```

### 获取公告详情
**GET** `/announcements/:id`

公开接口。

---

## 通知 `/notifications`

### 获取我的通知
**GET** `/notifications?page=1&limit=20&type=COMMENT&isRead=false`

- 支持 `type` 和 `isRead` 过滤。

```typescript
// type: COMMENT | REPLY | LIKE | SYSTEM | NEW_POST | NEW_FOLLOWER
// isRead: 可选，true/false 用于筛选已读/未读

// 响应
{
  data: [
    {
      id: string;
      type: string;       // 通知类型
      senderId: string;   // 发送者ID
      content: string;    // 内容
      relatedId: string;  // 关联ID
      isRead: boolean;    // 是否已读
      createdAt: Date;
      sender: { id, username, nickname, avatar }
    }
  ],
  meta: { page, limit, total }
}
```

### 获取未读数量
**GET** `/notifications/unread/count`

```typescript
// 响应
{
  count: number;          // 未读数量
}
```

### 标记为已读
**PATCH** `/notifications/:id/read`

### 全部标记已读
**POST** `/notifications/read-all`

### 删除通知
**DELETE** `/notifications/:id`

---

## 系统监控 `/health`

用于负载均衡健康检查和监控系统状态。

### 健康检查
**GET** `/health`

公开接口。

```typescript
// 响应（正常情况）
{
  status: "ok";
  timestamp: string;      // ISO 时间字符串
  services: {
    database: "healthy";              // 数据库连接状态
    redis: "healthy" | "unhealthy";  // Redis 连接状态
  };
}

// 发生错误时
{
  status: "error";
  timestamp: string;
  error: string;          // 错误信息
}
```

---

## WebSocket 实时通知

WebSocket 网关用于推送通知、新帖子等实时事件。

- 连接地址（开发环境示例）：`ws://localhost:3000`（Socket.IO 默认路径）
- 连接时需要通过 `auth.token` 传递 JWT：

  ```typescript
  import { io } from 'socket.io-client';

  const socket = io('http://localhost:3000', {
    auth: {
      token: accessToken, // 即 /auth/login 返回的 accessToken
    },
  });
  ```

### 监听事件

```typescript
// 新通知
socket.on('notification:new', (data) => {
  // data: 通知对象
});

// 未读数查询结果
socket.on('notification:unread_count', (data) => {
  // data: { unreadCount: number }
});

// 未读数变更广播
socket.on('notification:unread_count_updated', (data) => {
  // data: { unreadCount: number }
});

// 单条通知标记已读成功
socket.on('notification:read_success', (data) => {
  // data: { notificationId: string; isRead: boolean }
});

// 全部标记已读成功
socket.on('notification:all_read_success', (data) => {
  // data: { message: string; count: number }
});

// 在线人数统计
socket.on('system:online_count', (data) => {
  // data: { onlineUsers: number, timestamp: string }
});
```

### 发送心跳

```typescript
// 定期发送 ping，服务端会回复 'pong'
socket.emit('ping');

socket.on('pong', (data) => {
  // data: { timestamp: number }
});
```

### 常用发送事件

```typescript
// 查询未读数
socket.emit('notification:unread_count');

// 标记单条通知为已读
socket.emit('notification:mark_read', { notificationId });

// 标记全部通知为已读
socket.emit('notification:mark_all_read');

// 心跳
socket.emit('ping');
```
