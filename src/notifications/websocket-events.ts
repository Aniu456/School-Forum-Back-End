/**
 * WebSocket 实时通知事件文档
 *
 * 客户端连接示例 (JavaScript/TypeScript)
 * ============================================
 *
 * import { io } from 'socket.io-client';
 *
 * const socket = io('http://localhost:3000', {
 *   auth: {
 *     token: 'your_jwt_token'
 *   }
 * });
 *
 * // 连接成功
 * socket.on('connect', () => {
 *   console.log('已连接到服务器');
 * });
 *
 * // 连接失败
 * socket.on('disconnect', () => {
 *   console.log('已断开连接');
 * });
 *
 * // 错误处理
 * socket.on('error', (error) => {
 *   console.error('WebSocket 错误:', error);
 * });
 *
 *
 * WebSocket 事件清单
 * ============================================
 *
 * 1. 接收新通知
 *    事件名: 'notification:new'
 *    说明: 当有新通知时实时推送到客户端
 *    数据结构:
 *    {
 *      id: string,
 *      userId: string,
 *      type: 'COMMENT' | 'REPLY' | 'LIKE' | 'SYSTEM',
 *      title: string,
 *      content: string,
 *      relatedId: string | null,
 *      isRead: boolean,
 *      createdAt: datetime
 *    }
 *
 *    客户端接收示例:
 *    socket.on('notification:new', (notification) => {
 *      console.log('收到新通知:', notification);
 *      // 更新前端通知列表
 *    });
 *
 *
 * 2. 获取未读通知数量
 *    事件名: 'notification:unread_count'
 *    说明: 客户端发送此事件获取当前未读通知数量
 *
 *    客户端发送示例:
 *    socket.emit('notification:unread_count', {});
 *
 *    服务器响应:
 *    socket.on('notification:unread_count', (data) => {
 *      console.log('未读通知数:', data.unreadCount);
 *    });
 *
 *
 * 3. 标记单个通知为已读
 *    事件名: 'notification:mark_read'
 *    说明: 将指定的通知标记为已读
 *    发送数据:
 *    {
 *      notificationId: string
 *    }
 *
 *    客户端发送示例:
 *    socket.emit('notification:mark_read', {
 *      notificationId: 'notification_id_here'
 *    });
 *
 *    服务器响应:
 *    socket.on('notification:read_success', (data) => {
 *      console.log('通知已标记为已读:', data.notificationId);
 *    });
 *
 *
 * 4. 标记所有通知为已读
 *    事件名: 'notification:mark_all_read'
 *    说明: 将当前用户的所有通知标记为已读
 *
 *    客户端发送示例:
 *    socket.emit('notification:mark_all_read', {});
 *
 *    服务器响应:
 *    socket.on('notification:all_read_success', (data) => {
 *      console.log('所有通知已标记为已读');
 *      console.log('标记数量:', data.count);
 *    });
 *
 *
 * 5. 未读通知数量更新
 *    事件名: 'notification:unread_count_updated'
 *    说明: 当未读通知数量变化时，服务器主动推送此事件
 *    数据结构:
 *    {
 *      unreadCount: number
 *    }
 *
 *    客户端接收示例:
 *    socket.on('notification:unread_count_updated', (data) => {
 *      console.log('未读通知数量已更新:', data.unreadCount);
 *      // 更新前端通知计数器
 *    });
 *
 *
 * 6. 在线用户数量
 *    事件名: 'system:online_count'
 *    说明: 系统广播在线用户数量（可选）
 *    数据结构:
 *    {
 *      onlineUsers: number,
 *      timestamp: string (ISO 8601)
 *    }
 *
 *    客户端接收示例:
 *    socket.on('system:online_count', (data) => {
 *      console.log('当前在线用户数:', data.onlineUsers);
 *    });
 *
 *
 * 7. 错误事件
 *    事件名: 'error'
 *    说明: 当操作出错时返回错误信息
 *    数据结构:
 *    {
 *      message: string
 *    }
 *
 *    客户端接收示例:
 *    socket.on('error', (error) => {
 *      console.error('操作失败:', error.message);
 *    });
 *
 *
 * 完整客户端示例 (React)
 * ============================================
 *
 * import { useEffect, useState } from 'react';
 * import { io } from 'socket.io-client';
 *
 * export function NotificationCenter({ token }) {
 *   const [notifications, setNotifications] = useState([]);
 *   const [unreadCount, setUnreadCount] = useState(0);
 *   const [socket, setSocket] = useState(null);
 *
 *   useEffect(() => {
 *     // 连接到 WebSocket 服务器
 *     const newSocket = io('http://localhost:3000', {
 *       auth: { token }
 *     });
 *
 *     // 接收新通知
 *     newSocket.on('notification:new', (notification) => {
 *       setNotifications(prev => [notification, ...prev]);
 *       setUnreadCount(prev => prev + 1);
 *     });
 *
 *     // 未读数量更新
 *     newSocket.on('notification:unread_count_updated', (data) => {
 *       setUnreadCount(data.unreadCount);
 *     });
 *
 *     // 错误处理
 *     newSocket.on('error', (error) => {
 *       console.error('通知错误:', error.message);
 *     });
 *
 *     setSocket(newSocket);
 *
 *     return () => newSocket.close();
 *   }, [token]);
 *
 *   // 获取未读数量
 *   const getUnreadCount = () => {
 *     socket?.emit('notification:unread_count', {});
 *   };
 *
 *   // 标记通知为已读
 *   const markAsRead = (notificationId) => {
 *     socket?.emit('notification:mark_read', { notificationId });
 *   };
 *
 *   // 标记所有为已读
 *   const markAllAsRead = () => {
 *     socket?.emit('notification:mark_all_read', {});
 *   };
 *
 *   return (
 *     <div>
 *       <h2>通知中心 ({unreadCount})</h2>
 *       <button onClick={markAllAsRead}>全部标记为已读</button>
 *       <ul>
 *         {notifications.map(notif => (
 *           <li key={notif.id} onClick={() => markAsRead(notif.id)}>
 *             <strong>{notif.title}</strong>: {notif.content}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 *
 *
 * 通知创建触发流程
 * ============================================
 *
 * 1. 其他服务（如 CommentsService）创建通知
 * 2. NotificationsService.create() 保存到数据库
 * 3. NotificationEmitterService.emitNotification() 检查用户在线状态
 * 4. 如果用户在线，通过 WebSocket 推送 'notification:new' 事件
 * 5. 客户端实时接收通知并更新 UI
 * 6. 用户点击标记为已读后，发送 'notification:mark_read' 事件
 * 7. 服务器更新数据库并推送 'notification:unread_count_updated' 事件
 *
 *
 * 测试 WebSocket 连接 (使用 curl)
 * ============================================
 *
 * # 使用 wscat 工具测试
 * npm install -g wscat
 *
 * wscat -c "ws://localhost:3000/socket.io/?transport=websocket&EIO=4&t=test" \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 *
 * # 在 wscat 中发送事件
 * {"event":"notification:unread_count","args":[{}]}
 *
 */

export const WEBSOCKET_EVENTS = {
  // 客户端监听的事件
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_UNREAD_COUNT: 'notification:unread_count',
  NOTIFICATION_UNREAD_COUNT_UPDATED: 'notification:unread_count_updated',
  NOTIFICATION_READ_SUCCESS: 'notification:read_success',
  NOTIFICATION_ALL_READ_SUCCESS: 'notification:all_read_success',
  SYSTEM_ONLINE_COUNT: 'system:online_count',
  ERROR: 'error',

  // 客户端发送的事件
  CLIENT_MARK_READ: 'notification:mark_read',
  CLIENT_MARK_ALL_READ: 'notification:mark_all_read',
  CLIENT_GET_UNREAD_COUNT: 'notification:unread_count',
};
