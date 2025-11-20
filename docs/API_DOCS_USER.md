# 普通用户端 API 文档

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
  }
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
  access_token: string;   // JWT令牌
  user: {
    id: string;
    username: string;
    email: string;
    nickname: string;
    avatar: string;
    role: string;
  }
}
```

### 登出
**POST** `/auth/logout`

需要认证。

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
**GET** `/posts?page=1&limit=20&sort=latest&tag=前端`

```typescript
// sort: latest | hot | trending
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
**GET** `/comments/post/:postId?page=1&limit=20`

公开接口。

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
  message: string;        // "点赞成功" 或 "取消点赞"
  isLiked: boolean;       // 当前点赞状态
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
  folderId?: string;      // 收藏夹ID（可选，默认收藏夹）
}
```

### 获取我的收藏夹
**GET** `/favorites/folders`

### 获取收藏夹内容
**GET** `/favorites/folders/:id?page=1&limit=20`

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
**POST** `/users/:id/unfollow`

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
**GET** `/search?q=关键词&page=1&limit=20`

公开接口。

### 搜索用户
**GET** `/search/users?q=用户名&page=1&limit=20`

公开接口。

---

## 推荐相关 `/recommendations`

### 获取推荐帖子
**GET** `/recommendations/posts?limit=20`

公开接口。基于用户兴趣的个性化推荐。

### 获取热门帖子
**GET** `/recommendations/hot?limit=20`

公开接口。

### 获取趋势帖子
**GET** `/recommendations/trending?limit=20`

公开接口。

### 获取最新帖子
**GET** `/recommendations/latest?limit=20`

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

公开接口。

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

只能更新自己的商品。

#### 删除商品
**DELETE** `/secondhand/:id`

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

## 公告 `/announcements`

### 获取公告列表
**GET** `/announcements?page=1&limit=20&type=INFO`

公开接口。

```typescript
// type: INFO | WARNING | URGENT

// 响应
{
  data: [
    {
      id: string;
      title: string;      // 标题
      content: string;    // 内容
      type: "INFO" | "WARNING" | "URGENT"; // 类型
      targetRole: "ALL" | "USER" | "ADMIN"; // 目标角色
      publisherId: string;
      isPinned: boolean;  // 是否置顶
      createdAt: Date;
      publisher: { id, username, nickname, avatar }
    }
  ],
  meta: { page, limit, total }
}
```

### 获取公告详情
**GET** `/announcements/:id`

公开接口。

---

## 通知 `/notifications`

### 获取我的通知
**GET** `/notifications?page=1&limit=20&type=COMMENT`

```typescript
// type: COMMENT | REPLY | LIKE | SYSTEM | NEW_POST | NEW_FOLLOWER

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
**GET** `/notifications/unread-count`

```typescript
// 响应
{
  count: number;          // 未读数量
}
```

### 标记为已读
**PATCH** `/notifications/:id/read`

### 全部标记已读
**PATCH** `/notifications/mark-all-read`

### 删除通知
**DELETE** `/notifications/:id`

---

## WebSocket 实时通知

连接地址：`ws://localhost:3000`

需要在连接时传递JWT token。

### 监听事件

```typescript
// 新通知
socket.on('notification:new', (data) => {
  // data: 通知对象
});

// 新帖子（关注的人发帖）
socket.on('post:new', (data) => {
  // data: 帖子对象
});

// 新粉丝
socket.on('follower:new', (data) => {
  // data: 用户对象
});

// 未读数更新
socket.on('notification:unread-count', (data) => {
  // data: { count: number }
});
```

### 发送心跳
```typescript
socket.emit('heartbeat');
```
