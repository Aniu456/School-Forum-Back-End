# 🔧 校园论坛后台管理系统前端工程师交接文档

> **文档版本**: v1.0.0  
> **最后更新**: 2025-11-15  
> **目标受众**: 负责开发校园论坛后台管理系统（管理员使用）的前端工程师  
> **后端版本**: v0.4.0  

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 快速开始](#2-快速开始)
- [3. 认证与权限](#3-认证与权限)
- [4. 核心管理功能](#4-核心管理功能)
- [5. 数据统计与可视化](#5-数据统计与可视化)
- [6. 错误处理](#6-错误处理)
- [7. 最佳实践](#7-最佳实践)
- [8. 常见问题](#8-常见问题)

---

## 1. 项目概述

### 1.1 管理端功能范围

校园论坛后台管理系统是面向**管理员（ADMIN）**的 Web 应用，提供以下功能：

#### 用户管理
- ✅ 查看用户列表
- ✅ 查看用户详情
- ✅ 封禁/解封用户
- ✅ 用户统计数据

#### 内容管理
- ✅ 查看所有帖子
- ✅ 删除违规帖子
- ✅ 查看所有评论
- ✅ 删除违规评论

#### 举报管理
- ✅ 查看举报列表
- ✅ 处理举报（通过/拒绝）
- ✅ 查看举报详情
- ✅ 添加处理备注

#### 数据统计
- ✅ 用户增长趋势
- ✅ 内容发布趋势
- ✅ 活跃度统计
- ✅ 举报处理统计

#### 系统管理
- ✅ 发送系统通知
- ✅ 操作日志查看
- ✅ 系统配置管理

### 1.2 技术栈建议

```json
{
  "框架": "React 18+ / Vue 3+ / Next.js 14+",
  "管理后台框架": "Ant Design Pro / React Admin / Refine",
  "状态管理": "Redux Toolkit / Zustand / Pinia",
  "路由": "React Router / Vue Router / Next.js App Router",
  "UI组件库": "Ant Design / Material-UI / Element Plus",
  "HTTP客户端": "Axios",
  "图表库": "ECharts / Recharts / Chart.js",
  "表格": "Ant Design Table / TanStack Table",
  "表单验证": "React Hook Form / VeeValidate",
  "富文本查看": "react-markdown"
}
```

### 1.3 后端 API 基础信息

| 项目 | 开发环境 | 生产环境 |
|------|---------|---------|
| **Base URL** | `http://localhost:3000/api/v1` | `https://api.yourdomain.com/api/v1` |
| **数据格式** | JSON | JSON |
| **认证方式** | JWT Bearer Token | JWT Bearer Token |
| **权限要求** | ADMIN 角色 | ADMIN 角色 |

### 1.4 权限说明

⚠️ **重要**: 所有管理端接口都需要 ADMIN 角色权限。

- **注册时角色**: 只能注册为 STUDENT 或 TEACHER
- **管理员创建**: 需要通过后端脚本创建（见快速开始）
- **权限验证**: 后端会验证 JWT Token 中的 `role` 字段

---

## 2. 快速开始

### 2.1 创建管理员账号

管理员账号需要通过后端命令创建：

```bash
# 在后端项目目录
cd school-forum-back-end

# 创建管理员账号
npm run create-admin
# 或使用脚本
node scripts/create-admin.js
```

按提示输入：
- 用户名
- 邮箱
- 密码
- 昵称

### 2.2 前端项目快速集成

#### Step 1: 安装依赖

```bash
# 基础依赖
npm install axios

# 如果使用 Ant Design
npm install antd @ant-design/icons

# 图表库（可选）
npm install echarts echarts-for-react
```

#### Step 2: 配置 API 客户端

创建 `src/api/client.ts`：

```typescript
import axios from 'axios';
import { message } from 'antd'; // 如果使用 Ant Design

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 15000, // 管理端可能需要更长的超时时间
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('adminAccessToken', accessToken);
        localStorage.setItem('adminRefreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }

    // 403 权限不足
    if (error.response?.status === 403) {
      message.error('权限不足，请使用管理员账号登录');
      window.location.href = '/admin/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Step 3: 配置路由守卫

```typescript
// src/utils/auth.ts
export const isAdmin = (): boolean => {
  const user = localStorage.getItem('adminUser');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    return userData.role === 'ADMIN';
  } catch {
    return false;
  }
};

export const requireAdmin = () => {
  if (!isAdmin()) {
    window.location.href = '/admin/login';
    throw new Error('需要管理员权限');
  }
};
```

---

## 3. 认证与权限

### 3.1 管理员登录

**端点**: `POST /auth/login`

```typescript
// src/api/auth.ts
import apiClient from './client';

interface LoginData {
  email: string;
  password: string;
}

export const adminLogin = async (data: LoginData) => {
  const response = await apiClient.post('/auth/login', data);
  
  const { user, accessToken, refreshToken } = response.data;
  
  // 验证是否为管理员
  if (user.role !== 'ADMIN') {
    throw new Error('权限不足，需要管理员账号');
  }
  
  // 保存 Token 和用户信息
  localStorage.setItem('adminAccessToken', accessToken);
  localStorage.setItem('adminRefreshToken', refreshToken);
  localStorage.setItem('adminUser', JSON.stringify(user));
  
  return response;
};
```

#### React 登录组件示例

```tsx
// src/pages/admin/Login.tsx
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { adminLogin } from '../../api/auth';

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await adminLogin(values);
      message.success('登录成功');
      window.location.href = '/admin/dashboard';
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-box">
        <h1>校园论坛管理后台</h1>
        <Form onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="管理员邮箱"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AdminLogin;
```

### 3.2 权限验证中间件

```typescript
// src/components/AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { isAdmin } from '../utils/auth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  if (!isAdmin()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
```

---

## 4. 核心管理功能

### 4.1 用户管理

#### 4.1.1 获取用户列表

**端点**: `GET /admin/users` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/users.ts
interface UsersQuery {
  page?: number;
  limit?: number;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  isBanned?: boolean;
  search?: string; // 搜索用户名或邮箱
}

export const getUsers = async (query: UsersQuery = {}) => {
  return await apiClient.get('/admin/users', { params: query });
};
```

#### React 组件示例

```tsx
// src/pages/admin/UserManagement.tsx
import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, message } from 'antd';
import { getUsers, banUser, unbanUser } from '../../api/admin/users';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getUsers({ page, limit: 20 });
      setUsers(response.data);
      setPagination({
        current: page,
        pageSize: 20,
        total: response.meta.total,
      });
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanUser = (userId: string, isBanned: boolean) => {
    Modal.confirm({
      title: isBanned ? '确认解封用户？' : '确认封禁用户？',
      content: isBanned ? '解封后用户可以正常使用' : '封禁后用户将无法登录',
      onOk: async () => {
        try {
          if (isBanned) {
            await unbanUser(userId);
            message.success('解封成功');
          } else {
            await banUser(userId);
            message.success('封禁成功');
          }
          fetchUsers(pagination.current);
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      ellipsis: true,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: any = {
          ADMIN: 'red',
          TEACHER: 'blue',
          STUDENT: 'green',
        };
        return <Tag color={colorMap[role]}>{role}</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (record: any) => {
        if (record.isBanned) {
          return <Tag color="red">已封禁</Tag>;
        }
        return <Tag color="green">正常</Tag>;
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <Space>
          <Button type="link" size="small">
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            danger={!record.isBanned}
            onClick={() => handleBanUser(record.id, record.isBanned)}
          >
            {record.isBanned ? '解封' : '封禁'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>用户管理</h1>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          onChange: (page) => fetchUsers(page),
        }}
      />
    </div>
  );
};

export default UserManagement;
```

#### 4.1.2 封禁/解封用户

**端点**: `POST /admin/users/:id/ban` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/users.ts
export const banUser = async (userId: string) => {
  return await apiClient.post(`/admin/users/${userId}/ban`);
};

export const unbanUser = async (userId: string) => {
  return await apiClient.post(`/admin/users/${userId}/unban`);
};
```

#### 4.1.3 获取用户详情

**端点**: `GET /admin/users/:id` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/users.ts
export const getUserDetail = async (userId: string) => {
  return await apiClient.get(`/admin/users/${userId}`);
};
```

### 4.2 内容管理

#### 4.2.1 获取所有帖子

**端点**: `GET /admin/posts` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/posts.ts
interface PostsQuery {
  page?: number;
  limit?: number;
  isDeleted?: boolean;
  authorId?: string;
  sortBy?: 'createdAt' | 'viewCount' | 'likeCount';
}

export const getAllPosts = async (query: PostsQuery = {}) => {
  return await apiClient.get('/admin/posts', { params: query });
};
```

#### 4.2.2 删除帖子

**端点**: `DELETE /admin/posts/:id` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/posts.ts
export const deletePost = async (postId: string, reason?: string) => {
  return await apiClient.delete(`/admin/posts/${postId}`, {
    data: { reason },
  });
};
```

#### 4.2.3 获取所有评论

**端点**: `GET /admin/comments` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/comments.ts
export const getAllComments = async (page = 1, limit = 20) => {
  return await apiClient.get('/admin/comments', {
    params: { page, limit },
  });
};
```

#### 4.2.4 删除评论

**端点**: `DELETE /admin/comments/:id` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/comments.ts
export const deleteComment = async (commentId: string) => {
  return await apiClient.delete(`/admin/comments/${commentId}`);
};
```

### 4.3 举报管理

#### 4.3.1 获取举报列表

**端点**: `GET /admin/reports` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/reports.ts
interface ReportsQuery {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  targetType?: 'POST' | 'COMMENT' | 'USER';
}

export const getReports = async (query: ReportsQuery = {}) => {
  return await apiClient.get('/admin/reports', { params: query });
};
```

#### React 组件示例

```tsx
// src/pages/admin/ReportManagement.tsx
import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Input, message } from 'antd';
import { getReports, handleReport } from '../../api/admin/reports';

const { TextArea } = Input;

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [handleNote, setHandleNote] = useState('');

  const fetchReports = async (status?: string) => {
    setLoading(true);
    try {
      const response = await getReports({ status, page: 1, limit: 50 });
      setReports(response.data);
    } catch (error) {
      message.error('获取举报列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports('PENDING'); // 默认只显示待处理的
  }, []);

  const showHandleModal = (report: any) => {
    setCurrentReport(report);
    setModalVisible(true);
  };

  const handleReportAction = async (action: 'APPROVED' | 'REJECTED') => {
    try {
      await handleReport(currentReport.id, {
        status: action,
        handleNote,
      });
      message.success(action === 'APPROVED' ? '已通过举报' : '已拒绝举报');
      setModalVisible(false);
      setHandleNote('');
      fetchReports('PENDING');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '举报ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      ellipsis: true,
    },
    {
      title: '举报类型',
      dataIndex: 'targetType',
      key: 'targetType',
      render: (type: string) => {
        const typeMap: any = {
          POST: '帖子',
          COMMENT: '评论',
          USER: '用户',
        };
        return <Tag>{typeMap[type]}</Tag>;
      },
    },
    {
      title: '举报原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '举报人',
      dataIndex: 'reporter',
      key: 'reporter',
      render: (reporter: any) => reporter.username,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: any = {
          PENDING: 'orange',
          APPROVED: 'green',
          REJECTED: 'red',
        };
        const textMap: any = {
          PENDING: '待处理',
          APPROVED: '已通过',
          REJECTED: '已拒绝',
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '举报时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showHandleModal(record)}
            disabled={record.status !== 'PENDING'}
          >
            处理
          </Button>
          <Button type="link" size="small">
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>举报管理</h1>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => fetchReports('PENDING')}>待处理</Button>
        <Button onClick={() => fetchReports('APPROVED')}>已通过</Button>
        <Button onClick={() => fetchReports('REJECTED')}>已拒绝</Button>
        <Button onClick={() => fetchReports()}>全部</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={reports}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="处理举报"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="reject"
            onClick={() => handleReportAction('REJECTED')}
          >
            拒绝举报
          </Button>,
          <Button
            key="approve"
            type="primary"
            danger
            onClick={() => handleReportAction('APPROVED')}
          >
            通过举报
          </Button>,
        ]}
      >
        <p><strong>举报类型：</strong>{currentReport?.targetType}</p>
        <p><strong>举报原因：</strong>{currentReport?.reason}</p>
        <TextArea
          rows={4}
          placeholder="处理备注（可选）"
          value={handleNote}
          onChange={(e) => setHandleNote(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ReportManagement;
```

#### 4.3.2 处理举报

**端点**: `PATCH /admin/reports/:id` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/reports.ts
interface HandleReportData {
  status: 'APPROVED' | 'REJECTED';
  handleNote?: string;
}

export const handleReport = async (reportId: string, data: HandleReportData) => {
  return await apiClient.patch(`/admin/reports/${reportId}`, data);
};
```

### 4.4 系统通知

#### 4.4.1 发送系统通知

**端点**: `POST /admin/notifications/broadcast` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/notifications.ts
interface BroadcastData {
  title: string;
  content: string;
  targetUsers?: string[]; // 不提供则发送给所有用户
}

export const sendBroadcastNotification = async (data: BroadcastData) => {
  return await apiClient.post('/admin/notifications/broadcast', data);
};
```

#### React 组件示例

```tsx
// src/pages/admin/SendNotification.tsx
import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { sendBroadcastNotification } from '../../api/admin/notifications';

const SendNotification = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await sendBroadcastNotification(values);
      message.success('通知发送成功');
      form.resetFields();
    } catch (error) {
      message.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>发送系统通知</h1>
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label="通知标题"
          name="title"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="输入通知标题" />
        </Form.Item>
        <Form.Item
          label="通知内容"
          name="content"
          rules={[{ required: true, message: '请输入内容' }]}
        >
          <Input.TextArea rows={6} placeholder="输入通知内容" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            发送给所有用户
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SendNotification;
```

---

## 5. 数据统计与可视化

### 5.1 获取统计数据

**端点**: `GET /admin/statistics` 🔒 需要 ADMIN 权限

```typescript
// src/api/admin/statistics.ts
interface StatisticsQuery {
  startDate?: string;
  endDate?: string;
  type?: 'user' | 'post' | 'comment' | 'report';
}

export const getStatistics = async (query: StatisticsQuery = {}) => {
  return await apiClient.get('/admin/statistics', { params: query });
};

// 获取概览数据
export const getOverview = async () => {
  return await apiClient.get('/admin/statistics/overview');
};
```

#### React 组件示例（使用 ECharts）

```tsx
// src/pages/admin/Dashboard.tsx
import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { UserOutlined, FileTextOutlined, CommentOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getOverview, getStatistics } from '../../api/admin/statistics';

const Dashboard = () => {
  const [overview, setOverview] = useState<any>({});
  const [userGrowth, setUserGrowth] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const overviewData = await getOverview();
      setOverview(overviewData.data);

      const statsData = await getStatistics({
        type: 'user',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });
      setUserGrowth(statsData.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const getUserGrowthOption = () => ({
    title: {
      text: '用户增长趋势（最近30天）',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: userGrowth.map((item: any) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: userGrowth.map((item: any) => item.count),
        smooth: true,
        areaStyle: {},
      },
    ],
  });

  return (
    <div>
      <h1>数据概览</h1>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={overview.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总帖子数"
              value={overview.totalPosts}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总评论数"
              value={overview.totalComments}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理举报"
              value={overview.pendingReports}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <ReactECharts option={getUserGrowthOption()} style={{ height: 400 }} />
      </Card>
    </div>
  );
};

export default Dashboard;
```

---

## 6. 错误处理

### 6.1 错误响应格式

```json
{
  "statusCode": 403,
  "message": "权限不足",
  "error": "Forbidden",
  "timestamp": "2025-11-15T12:00:00.000Z",
  "path": "/api/v1/admin/users"
}
```

### 6.2 常见错误码

| 状态码 | 说明 | 处理方式 |
|-------|------|---------|
| 401 | 未授权（未登录或 Token 失效） | 跳转到管理员登录页 |
| 403 | 禁止访问（非 ADMIN 角色） | 显示"权限不足"提示，跳转登录页 |
| 404 | 资源不存在 | 显示"内容不存在" |
| 500 | 服务器内部错误 | 显示"服务器错误" |

### 6.3 全局错误处理

```typescript
// src/utils/errorHandler.ts
import { message } from 'antd';

export const handleAdminError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 401:
        message.error('登录已过期，请重新登录');
        localStorage.clear();
        window.location.href = '/admin/login';
        break;
      case 403:
        message.error('权限不足，请使用管理员账号');
        window.location.href = '/admin/login';
        break;
      case 404:
        message.error('资源不存在');
        break;
      case 500:
        message.error('服务器错误，请稍后再试');
        break;
      default:
        message.error(data.message || '未知错误');
    }
  } else {
    message.error('网络错误，请检查连接');
  }
};
```

---

## 7. 最佳实践

### 7.1 布局结构

推荐使用经典的管理后台布局：

```tsx
// src/layouts/AdminLayout.tsx
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div className="logo" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            数据概览
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />}>
            用户管理
          </Menu.Item>
          <Menu.Item key="3" icon={<FileTextOutlined />}>
            内容管理
          </Menu.Item>
          <Menu.Item key="4" icon={<WarningOutlined />}>
            举报管理
          </Menu.Item>
          <Menu.Item key="5" icon={<SettingOutlined />}>
            系统设置
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <h2>校园论坛管理后台</h2>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
```

### 7.2 表格优化

1. **分页**: 始终使用分页，避免一次加载过多数据
2. **搜索与筛选**: 提供搜索框和筛选器
3. **批量操作**: 支持批量删除、批量审核等
4. **导出功能**: 提供数据导出功能

### 7.3 操作确认

对于敏感操作（删除、封禁），必须使用确认对话框：

```tsx
import { Modal } from 'antd';

const confirmDelete = (id: string) => {
  Modal.confirm({
    title: '确认删除？',
    content: '此操作不可恢复',
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      await deletePost(id);
      message.success('删除成功');
    },
  });
};
```

### 7.4 权限控制

在组件级别控制权限：

```tsx
// src/components/PermissionGuard.tsx
import { isAdmin } from '../utils/auth';

interface PermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  return isAdmin() ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
```

---

## 8. 常见问题

### Q1: 如何创建管理员账号？

**A**: 管理员账号只能通过后端脚本创建，不能通过注册接口创建。

```bash
npm run create-admin
# 或
node scripts/create-admin.js
```

### Q2: 登录后提示"权限不足"？

**A**: 检查以下几点：
1. 确认账号的 `role` 字段为 `ADMIN`
2. 检查 JWT Token 是否有效
3. 查看后端日志确认权限验证逻辑

### Q3: 如何区分管理端和用户端的 Token？

**A**: 建议使用不同的 localStorage key：
- 管理端: `adminAccessToken`, `adminRefreshToken`, `adminUser`
- 用户端: `accessToken`, `refreshToken`, `user`

### Q4: 如何处理数据量大的表格？

**A**: 
1. 使用服务端分页（必需）
2. 使用虚拟滚动（可选，针对超大数据）
3. 添加搜索和筛选功能
4. 考虑导出功能而不是一次性显示全部

### Q5: 如何实现操作日志？

**A**: 后端可能提供操作日志接口：

```typescript
// src/api/admin/logs.ts
export const getOperationLogs = async (page = 1, limit = 50) => {
  return await apiClient.get('/admin/logs', {
    params: { page, limit },
  });
};
```

---

## 📚 相关文档

- [完整 API 文档](./02-implementation/api-documentation.md)
- [后端架构设计](./01-design/architecture-design.md)
- [权限系统说明](./PERMISSIONS.md)
- [故障排查指南](./TROUBLESHOOTING.md)

---

## 🎯 总结

本文档涵盖了校园论坛后台管理系统前端开发的所有核心功能：

✅ 管理员认证与权限验证  
✅ 用户管理（查看、封禁、解封）  
✅ 内容管理（帖子、评论）  
✅ 举报管理（查看、处理）  
✅ 系统通知发送  
✅ 数据统计与可视化  
✅ 错误处理  
✅ 最佳实践  

**下一步**：参考本文档快速搭建管理后台应用，遇到问题查看[故障排查指南](./TROUBLESHOOTING.md)或联系后端团队。

---

**文档维护者**: 后端开发团队  
**联系方式**: support@example.com  
**最后更新**: 2025-11-15
