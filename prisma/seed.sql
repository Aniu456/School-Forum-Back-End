-- ============================================
-- 校园论坛模拟数据 SQL
-- 密码统一为: xs123456
-- ============================================

-- 清空现有数据（按依赖顺序）
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversation_participants CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE announcements CASCADE;
TRUNCATE TABLE favorites CASCADE;
TRUNCATE TABLE follows CASCADE;
TRUNCATE TABLE likes CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE verification_codes CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================
-- 1. 用户表 (users) - 10条数据
-- 密码: xs123456 -> $2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.
-- ============================================
INSERT INTO users (id, username, email, password, nickname, avatar, bio, role, is_active, is_banned, can_post, can_comment, follower_count, following_count, last_login_at, last_login_ip, created_at, updated_at) VALUES
('u001', 'zhangsan', 'zhangsan@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '张三', 'https://picsum.photos/200/200?random=1', '计算机科学与技术专业，热爱编程', 'USER', true, false, true, true, 120, 85, NOW() - INTERVAL '1 hour', '192.168.1.100', NOW() - INTERVAL '180 days', NOW()),
('u002', 'lisi', 'lisi@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '李四', 'https://picsum.photos/200/200?random=2', '软件工程专业，喜欢研究新技术', 'USER', true, false, true, true, 88, 56, NOW() - INTERVAL '2 hours', '192.168.1.101', NOW() - INTERVAL '150 days', NOW()),
('u003', 'wangwu', 'wangwu@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '王五', 'https://picsum.photos/200/200?random=3', '信息管理专业，数据分析爱好者', 'USER', true, false, true, true, 65, 42, NOW() - INTERVAL '5 hours', '192.168.1.102', NOW() - INTERVAL '120 days', NOW()),
('u004', 'zhaoliu', 'zhaoliu@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '赵六', 'https://picsum.photos/200/200?random=4', '电子商务专业，创业达人', 'USER', true, false, true, true, 210, 180, NOW() - INTERVAL '30 minutes', '192.168.1.103', NOW() - INTERVAL '200 days', NOW()),
('u005', 'sunqi', 'sunqi@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '孙七', 'https://picsum.photos/200/200?random=5', '网络工程专业，安全研究员', 'USER', true, false, true, true, 45, 30, NOW() - INTERVAL '3 hours', '192.168.1.104', NOW() - INTERVAL '90 days', NOW()),
('u006', 'zhouba', 'zhouba@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '周八', 'https://picsum.photos/200/200?random=6', '人工智能专业，深度学习研究', 'USER', true, false, true, true, 156, 98, NOW() - INTERVAL '6 hours', '192.168.1.105', NOW() - INTERVAL '100 days', NOW()),
('u007', 'wujiu', 'wujiu@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '吴九', 'https://picsum.photos/200/200?random=7', '大数据专业，热爱数据可视化', 'USER', true, false, true, true, 78, 55, NOW() - INTERVAL '4 hours', '192.168.1.106', NOW() - INTERVAL '80 days', NOW()),
('u008', 'zhengshi', 'zhengshi@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '郑十', 'https://picsum.photos/200/200?random=8', '物联网专业，硬件极客', 'USER', true, false, true, true, 92, 67, NOW() - INTERVAL '8 hours', '192.168.1.107', NOW() - INTERVAL '70 days', NOW()),
('admin01', 'admin', 'admin@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '系统管理员', 'https://picsum.photos/200/200?random=99', '论坛管理员，维护社区秩序', 'ADMIN', true, false, true, true, 500, 10, NOW() - INTERVAL '10 minutes', '192.168.1.1', NOW() - INTERVAL '365 days', NOW()),
('u009', 'xiaoming', 'xiaoming@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '小明', 'https://picsum.photos/200/200?random=9', '大一新生，求带飞', 'USER', true, false, true, true, 25, 100, NOW() - INTERVAL '12 hours', '192.168.1.108', NOW() - INTERVAL '30 days', NOW()),
('u010', 'xiaohong', 'xiaohong@school.edu.cn', '$2b$10$kmyEhuEvlO9AOQaGkDco3OM17ds7y.VRnKramnN2Lmx78vMEjmEM.', '小红', 'https://picsum.photos/200/200?random=10', '设计专业，UI设计师', 'USER', true, false, true, true, 180, 120, NOW() - INTERVAL '2 hours', '192.168.1.109', NOW() - INTERVAL '60 days', NOW());

-- ============================================
-- 2. 帖子表 (posts) - 12条数据（含图片）
-- ============================================
INSERT INTO posts (id, title, content, images, author_id, tags, view_count, like_count, comment_count, is_pinned, is_highlighted, is_locked, is_hidden, pinned_at, highlighted_at, created_at, updated_at) VALUES
('p001', '【经验分享】大学四年编程学习路线总结', '分享一下我大学四年的编程学习经历，从零基础到拿到大厂offer的心路历程。希望能帮助到学弟学妹们！

## 大一：打好基础
- C语言入门
- 数据结构与算法
- 计算机组成原理

## 大二：深入学习
- Java/Python进阶
- 数据库原理
- 操作系统

## 大三：项目实战
- 参加各类比赛
- 实习经历
- 开源项目贡献

## 大四：冲刺offer
- 刷题技巧
- 面试准备',
ARRAY['https://picsum.photos/800/600?random=101', 'https://picsum.photos/800/600?random=102', 'https://picsum.photos/800/600?random=103'],
'u001', ARRAY['经验分享', '编程学习', '求职'], 2580, 168, 45, true, true, false, false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 days', NOW()),

('p002', '二手MacBook Pro出售，9成新', '因为换新电脑，出售自用MacBook Pro 2021款。

**配置信息：**
- M1 Pro芯片
- 16GB内存
- 512GB固态
- 14寸屏幕

**使用情况：**
- 购买日期：2022年3月
- 使用时长：约2年
- 电池循环：约200次
- 无任何维修记录

**价格：** 8500元（可小刀）

**交易方式：** 校内面交，支持验机',
ARRAY['https://picsum.photos/800/600?random=201', 'https://picsum.photos/800/600?random=202', 'https://picsum.photos/800/600?random=203', 'https://picsum.photos/800/600?random=204'],
'u002', ARRAY['二手交易', '电脑', 'MacBook'], 1250, 35, 28, false, false, false, false, NULL, NULL, NOW() - INTERVAL '3 days', NOW()),

('p003', '【学习资料】计算机网络期末复习资料分享', '整理了计算机网络这门课的复习资料，包括：

1. 知识点总结思维导图
2. 历年真题及答案
3. 重点章节笔记
4. 实验报告模板

需要的同学可以私信我获取百度网盘链接~',
ARRAY['https://picsum.photos/800/600?random=301', 'https://picsum.photos/800/600?random=302'],
'u003', ARRAY['学习资料', '计算机网络', '期末复习'], 3420, 256, 89, false, true, false, false, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days', NOW()),

('p004', '校园美食探店｜食堂三楼新开的奶茶店', '最近食堂三楼新开了一家奶茶店，今天去尝试了一下，给大家分享一下体验！

**推荐饮品：**
- 杨枝甘露：芒果很新鲜，椰浆味道浓郁
- 珍珠奶茶：珍珠Q弹，奶茶不会太甜
- 抹茶拿铁：抹茶味道正宗

**价格：** 8-15元不等，学生证可以打9折

**环境：** 装修很有格调，适合拍照打卡',
ARRAY['https://picsum.photos/800/600?random=401', 'https://picsum.photos/800/600?random=402', 'https://picsum.photos/800/600?random=403'],
'u004', ARRAY['美食', '探店', '奶茶'], 890, 78, 32, false, false, false, false, NULL, NULL, NOW() - INTERVAL '2 days', NOW()),

('p005', '求组队参加ACM程序设计竞赛', '本人大二计科专业，想找两位同学一起组队参加今年的ACM校赛。

**个人情况：**
- Codeforces rating: 1600+
- LeetCode刷题500+
- 熟悉C++、Python
- 擅长动态规划和图论

**希望队友：**
- 对算法竞赛有热情
- 每周能保证一定的训练时间
- 最好擅长数据结构或数学

有意向的同学可以评论区留言或私信我！',
ARRAY['https://picsum.photos/800/600?random=501'],
'u005', ARRAY['组队', 'ACM', '算法竞赛'], 650, 42, 18, false, false, false, false, NULL, NULL, NOW() - INTERVAL '5 days', NOW()),

('p006', '【求助】Python爬虫遇到反爬机制怎么办？', '最近在做一个数据采集的项目，但是目标网站有反爬机制，请求几次就被封IP了。

已经尝试过的方法：
1. 设置User-Agent
2. 添加随机延时
3. 使用代理IP池

但效果都不太好，请问各位大佬有什么好的解决方案吗？',
ARRAY['https://picsum.photos/800/600?random=601'],
'u006', ARRAY['技术问答', 'Python', '爬虫'], 420, 15, 23, false, false, false, false, NULL, NULL, NOW() - INTERVAL '1 day', NOW()),

('p007', '分享一下我的桌面布置，程序员的工作环境', '花了一个周末时间整理了一下我的书桌，分享给大家~

**设备清单：**
- 主显示器：Dell U2723QE 4K
- 副显示器：LG 27UL850
- 键盘：HHKB Professional Hybrid
- 鼠标：罗技MX Master 3
- 耳机：索尼WH-1000XM5
- 台灯：明基ScreenBar Plus

**桌面配件：**
- 显示器支架
- 理线架
- 桌垫
- 绿植',
ARRAY['https://picsum.photos/800/600?random=701', 'https://picsum.photos/800/600?random=702', 'https://picsum.photos/800/600?random=703', 'https://picsum.photos/800/600?random=704'],
'u007', ARRAY['分享', '桌面布置', '程序员'], 1820, 198, 67, false, true, false, false, NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '10 days', NOW()),

('p008', '【失物招领】在图书馆捡到一个U盘', '今天下午在图书馆三楼自习室捡到一个黑色金士顿U盘，容量是32GB。

失主请联系我，需要说明U盘里大概有什么文件来核实身份。

捡到的位置是靠窗户的那排座位，大概是下午3点左右。',
ARRAY['https://picsum.photos/800/600?random=801'],
'u008', ARRAY['失物招领', '图书馆'], 380, 8, 12, false, false, false, false, NULL, NULL, NOW() - INTERVAL '6 hours', NOW()),

('p009', '毕业季｜记录我在学校的最后时光', '还有一个月就要毕业了，趁着这段时间把校园里的每个角落都走了一遍，拍了一些照片留作纪念。

四年时光转瞬即逝，感谢这里给我的一切美好回忆。

希望学弟学妹们珍惜在校的每一天！',
ARRAY['https://picsum.photos/800/600?random=901', 'https://picsum.photos/800/600?random=902', 'https://picsum.photos/800/600?random=903', 'https://picsum.photos/800/600?random=904', 'https://picsum.photos/800/600?random=905'],
'u001', ARRAY['毕业季', '校园', '回忆'], 2100, 312, 88, true, true, false, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW()),

('p010', '【教程】从零开始学Docker，小白入门指南', '最近学习了Docker，整理了一份入门教程分享给大家。

## 什么是Docker？
Docker是一个开源的容器化平台，可以让开发者打包应用及其依赖到一个可移植的容器中。

## 安装Docker
根据不同操作系统选择安装方式。

## 基本命令
docker pull nginx
docker run -d -p 80:80 nginx
docker ps
docker stop container_id

## 实战案例
部署一个简单的Web应用...',
ARRAY['https://picsum.photos/800/600?random=1001', 'https://picsum.photos/800/600?random=1002'],
'u006', ARRAY['教程', 'Docker', '技术分享'], 1560, 145, 34, false, false, false, false, NULL, NULL, NOW() - INTERVAL '8 days', NOW()),

('p011', '二手书籍转让：高等数学、线性代数、概率论', '大一大二的数学教材转让，都是正版书籍，有少量笔记标注。

**书籍清单：**
1. 高等数学（同济第七版）上下册 - 30元
2. 线性代数（同济第六版） - 15元
3. 概率论与数理统计（浙大第四版） - 15元

打包购买优惠价：50元

可校内面交，地点可商量。',
ARRAY['https://picsum.photos/800/600?random=1101', 'https://picsum.photos/800/600?random=1102'],
'u009', ARRAY['二手交易', '书籍', '教材'], 450, 22, 15, false, false, false, false, NULL, NULL, NOW() - INTERVAL '4 days', NOW()),

('p012', '校园跑步打卡Day30，终于坚持了一个月！', '从一个月前开始每天晚上在操场跑步，今天终于坚持满30天了！

**这一个月的变化：**
- 体重：从75kg降到70kg
- 配速：从7分钟/公里提升到5分30秒/公里
- 每次跑量：从2公里增加到5公里

分享一下我的跑步路线和运动数据，希望能激励更多同学加入运动的行列！',
ARRAY['https://picsum.photos/800/600?random=1201', 'https://picsum.photos/800/600?random=1202', 'https://picsum.photos/800/600?random=1203'],
'u010', ARRAY['运动', '跑步', '打卡'], 780, 95, 41, false, false, false, false, NULL, NULL, NOW() - INTERVAL '12 hours', NOW());

-- ============================================
-- 3. 评论表 (comments) - 20条数据
-- ============================================
INSERT INTO comments (id, content, post_id, author_id, parent_id, like_count, created_at, updated_at) VALUES
-- 帖子1的评论
('c001', '写得太好了！学到了很多，感谢学长分享！', 'p001', 'u002', NULL, 25, NOW() - INTERVAL '29 days', NOW()),
('c002', '请问大三实习是怎么找的呀？', 'p001', 'u009', NULL, 8, NOW() - INTERVAL '28 days', NOW()),
('c003', '我是通过牛客网和实习僧投递的，多投多试就好', 'p001', 'u001', 'c002', 12, NOW() - INTERVAL '28 days', NOW()),
('c004', '同问，准备大三找实习了', 'p001', 'u003', 'c002', 3, NOW() - INTERVAL '27 days', NOW()),
-- 帖子2的评论
('c005', '价格可以再优惠一点吗？', 'p002', 'u005', NULL, 2, NOW() - INTERVAL '2 days', NOW()),
('c006', '还有吗？我想要', 'p002', 'u007', NULL, 1, NOW() - INTERVAL '2 days', NOW()),
('c007', '可以私聊详谈', 'p002', 'u002', 'c005', 0, NOW() - INTERVAL '2 days', NOW()),
-- 帖子3的评论
('c008', '太及时了！正好在复习这门课，感谢分享！', 'p003', 'u004', NULL, 35, NOW() - INTERVAL '6 days', NOW()),
('c009', '已私信，求资料~', 'p003', 'u009', NULL, 5, NOW() - INTERVAL '5 days', NOW()),
('c010', '能顺便分享一下操作系统的资料吗？', 'p003', 'u010', NULL, 18, NOW() - INTERVAL '4 days', NOW()),
-- 帖子4的评论
('c011', '种草了！明天就去试试', 'p004', 'u001', NULL, 8, NOW() - INTERVAL '1 day', NOW()),
('c012', '杨枝甘露真的很好喝，已经回购三次了', 'p004', 'u003', NULL, 15, NOW() - INTERVAL '1 day', NOW()),
-- 帖子5的评论
('c013', '我擅长数据结构，可以组队吗？CF rating 1500+', 'p005', 'u006', NULL, 6, NOW() - INTERVAL '4 days', NOW()),
('c014', '可以的，私信联系一下', 'p005', 'u005', 'c013', 2, NOW() - INTERVAL '4 days', NOW()),
-- 帖子7的评论
('c015', '这配置太顶了！羡慕.jpg', 'p007', 'u004', NULL, 28, NOW() - INTERVAL '9 days', NOW()),
('c016', 'HHKB用起来怎么样？一直想入手', 'p007', 'u008', NULL, 12, NOW() - INTERVAL '8 days', NOW()),
('c017', '习惯了之后真的回不去了，强烈推荐', 'p007', 'u007', 'c016', 8, NOW() - INTERVAL '8 days', NOW()),
-- 帖子9的评论
('c018', '学长毕业快乐！前程似锦！', 'p009', 'u009', NULL, 42, NOW() - INTERVAL '1 day', NOW()),
('c019', '看哭了，明年就轮到我们了...', 'p009', 'u002', NULL, 35, NOW() - INTERVAL '1 day', NOW()),
('c020', '感谢学长四年来的帮助，祝一切顺利！', 'p009', 'u003', NULL, 28, NOW() - INTERVAL '20 hours', NOW());

-- ============================================
-- 4. 点赞表 (likes) - 16条数据
-- ============================================
INSERT INTO likes (id, user_id, target_id, target_type, created_at) VALUES
-- 帖子点赞
('l001', 'u002', 'p001', 'POST', NOW() - INTERVAL '29 days'),
('l002', 'u003', 'p001', 'POST', NOW() - INTERVAL '28 days'),
('l003', 'u004', 'p001', 'POST', NOW() - INTERVAL '27 days'),
('l004', 'u005', 'p001', 'POST', NOW() - INTERVAL '26 days'),
('l005', 'u001', 'p003', 'POST', NOW() - INTERVAL '6 days'),
('l006', 'u004', 'p003', 'POST', NOW() - INTERVAL '5 days'),
('l007', 'u001', 'p004', 'POST', NOW() - INTERVAL '1 day'),
('l008', 'u003', 'p004', 'POST', NOW() - INTERVAL '1 day'),
('l009', 'u006', 'p007', 'POST', NOW() - INTERVAL '9 days'),
('l010', 'u008', 'p007', 'POST', NOW() - INTERVAL '8 days'),
('l011', 'u002', 'p009', 'POST', NOW() - INTERVAL '1 day'),
('l012', 'u003', 'p009', 'POST', NOW() - INTERVAL '1 day'),
('l013', 'u004', 'p009', 'POST', NOW() - INTERVAL '20 hours'),
-- 评论点赞
('l014', 'u001', 'c001', 'COMMENT', NOW() - INTERVAL '29 days'),
('l015', 'u003', 'c008', 'COMMENT', NOW() - INTERVAL '5 days'),
('l016', 'u002', 'c018', 'COMMENT', NOW() - INTERVAL '1 day');

-- ============================================
-- 5. 关注表 (follows) - 12条数据
-- ============================================
INSERT INTO follows (id, follower_id, following_id, created_at) VALUES
('f001', 'u002', 'u001', NOW() - INTERVAL '100 days'),
('f002', 'u003', 'u001', NOW() - INTERVAL '90 days'),
('f003', 'u004', 'u001', NOW() - INTERVAL '80 days'),
('f004', 'u005', 'u001', NOW() - INTERVAL '70 days'),
('f005', 'u009', 'u001', NOW() - INTERVAL '20 days'),
('f006', 'u001', 'u002', NOW() - INTERVAL '95 days'),
('f007', 'u003', 'u002', NOW() - INTERVAL '85 days'),
('f008', 'u001', 'u004', NOW() - INTERVAL '60 days'),
('f009', 'u002', 'u004', NOW() - INTERVAL '55 days'),
('f010', 'u006', 'u007', NOW() - INTERVAL '50 days'),
('f011', 'u008', 'u007', NOW() - INTERVAL '45 days'),
('f012', 'u010', 'u001', NOW() - INTERVAL '15 days');

-- ============================================
-- 6. 收藏表 (favorites) - 8条数据
-- ============================================
INSERT INTO favorites (id, user_id, post_id, note, created_at) VALUES
('fav001', 'u002', 'p001', '学习路线参考', NOW() - INTERVAL '28 days'),
('fav002', 'u003', 'p001', NULL, NOW() - INTERVAL '27 days'),
('fav003', 'u009', 'p001', '大一必看', NOW() - INTERVAL '25 days'),
('fav004', 'u004', 'p003', '期末复习资料', NOW() - INTERVAL '5 days'),
('fav005', 'u010', 'p003', NULL, NOW() - INTERVAL '4 days'),
('fav006', 'u001', 'p007', '桌面布置参考', NOW() - INTERVAL '8 days'),
('fav007', 'u005', 'p010', 'Docker入门教程', NOW() - INTERVAL '7 days'),
('fav008', 'u008', 'p010', NULL, NOW() - INTERVAL '6 days');

-- ============================================
-- 7. 系统公告表 (announcements) - 3条数据
-- ============================================
INSERT INTO announcements (id, title, content, type, target_role, is_published, is_pinned, is_hidden, author_id, published_at, created_at, updated_at) VALUES
('a001', '校园论坛使用规范', '欢迎使用校园论坛！为了营造良好的交流环境，请大家遵守以下规范：

1. 尊重他人，文明发言
2. 禁止发布违法违规内容
3. 禁止恶意灌水和刷屏
4. 禁止发布虚假信息
5. 二手交易请注意安全

违规者将被警告或封禁账号，严重者将移交学校处理。', 'INFO', NULL, true, true, false, 'admin01', NOW() - INTERVAL '300 days', NOW() - INTERVAL '300 days', NOW()),

('a002', '系统维护通知', '尊敬的用户：

论坛将于本周六凌晨2:00-6:00进行系统维护升级，届时将暂停服务。

维护内容：
- 服务器性能优化
- 新功能上线准备
- 安全补丁更新

给您带来不便，敬请谅解！', 'WARNING', NULL, true, false, false, 'admin01', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW()),

('a003', '关于加强二手交易安全的提醒', '近期有同学反映在二手交易中遇到诈骗情况，请大家注意：

1. 优先选择校内面交
2. 不要提前转账
3. 核实商品真实性
4. 保留交易记录

如遇可疑情况，请及时向管理员举报。', 'URGENT', NULL, true, true, false, 'admin01', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW());

-- ============================================
-- 8. 通知表 (notifications) - 8条数据
-- ============================================
INSERT INTO notifications (id, user_id, type, sender_id, title, content, related_id, is_read, created_at) VALUES
('n001', 'u001', 'COMMENT', 'u002', NULL, '李四 评论了你的帖子「大学四年编程学习路线总结」', 'p001', true, NOW() - INTERVAL '29 days'),
('n002', 'u001', 'LIKE', 'u003', NULL, '王五 赞了你的帖子「大学四年编程学习路线总结」', 'p001', true, NOW() - INTERVAL '28 days'),
('n003', 'u001', 'NEW_FOLLOWER', 'u009', NULL, '小明 关注了你', 'u009', true, NOW() - INTERVAL '20 days'),
('n004', 'u002', 'COMMENT', 'u005', NULL, '孙七 评论了你的帖子「二手MacBook Pro出售」', 'p002', false, NOW() - INTERVAL '2 days'),
('n005', 'u003', 'LIKE', 'u004', NULL, '赵六 赞了你的帖子「计算机网络期末复习资料分享」', 'p003', false, NOW() - INTERVAL '5 days'),
('n006', 'u001', 'SYSTEM', NULL, '系统通知', '您的帖子「毕业季」已被管理员设为精华帖', 'p009', true, NOW() - INTERVAL '1 day'),
('n007', 'u007', 'COMMENT', 'u008', NULL, '郑十 评论了你的帖子「分享一下我的桌面布置」', 'p007', false, NOW() - INTERVAL '8 days'),
('n008', 'u005', 'REPLY', 'u006', NULL, '周八 回复了你的评论', 'c013', true, NOW() - INTERVAL '4 days');

-- ============================================
-- 9. 私信会话表 (conversations) - 3条数据
-- ============================================
INSERT INTO conversations (id, type, created_at, updated_at) VALUES
('conv001', 'DIRECT', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
('conv002', 'DIRECT', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
('conv003', 'DIRECT', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours');

-- ============================================
-- 10. 会话参与者表 (conversation_participants) - 6条数据
-- ============================================
INSERT INTO conversation_participants (id, conversation_id, user_id, joined_at, last_read_at) VALUES
('cp001', 'conv001', 'u001', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
('cp002', 'conv001', 'u009', NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),
('cp003', 'conv002', 'u002', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
('cp004', 'conv002', 'u005', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
('cp005', 'conv003', 'u005', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours'),
('cp006', 'conv003', 'u006', NOW() - INTERVAL '3 days', NOW() - INTERVAL '8 hours');

-- ============================================
-- 11. 私信消息表 (messages) - 8条数据
-- ============================================
INSERT INTO messages (id, conversation_id, sender_id, content, is_read, is_deleted, read_at, created_at) VALUES
('m001', 'conv001', 'u009', '学长你好！看了你的编程学习路线文章，想请教一些问题', true, false, NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days'),
('m002', 'conv001', 'u001', '你好呀，有什么问题尽管问', true, false, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
('m003', 'conv001', 'u009', '请问大一应该重点学什么呢？感觉课程很多不知道怎么安排', true, false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days'),
('m004', 'conv001', 'u001', '大一主要把C语言和数据结构学好，这是基础中的基础', true, false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('m005', 'conv002', 'u005', '你好，看到你想买MacBook，还有吗？', true, false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days'),
('m006', 'conv002', 'u002', '还有的，你方便什么时候看货？', true, false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('m007', 'conv003', 'u006', '我可以和你组队ACM，我擅长数据结构和字符串算法', true, false, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
('m008', 'conv003', 'u005', '太好了！那我们加个微信详细聊聊？', true, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days');
