# 错误代码参考

> **版本**: v2.1
> **更新时间**: 2026-01-09

---

## 📋 目录

1. [HTTP 状态码](#http-状态码)
2. [业务错误码](#业务错误码)
3. [错误处理建议](#错误处理建议)

---

## HTTP 状态码

### 成功响应

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |

### 客户端错误

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或 Token 过期 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |

### 服务器错误

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 500 | Internal Server Error | 服务器内部错误 |
| 503 | Service Unavailable | 服务暂时不可用 |

---

## 业务错误码

### 认证相关

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| `Invalid credentials` | 邮箱或密码错误 | 检查登录信息 |
| `User already exists` | 用户已存在 | 使用其他邮箱注册 |
| `User not found` | 用户不存在 | 检查用户ID或邮箱 |
| `Invalid token` | Token 无效 | 重新登录 |
| `Token expired` | Token 已过期 | 刷新 Token |
| `Invalid admin secret` | 管理员密钥错误 | 检查 ADMIN_SECRET |
| `Email already verified` | 邮箱已验证 | 无需重复验证 |
| `Invalid or expired verification code` | 验证码无效或过期 | 重新获取验证码 |

### 用户相关

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| `User not found` | 用户不存在 | 检查用户ID |
| `User is banned` | 用户已被封禁 | 联系管理员 |
| `Cannot modify yourself` | 不能修改自己 | 使用其他账号操作 |
| `Cannot delete yourself` | 不能删除自己 | 使用其他账号操作 |
| `User cannot post` | 用户禁止发帖 | 联系管理员 |
| `User cannot comment` | 用户禁止评论 | 联系管理员 |

### 帖子相关

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| `Post not found` | 帖子不存在 | 检查帖子ID |
| `Post is locked` | 帖子已锁定 | 无法评论 |
| `Post is hidden` | 帖子已隐藏 | 无权访问 |
| `Only author can edit` | 仅作者可编辑 | 检查操作权限 |
| `Only author or admin can delete` | 仅作者或管理员可删除 | 检查操作权限 |
| `Cannot edit system announcement` | 不能编辑系统公告 | 检查操作权限 |

### 评论相关

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| `Comment not found` | 评论不存在 | 检查评论ID |
| `Post not found` | 帖子不存在 | 检查帖子ID |
| `Post is locked` | 帖子已锁定 | 无法评论 |
| `Parent comment not found` | 父评论不存在 | 检查父评论ID |
| `Only author can delete` | 仅作者可删除 | 检查操作权限 |

### 社交相关

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| `Cannot follow yourself` | 不能关注自己 | 使用其他用户ID |
| `Already following` | 已关注 | 无需重复关注 |
| `Not following` | 未关注 | 先关注用户 |
| `Cannot unfollow yourself` | 不能取消关注自己 | 使用其他用户ID |
| `Post already favorited` | 帖子已收藏 | 无需重复收藏 |
| `Post not favorited` | 帖子未收藏 | 先收藏帖子 |

### 文件上传

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| `File not provided` | 未提供文件 | 检查请求格式 |
| `Invalid file type` | 文件类型无效 | 检查文件格式 |
| `File too large` | 文件过大 | 压缩文件或减小尺寸 |
| `Only image files allowed` | 仅允许图片 | 上传图片文件 |
| `Only document files allowed` | 仅允许文档 | 上传文档文件 |

### 验证相关

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| `Email is required` | 邮箱必填 | 提供邮箱地址 |
| `Invalid email format` | 邮箱格式错误 | 检查邮箱格式 |
| `Password is required` | 密码必填 | 提供密码 |
| `Password must be at least 6 characters` | 密码至少6位 | 使用更长的密码 |
| `Username must be between 3-50 characters` | 用户名长度错误 | 调整用户名长度 |
| `Title is required` | 标题必填 | 提供帖子标题 |
| `Content is required` | 内容必填 | 提供帖子内容 |

---

## 错误响应格式

### 标准错误响应

```typescript
interface ErrorResponse {
  statusCode: number;    // HTTP 状态码
  message: string;       // 错误描述
  error: string;         // 错误类型
}
```

### 示例

```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 400,
  "message": "Email is required",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 404,
  "message": "Post not found",
  "error": "Not Found"
}
```

---

## 错误处理建议

### Axios 拦截器处理

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { statusCode, message } = error.response?.data || {};

    switch (statusCode) {
      case 401:
        // 未认证，跳转登录
        console.error('未认证或Token过期:', message);
        window.location.href = '/login';
        break;

      case 403:
        // 无权限，提示用户
        console.error('无权限访问:', message);
        // 显示错误提示
        toast.error('您没有权限执行此操作');
        break;

      case 404:
        // 资源不存在
        console.error('资源不存在:', message);
        toast.error('请求的资源不存在');
        break;

      case 400:
        // 请求参数错误
        console.error('请求参数错误:', message);
        toast.error(message || '请求参数错误');
        break;

      case 500:
        // 服务器错误
        console.error('服务器错误:', message);
        toast.error('服务器内部错误，请稍后重试');
        break;

      default:
        // 其他错误
        console.error('未知错误:', message);
        toast.error(message || '请求失败');
    }

    return Promise.reject(error);
  }
);

export default api;
```

### React Hook 错误处理

```typescript
import { useState } from 'react';
import api from './api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (fn: () => Promise<any>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fn();
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || '请求失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, request };
}

// 使用示例
function UserProfile() {
  const { loading, error, request } = useApi();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const data = await request(() => api.get('/users/me'));
      setUser(data);
    } catch (err) {
      // 错误已在拦截器中处理
    }
  };

  return (
    <div>
      {loading && <p>加载中...</p>}
      {error && <p>错误: {error}</p>}
      {user && <div>{user.username}</div>}
    </div>
  );
}
```

### Vue 3 错误处理

```typescript
import { ref } from 'vue';
import api from './api';

export function useApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const request = async (fn: () => Promise<any>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fn();
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || '请求失败';
      error.value = message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, request };
}
```

---

## 通用错误提示

根据错误类型，建议使用以下提示文案：

| 场景 | 提示文案 |
|------|----------|
| 网络错误 | 网络连接失败，请检查网络设置 |
| 401 未认证 | 登录已过期，请重新登录 |
| 403 无权限 | 您没有权限执行此操作 |
| 404 不存在 | 请求的资源不存在 |
| 500 服务器错误 | 服务器错误，请稍后重试 |
| 上传失败 | 文件上传失败，请重试 |
| 验证失败 | 请检查输入信息是否正确 |

---

**文档版本**: v2.1
**最后更新**: 2026-01-09
