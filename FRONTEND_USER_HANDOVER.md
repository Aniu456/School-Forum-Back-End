# 🎨 校园论坛用户端前端工程师交接文档

> **文档版本**: v1.0.0  
> **最后更新**: 2025-11-15  
> **目标受众**: 负责开发校园论坛用户端（学生/教师使用）的前端工程师  
> **后端版本**: v0.4.0  

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 快速开始](#2-快速开始)
- [3. 认证与授权](#3-认证与授权)
- [4. 核心功能模块](#4-核心功能模块)
- [5. WebSocket 实时通知](#5-websocket-实时通知)
- [6. 错误处理](#6-错误处理)
- [7. 最佳实践](#7-最佳实践)
- [8. 常见问题](#8-常见问题)

---

## 1. 项目概述

### 1.1 用户端功能范围

校园论坛用户端是面向**学生**和**教师**的 Web 应用，提供以下功能：

#### 核心功能
- ✅ 用户注册与登录
- ✅ 浏览帖子（首页、热门、趋势、关注动态）
- ✅ 发布帖子（支持图片上传、草稿保存）
- ✅ 评论与回复
- ✅ 点赞（帖子、评论）
- ✅ 搜索帖子
- ✅ 收藏帖子（支持多个收藏夹）

#### 社交功能
- ✅ 关注用户
- ✅ 查看个人主页
- ✅ 查看关注列表/粉丝列表
- ✅ 关注动态 Feed

#### 通知与推荐
- ✅ 实时通知（评论、点赞、系统通知）
- ✅ 个性化推荐
- ✅ 话题浏览

#### 个人中心
- ✅ 个人资料管理
- ✅ 我的帖子
- ✅ 我的收藏
- ✅ 草稿箱
- ✅ 消息中心

### 1.2 技术栈建议

```json
{
  "框架": "React 18+ / Vue 3+ / Next.js 14+",
  "状态管理": "Redux Toolkit / Zustand / Pinia",
  "路由": "React Router / Vue Router / Next.js App Router",
  "UI组件库": "Ant Design / Material-UI / Element Plus",
  "HTTP客户端": "Axios",
  "WebSocket": "socket.io-client",
  "富文本编辑": "react-markdown / TipTap",
  "图片上传": "react-dropzone / vue-dropzone",
  "表单验证": "React Hook Form / VeeValidate"
}
```

### 1.3 后端 API 基础信息

| 项目 | 开发环境 | 生产环境 |
|------|---------|---------|
| **Base URL** | `http://localhost:3000/api/v1` | `https://api.yourdomain.com/api/v1` |
| **WebSocket URL** | `ws://localhost:3000` | `wss://api.yourdomain.com` |
| **数据格式** | JSON | JSON |
| **认证方式** | JWT Bearer Token | JWT Bearer Token |
| **CORS** | 已配置，支持凭证 | 已配置，支持凭证 |

---

## 2. 快速开始

### 2.1 后端服务启动（开发环境）

```bash
# 克隆后端仓库
git clone <backend-repo-url>
cd school-forum-back-end

# 安装依赖
pnpm install

# 配置环境变量（复制并修改）
cp .env.example .env

# 数据库迁移
pnpm prisma migrate dev

# 启动开发服务器
pnpm run start:dev
```

### 2.2 前端项目快速集成

#### Step 1: 安装依赖

```bash
# Axios
npm install axios

# Socket.IO Client（用于实时通知）
npm install socket.io-client

# 可选：React Markdown（如果需要 Markdown 编辑）
npm install react-markdown remark-gfm
```

#### Step 2: 配置 API 客户端

创建 `src/api/client.ts`：

```typescript
import axios from 'axios';

// API 客户端配置
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  withCredentials: true, // 支持跨域凭证
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理 Token 过期
apiClient.interceptors.response.use(
  (response) => response.data, // 直接返回 data
  async (error) => {
    const originalRequest = error.config;

    // Token 过期，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 重试原请求
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Step 3: 环境变量配置

创建 `.env` 文件：

```env
# 开发环境
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000

# 生产环境
# VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
# VITE_WS_URL=wss://api.yourdomain.com
```

---

## 3. 认证与授权

### 3.1 用户注册

**端点**: `POST /auth/register`

#### 请求示例

```typescript
// src/api/auth.ts
import apiClient from './client';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  studentId?: string;
  nickname?: string;
  role?: 'STUDENT' | 'TEACHER';
}

export const registerUser = async (data: RegisterData) => {
  const response = await apiClient.post('/auth/register', data);
  
  // 保存 Token
  const { accessToken, refreshToken } = response.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  return response;
};
```

#### React 组件示例

```tsx
// src/pages/Register.tsx
import { useState } from 'react';
import { registerUser } from '../api/auth';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nickname: '',
    studentId: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(formData);
      window.location.href = '/'; // 跳转到首页
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="用户名 (3-20字符)"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="邮箱"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="密码 (6-50字符)"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />
      <input
        placeholder="昵称"
        value={formData.nickname}
        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
      />
      <input
        placeholder="学号/工号"
        value={formData.studentId}
        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">注册</button>
    </form>
  );
};

export default Register;
```

### 3.2 用户登录

**端点**: `POST /auth/login`

#### 请求示例

```typescript
// src/api/auth.ts
interface LoginData {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginData) => {
  const response = await apiClient.post('/auth/login', data);
  
  // 保存 Token 和用户信息
  const { accessToken, refreshToken, user } = response.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  
  return response;
};
```

### 3.3 获取当前用户信息

**端点**: `GET /users/me` 🔒 需要认证

```typescript
// src/api/user.ts
export const getCurrentUser = async () => {
  return await apiClient.get('/users/me');
};
```

### 3.4 登出

```typescript
// src/api/auth.ts
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    // 清除本地存储
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

---

## 4. 核心功能模块

### 4.1 帖子管理

#### 4.1.1 获取帖子列表

**端点**: `GET /posts`

```typescript
// src/api/posts.ts
interface PostsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'viewCount' | 'likeCount';
  order?: 'asc' | 'desc';
  tag?: string;
  authorId?: string;
}

export const getPosts = async (query: PostsQuery = {}) => {
  return await apiClient.get('/posts', { params: query });
};
```

#### React 组件示例

```tsx
// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { getPosts } from '../api/posts';

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  };
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getPosts({ page, limit: 20 });
        setPosts(response.data);
      } catch (error) {
        console.error('获取帖子失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="post-list">
      {posts.map((post) => (
        <div key={post.id} className="post-card">
          <h2>{post.title}</h2>
          <p>{post.content.substring(0, 200)}...</p>
          <div className="post-meta">
            <span>👁️ {post.viewCount}</span>
            <span>👍 {post.likeCount}</span>
            <span>💬 {post.commentCount}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;
```

#### 4.1.2 获取帖子详情

**端点**: `GET /posts/:id`

```typescript
// src/api/posts.ts
export const getPostDetail = async (postId: string) => {
  return await apiClient.get(`/posts/${postId}`);
};
```

#### 4.1.3 创建帖子

**端点**: `POST /posts` 🔒 需要认证

```typescript
// src/api/posts.ts
interface CreatePostData {
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
}

export const createPost = async (data: CreatePostData) => {
  return await apiClient.post('/posts', data);
};
```

#### React 组件示例

```tsx
// src/pages/CreatePost.tsx
import { useState } from 'react';
import { createPost } from '../api/posts';
import { uploadImages } from '../api/upload';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await uploadImages(formData);
      const imageUrls = response.data.map((img: any) => img.medium);
      setImages([...images, ...imageUrls]);
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPost({ title, content, images });
      window.location.href = '/'; // 跳转到首页
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="标题 (5-200字符)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="内容 (10-50000字符)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        required
      />
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
      />
      {uploading && <p>上传中...</p>}
      <div className="image-preview">
        {images.map((url, index) => (
          <img key={index} src={url} alt={`预览${index}`} width={100} />
        ))}
      </div>
      <button type="submit">发布</button>
    </form>
  );
};

export default CreatePost;
```

#### 4.1.4 更新帖子

**端点**: `PATCH /posts/:id` 🔒 需要认证 + 作者权限

```typescript
// src/api/posts.ts
export const updatePost = async (postId: string, data: Partial<CreatePostData>) => {
  return await apiClient.patch(`/posts/${postId}`, data);
};
```

#### 4.1.5 删除帖子

**端点**: `DELETE /posts/:id` 🔒 需要认证 + 作者权限

```typescript
// src/api/posts.ts
export const deletePost = async (postId: string) => {
  return await apiClient.delete(`/posts/${postId}`);
};
```

### 4.2 评论功能

#### 4.2.1 创建评论

**端点**: `POST /comments` 🔒 需要认证

```typescript
// src/api/comments.ts
interface CreateCommentData {
  postId: string;
  content: string;
  parentId?: string; // 回复评论时提供
}

export const createComment = async (data: CreateCommentData) => {
  return await apiClient.post('/comments', data);
};
```

#### 4.2.2 获取帖子评论列表

**端点**: `GET /posts/:postId/comments`

```typescript
// src/api/comments.ts
export const getPostComments = async (postId: string, page = 1, limit = 20) => {
  return await apiClient.get(`/posts/${postId}/comments`, {
    params: { page, limit },
  });
};
```

#### React 组件示例

```tsx
// src/components/CommentSection.tsx
import { useState, useEffect } from 'react';
import { getPostComments, createComment } from '../api/comments';

interface Comment {
  id: string;
  content: string;
  author: {
    username: string;
    nickname: string;
    avatar: string;
  };
  likeCount: number;
  replyCount: number;
  createdAt: string;
  replies?: Comment[];
}

const CommentSection = ({ postId }: { postId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      const response = await getPostComments(postId);
      setComments(response.data);
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createComment({
        postId,
        content: newComment,
        parentId: replyTo || undefined,
      });
      // 重新获取评论列表
      const response = await getPostComments(postId);
      setComments(response.data);
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('评论失败:', error);
    }
  };

  return (
    <div className="comment-section">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder={replyTo ? '回复评论...' : '发表评论...'}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        {replyTo && (
          <button type="button" onClick={() => setReplyTo(null)}>
            取消回复
          </button>
        )}
        <button type="submit">发表</button>
      </form>

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment">
            <p>{comment.content}</p>
            <div className="comment-meta">
              <span>{comment.author.nickname}</span>
              <span>👍 {comment.likeCount}</span>
              <button onClick={() => setReplyTo(comment.id)}>回复</button>
            </div>
            {comment.replies && comment.replies.length > 0 && (
              <div className="replies">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="reply">
                    <p>{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
```

### 4.3 点赞功能

#### 4.3.1 点赞/取消点赞

**端点**: `POST /likes/toggle` 🔒 需要认证

```typescript
// src/api/likes.ts
interface ToggleLikeData {
  targetId: string;
  targetType: 'POST' | 'COMMENT';
}

export const toggleLike = async (data: ToggleLikeData) => {
  return await apiClient.post('/likes/toggle', data);
};
```

#### React Hook 示例

```tsx
// src/hooks/useLike.ts
import { useState } from 'react';
import { toggleLike } from '../api/likes';

export const useLike = (initialLiked: boolean, initialCount: number) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (targetId: string, targetType: 'POST' | 'COMMENT') => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await toggleLike({ targetId, targetType });
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, handleToggle, loading };
};
```

### 4.4 搜索功能

**端点**: `GET /search/posts`

```typescript
// src/api/search.ts
interface SearchQuery {
  q: string; // 搜索关键词
  tag?: string;
  sortBy?: 'relevance' | 'createdAt' | 'viewCount';
  page?: number;
  limit?: number;
}

export const searchPosts = async (query: SearchQuery) => {
  return await apiClient.get('/search/posts', { params: query });
};
```

### 4.5 收藏功能

#### 4.5.1 创建收藏夹

**端点**: `POST /folders` 🔒 需要认证

```typescript
// src/api/favorites.ts
export const createFolder = async (name: string, description?: string) => {
  return await apiClient.post('/folders', { name, description });
};
```

#### 4.5.2 收藏帖子

**端点**: `POST /favorites` 🔒 需要认证

```typescript
// src/api/favorites.ts
export const addToFavorites = async (postId: string, folderId: string, note?: string) => {
  return await apiClient.post('/favorites', { postId, folderId, note });
};
```

#### 4.5.3 获取收藏列表

**端点**: `GET /favorites` 🔒 需要认证

```typescript
// src/api/favorites.ts
export const getFavorites = async (folderId?: string, page = 1) => {
  return await apiClient.get('/favorites', {
    params: { folderId, page, limit: 20 },
  });
};
```

### 4.6 关注功能

#### 4.6.1 关注用户

**端点**: `POST /users/:id/follow` 🔒 需要认证

```typescript
// src/api/follows.ts
export const followUser = async (userId: string) => {
  return await apiClient.post(`/users/${userId}/follow`);
};
```

#### 4.6.2 取消关注

**端点**: `DELETE /users/:id/follow` 🔒 需要认证

```typescript
// src/api/follows.ts
export const unfollowUser = async (userId: string) => {
  return await apiClient.delete(`/users/${userId}/follow`);
};
```

#### 4.6.3 获取关注动态

**端点**: `GET /feed` 🔒 需要认证

```typescript
// src/api/follows.ts
export const getFeed = async (page = 1) => {
  return await apiClient.get('/feed', { params: { page, limit: 20 } });
};
```

### 4.7 草稿功能

#### 4.7.1 保存草稿

**端点**: `POST /posts/drafts` 🔒 需要认证

```typescript
// src/api/drafts.ts
interface DraftData {
  title?: string;
  content?: string;
  images?: string[];
  tags?: string[];
}

export const saveDraft = async (data: DraftData) => {
  return await apiClient.post('/posts/drafts', data);
};
```

#### 4.7.2 获取草稿列表

**端点**: `GET /posts/drafts` 🔒 需要认证

```typescript
// src/api/drafts.ts
export const getDrafts = async () => {
  return await apiClient.get('/posts/drafts');
};
```

#### 4.7.3 发布草稿

**端点**: `POST /posts/drafts/:id/publish` 🔒 需要认证

```typescript
// src/api/drafts.ts
export const publishDraft = async (draftId: string) => {
  return await apiClient.post(`/posts/drafts/${draftId}/publish`);
};
```

### 4.8 推荐功能

#### 4.8.1 获取热门帖子

**端点**: `GET /posts/hot`

```typescript
// src/api/recommendations.ts
export const getHotPosts = async (timeRange: 'day' | 'week' | 'month' = 'week') => {
  return await apiClient.get('/posts/hot', { params: { timeRange } });
};
```

#### 4.8.2 获取个性化推荐

**端点**: `GET /recommendations` 🔒 需要认证

```typescript
// src/api/recommendations.ts
export const getRecommendations = async (page = 1) => {
  return await apiClient.get('/recommendations', { params: { page } });
};
```

### 4.9 图片上传

**端点**: `POST /upload/images` 🔒 需要认证

```typescript
// src/api/upload.ts
export const uploadImages = async (formData: FormData) => {
  return await apiClient.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
```

---

## 5. WebSocket 实时通知

### 5.1 连接设置

```typescript
// src/services/websocket.ts
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket 连接成功');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket 断开连接');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 连接错误:', error);
    });

    // 心跳机制
    this.startHeartbeat();
  }

  private startHeartbeat() {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 25000); // 每 25 秒发送一次心跳
  }

  // 监听新通知
  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification:new', callback);
  }

  // 监听新点赞
  onLike(callback: (data: any) => void) {
    this.socket?.on('like', callback);
  }

  // 监听新评论
  onComment(callback: (data: any) => void) {
    this.socket?.on('comment', callback);
  }

  // 标记通知已读
  markNotificationRead(notificationId: string) {
    this.socket?.emit('notification:mark_read', { notificationId });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new WebSocketService();
```

### 5.2 React 中使用

```tsx
// src/App.tsx
import { useEffect } from 'react';
import websocketService from './services/websocket';

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      websocketService.connect(token);

      // 监听新通知
      websocketService.onNotification((notification) => {
        console.log('收到新通知:', notification);
        // 显示通知提示
        showNotificationToast(notification.title, notification.content);
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, []);

  return <div>{/* 你的应用 */}</div>;
};
```

### 5.3 通知组件示例

```tsx
// src/components/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { getNotifications } from '../api/notifications';
import websocketService from '../services/websocket';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // 获取初始通知
    const fetchNotifications = async () => {
      const response = await getNotifications({ isRead: false });
      setUnreadCount(response.meta.unreadCount);
    };
    fetchNotifications();

    // 监听新通知
    websocketService.onNotification((notification) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [notification, ...prev]);
    });
  }, []);

  return (
    <div className="notification-bell">
      <button>
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
    </div>
  );
};

export default NotificationBell;
```

---

## 6. 错误处理

### 6.1 错误响应格式

```json
{
  "statusCode": 400,
  "message": "错误信息描述",
  "error": "Bad Request",
  "timestamp": "2025-11-15T12:00:00.000Z",
  "path": "/api/v1/posts"
}
```

### 6.2 常见错误码

| 状态码 | 说明 | 处理方式 |
|-------|------|---------|
| 400 | 请求参数错误 | 显示错误消息，提示用户修正 |
| 401 | 未授权（未登录或 Token 失效） | 跳转到登录页 |
| 403 | 禁止访问（权限不足） | 显示"无权限"提示 |
| 404 | 资源不存在 | 显示"内容不存在"页面 |
| 409 | 资源冲突（如重复注册） | 显示具体冲突原因 |
| 429 | 请求过于频繁 | 显示"请稍后再试" |
| 500 | 服务器内部错误 | 显示"服务器错误，请稍后再试" |

### 6.3 全局错误处理

```typescript
// src/utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return `请求错误: ${data.message}`;
      case 401:
        localStorage.clear();
        window.location.href = '/login';
        return '请先登录';
      case 403:
        return '无权限访问';
      case 404:
        return '内容不存在';
      case 429:
        return '请求过于频繁，请稍后再试';
      case 500:
        return '服务器错误，请稍后再试';
      default:
        return data.message || '未知错误';
    }
  }

  if (error.request) {
    return '网络错误，请检查连接';
  }

  return error.message || '未知错误';
};
```

---

## 7. 最佳实践

### 7.1 认证流程

1. **登录后保存 Token**
   ```typescript
   localStorage.setItem('accessToken', accessToken);
   localStorage.setItem('refreshToken', refreshToken);
   ```

2. **每个请求自动携带 Token**（通过 Axios 拦截器）

3. **Token 过期自动刷新**（通过响应拦截器）

4. **刷新失败跳转登录**

### 7.2 性能优化

1. **图片懒加载**
   ```tsx
   <img src={post.images[0]} loading="lazy" alt="帖子图片" />
   ```

2. **分页加载**（使用虚拟滚动或无限滚动）

3. **缓存常用数据**（使用 React Query 或 SWR）

4. **防抖与节流**
   ```typescript
   import { debounce } from 'lodash';

   const handleSearch = debounce((query: string) => {
     searchPosts({ q: query });
   }, 500);
   ```

### 7.3 用户体验

1. **加载状态**：显示 Loading 动画
2. **错误提示**：友好的错误消息
3. **成功反馈**：操作成功后显示 Toast
4. **乐观更新**：先更新 UI，失败后回滚

### 7.4 安全建议

1. **永远不要在客户端存储敏感信息**
2. **使用 HTTPS**（生产环境）
3. **XSS 防护**：对用户输入进行转义
4. **CSRF 防护**：后端已配置 CORS

---

## 8. 常见问题

### Q1: Token 过期怎么办？

**A**: 已在 Axios 响应拦截器中自动处理。如果刷新 Token 失败，会自动跳转到登录页。

### Q2: 如何处理图片上传？

**A**: 使用 `POST /upload/images` 端点，前端使用 FormData 上传。

```typescript
const formData = new FormData();
formData.append('files', file);
const response = await uploadImages(formData);
```

### Q3: WebSocket 断线怎么办？

**A**: Socket.IO 会自动重连。可以监听 `disconnect` 和 `connect` 事件。

### Q4: 如何实现自动保存草稿？

**A**: 使用 `useEffect` + `debounce`：

```typescript
useEffect(() => {
  const saveDraftDebounced = debounce(() => {
    saveDraft({ title, content });
  }, 3000);

  saveDraftDebounced();
}, [title, content]);
```

### Q5: 如何处理 CORS 错误？

**A**: 后端已配置 CORS。确保：
- 使用 `withCredentials: true`
- Base URL 正确
- 后端 `.env` 中 `CORS_ORIGIN` 包含你的前端地址

---

## 📚 相关文档

- [完整 API 文档](./02-implementation/api-documentation.md)
- [WebSocket 事件文档](../src/notifications/websocket-events.ts)
- [后端架构设计](./01-design/architecture-design.md)
- [故障排查指南](./TROUBLESHOOTING.md)

---

## 🎯 总结

本文档涵盖了校园论坛用户端前端开发的所有核心功能：

✅ 用户认证（注册、登录、Token 刷新）  
✅ 帖子管理（浏览、创建、编辑、删除）  
✅ 评论与回复  
✅ 点赞功能  
✅ 搜索与推荐  
✅ 收藏与关注  
✅ 草稿保存  
✅ 实时通知（WebSocket）  
✅ 图片上传  
✅ 错误处理  

**下一步**：参考本文档快速搭建前端应用，遇到问题查看[故障排查指南](./TROUBLESHOOTING.md)或联系后端团队。

---

**文档维护者**: 后端开发团队  
**联系方式**: support@example.com  
**最后更新**: 2025-11-15
