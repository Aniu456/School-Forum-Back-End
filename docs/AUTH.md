# 认证指南

> **版本**: v2.1
> **更新时间**: 2026-01-09

---

## 📋 目录

1. [认证流程](#认证流程)
2. [Token 说明](#token-说明)
3. [请求头设置](#请求头设置)
4. [Token 刷新](#token-刷新)
5. [完整示例](#完整示例)

---

## 认证流程

```
┌─────────┐      ┌─────────┐      ┌──────────┐
│  注册/  │ ───▶ │  获取   │ ───▶ │ 携Token  │
│  登录   │      │  Token  │      │ 发请求    │
└─────────┘      └─────────┘      └──────────┘
                     │
                     ▼
              ┌──────────┐
              │Token过期 │
              └──────────┘
                     │
                     ▼
              ┌──────────┐
              │ 刷新Token │
              └──────────┘
```

### 1. 注册/登录获取 Token

```typescript
// POST /auth/login
const response = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// 响应
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "role": "USER"
  }
}

// 保存 Token
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

### 2. 携带 Token 发送请求

```typescript
// 所有需要认证的请求都要在 Header 中携带 Token
const response = await api.get('/users/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### 3. Token 过期时刷新

```typescript
// 当收到 401 响应时
if (error.response?.status === 401) {
  const response = await api.post('/auth/refresh', {
    refreshToken: localStorage.getItem('refreshToken')
  });

  // 更新 Token
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);

  // 重试原请求
  return api.request(originalRequest);
}
```

---

## Token 说明

### Access Token

- **用途**: 访问需要认证的 API
- **有效期**: 15 分钟 (可在环境变量中配置)
- **存储位置**: localStorage / sessionStorage
- **格式**: JWT Bearer Token

### Refresh Token

- **用途**: 获取新的 Access Token
- **有效期**: 7 天 (可在环境变量中配置)
- **存储位置**: localStorage / httpOnly Cookie
- **格式**: JWT Bearer Token

---

## 请求头设置

### 标准 API 请求

```http
GET /users/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

### Axios 拦截器自动添加

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Fetch API

```typescript
fetch('http://localhost:3000/users/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Token 刷新

### 刷新接口

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 响应

```json
{
  "accessToken": "新的accessToken",
  "refreshToken": "新的refreshToken"
}
```

### 自动刷新实现

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Token 过期，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('http://localhost:3000/auth/refresh', {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // 保存新 Token
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 处理队列中的请求
        failedQueue.forEach(({ resolve }) => resolve(api(originalRequest)));
        failedQueue = [];

        // 重试原请求
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除 Token 并跳转登录
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 完整示例

### React Hook 实现

```typescript
import { useState, useCallback } from 'react';
import api from './api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => ({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: !!localStorage.getItem('accessToken'),
  }));

  // 登录
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });

    const { accessToken, refreshToken, user } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    setAuthState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });

    return user;
  }, []);

  // 注册
  const register = useCallback(async (data: RegisterDto) => {
    const response = await api.post('/auth/register', data);

    const { accessToken, refreshToken, user } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    setAuthState({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });

    return user;
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
  };
}
```

### Vue 3 实现

```typescript
import { ref, computed } from 'vue';
import api from './api';

const user = ref<User | null>(null);
const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));

export function useAuth() {
  const isAuthenticated = computed(() => !!accessToken.value);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });

    accessToken.value = response.data.accessToken;
    refreshToken.value = response.data.refreshToken;
    user.value = response.data.user;

    localStorage.setItem('accessToken', accessToken.value);
    localStorage.setItem('refreshToken', refreshToken.value);

    return response.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      accessToken.value = null;
      refreshToken.value = null;
      user.value = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}
```

---

## 常见问题

### Q: Token 存在哪里？

A: 推荐存储在 `localStorage` 中，便于管理。如需更高安全性，可使用 `httpOnly Cookie`。

### Q: 如何判断 Token 是否过期？

A: 不需要手动判断，当 API 返回 401 时自动刷新 Token 即可。

### Q: 刷新 Token 失败怎么办？

A: 清除本地存储的 Token，跳转到登录页。

### Q: 需要每次请求都刷新 Token 吗？

A: 不需要，只有在收到 401 响应时才刷新。

---

## 安全建议

1. **不要在 URL 中传递 Token**
2. **使用 HTTPS 传输**
3. **设置合理的 Token 有效期**
4. **登出时清除本地 Token**
5. **避免 XSS 攻击获取 Token**

---

**文档版本**: v2.1
**最后更新**: 2026-01-09
