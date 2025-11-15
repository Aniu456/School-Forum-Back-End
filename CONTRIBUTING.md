# 🤝 贡献指南

> 感谢你对校园论坛后端项目的关注！

我们欢迎任何形式的贡献，包括但不限于：代码贡献、文档改进、问题反馈、功能建议等。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试要求](#测试要求)
- [文档贡献](#文档贡献)
- [问题反馈](#问题反馈)

---

## 🌟 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺:

- ✅ 尊重不同的观点和经验
- ✅ 接受建设性的批评
- ✅ 关注对社区最有利的事情
- ✅ 对其他社区成员保持同理心

### 不可接受的行为

- ❌ 使用性别化的语言或图像
- ❌ 人身攻击、侮辱或贬损的评论
- ❌ 公开或私下的骚扰
- ❌ 未经许可发布他人的私人信息
- ❌ 其他不道德或不专业的行为

---

## 🚀 如何贡献

### 1. 提交 Issue

在开始编码之前，请先提交 Issue 讨论你的想法:

**问题反馈**:
- 使用清晰的标题描述问题
- 提供详细的复现步骤
- 说明预期行为和实际行为
- 附上相关的日志和截图

**功能建议**:
- 描述功能的使用场景
- 说明该功能如何改善用户体验
- 可以的话，提供设计方案或原型

### 2. Fork 项目

```bash
# 1. Fork 项目到你的 GitHub 账号

# 2. 克隆你 Fork 的仓库
git clone https://github.com/YOUR_USERNAME/school-forum-back-end.git
cd school-forum-back-end

# 3. 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/school-forum-back-end.git

# 4. 验证远程仓库
git remote -v
```

### 3. 创建分支

```bash
# 从最新的 main 分支创建特性分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 分支命名规范：
# - feature/xxx  : 新功能
# - fix/xxx      : 修复 Bug
# - docs/xxx     : 文档更新
# - refactor/xxx : 代码重构
# - test/xxx     : 测试相关
# - chore/xxx    : 构建/工具相关
```

### 4. 开发代码

参考 [开发流程](#开发流程) 部分。

### 5. 提交代码

```bash
# 1. 添加变更
git add .

# 2. 提交 (遵循提交规范)
git commit -m "feat: add user authentication"

# 3. 推送到你的仓库
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

1. 访问你的 Fork 仓库页面
2. 点击 "Pull Request" 按钮
3. 选择你的特性分支
4. 填写 PR 描述:
   - 说明这个 PR 做了什么
   - 关联相关的 Issue
   - 列出测试情况
   - 附上截图或演示 (如适用)

### 7. 代码审查

- 维护者会审查你的代码
- 根据反馈进行修改
- 保持 PR 更新 (rebase 或 merge)

### 8. 合并

审查通过后，维护者会合并你的 PR。

---

## 💻 开发流程

### 1. 环境准备

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
```

### 2. 启动开发服务器

```bash
# 启动开发模式
pnpm run start:dev

# 或调试模式
pnpm run start:debug
```

### 3. 开发功能

遵循 [代码规范](#代码规范)，参考 [开发指南](./docs/DEVELOPMENT_GUIDE.md)。

### 4. 编写测试

```bash
# 运行测试
pnpm run test

# 测试覆盖率
pnpm run test:cov

# E2E 测试
pnpm run test:e2e
```

### 5. 检查代码质量

```bash
# 代码检查
pnpm run lint

# 自动修复
pnpm run lint:fix

# 格式化代码
pnpm run format
```

### 6. 构建项目

```bash
# 编译 TypeScript
pnpm run build

# 验证构建产物
node dist/main.js
```

---

## 📝 代码规范

### TypeScript 风格

```typescript
// ✅ 使用明确的类型
interface User {
  id: string;
  username: string;
  email: string;
}

// ✅ 使用 async/await
async function getUser(id: string): Promise<User> {
  return await this.prisma.user.findUnique({ where: { id } });
}

// ✅ 使用解构
const { username, email } = user;

// ✅ 使用可选链
const userName = user?.profile?.name ?? 'Guest';

// ❌ 避免 any
function processData(data: any) { ... }  // 不推荐

// ❌ 避免嵌套回调
getData(id, function(data) {
  processData(data, function(result) {
    // ...
  });
});
```

### NestJS 最佳实践

```typescript
// ✅ 使用依赖注入
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
}

// ✅ 使用装饰器
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController { ... }

// ✅ 使用 DTO 验证
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;
}

// ✅ 使用适当的异常
if (!user) {
  throw new NotFoundException('用户不存在');
}
```

### 命名规范

```typescript
// 类名: PascalCase
class UserService { }

// 接口: PascalCase
interface CreateUserDto { }

// 方法: camelCase
async findUserById(id: string) { }

// 常量: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 私有属性: _camelCase
private _cacheService: CacheService;

// 文件名: kebab-case
// user-profile.controller.ts
// create-user.dto.ts
```

### 注释规范

```typescript
/**
 * 根据 ID 查找用户
 * @param id 用户 ID
 * @returns 用户实体
 * @throws NotFoundException 用户不存在时抛出
 */
async findById(id: string): Promise<User> {
  const user = await this.prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundException(`用户 ${id} 不存在`);
  }

  return user;
}

// 单行注释说明复杂逻辑
// 使用 bcrypt 加密密码，salt rounds 为 10
const hashedPassword = await bcrypt.hash(password, 10);
```

---

## 📋 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat(auth): add login API |
| `fix` | Bug 修复 | fix(posts): fix pagination error |
| `docs` | 文档更新 | docs: update API documentation |
| `style` | 代码格式 (不影响功能) | style: format code with prettier |
| `refactor` | 重构 (不是新功能也不是修复) | refactor(users): simplify query logic |
| `perf` | 性能优化 | perf(posts): add database index |
| `test` | 测试相关 | test(auth): add login test cases |
| `chore` | 构建/工具相关 | chore: update dependencies |
| `ci` | CI 配置 | ci: add GitHub Actions workflow |
| `revert` | 回滚提交 | revert: revert "feat: add xxx" |

### Scope 范围

指定影响的模块:

- `auth` - 认证模块
- `users` - 用户模块
- `posts` - 帖子模块
- `comments` - 评论模块
- `likes` - 点赞模块
- `notifications` - 通知模块
- `admin` - 管理模块
- `search` - 搜索模块
- `*` - 影响多个模块

### 示例

**新功能**:
```
feat(auth): add refresh token mechanism

- Implement refresh token generation
- Add /auth/refresh endpoint
- Update JWT strategy

Closes #123
```

**Bug 修复**:
```
fix(posts): fix pagination calculation error

The offset calculation was incorrect when page > 1.
Changed: offset = (page - 1) * limit

Fixes #456
```

**文档更新**:
```
docs: add API documentation for admin module

- Document all admin endpoints
- Add request/response examples
- Update CHANGELOG
```

**破坏性变更**:
```
feat(auth)!: separate admin registration endpoint

BREAKING CHANGE: POST /auth/register no longer accepts 'role' parameter.
Use POST /auth/register-admin for admin registration.

Migration guide:
- Update admin registration calls
- Add ADMIN_REGISTRATION_KEY to .env
```

---

## 🧪 测试要求

### 单元测试

每个服务和控制器都应该有对应的测试:

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findById', () => {
    it('should return a user', async () => {
      const user = { id: '1', username: 'test' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);

      const result = await service.findById('1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### E2E 测试

关键流程需要 E2E 测试:

```typescript
// auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.user.username).toBe('test');
        expect(res.body.accessToken).toBeDefined();
      });
  });
});
```

### 测试覆盖率要求

- 单元测试覆盖率 >= 80%
- E2E 测试覆盖核心功能
- 所有 PR 必须包含相应的测试

---

## 📚 文档贡献

### 文档类型

- **API 文档**: 所有接口的详细说明
- **开发指南**: 开发规范和最佳实践
- **部署文档**: 部署流程和配置说明
- **故障排查**: 常见问题和解决方案

### 文档规范

```markdown
# 标题

> 简短描述

## 二级标题

### 三级标题

内容...

**加粗重点**

`代码或命令`

\`\`\`typescript
// 代码块
const example = 'code';
\`\`\`

- 列表项 1
- 列表项 2

| 表头1 | 表头2 |
|------|------|
| 内容1 | 内容2 |
```

### 文档检查清单

- [ ] 标题结构清晰
- [ ] 内容准确无误
- [ ] 代码示例可运行
- [ ] 链接有效
- [ ] 格式统一
- [ ] 无拼写错误

---

## 🐛 问题反馈

### 反馈渠道

- **GitHub Issues**: 用于 Bug 反馈和功能请求
- **Pull Requests**: 用于代码贡献
- **Discussions**: 用于一般性讨论

### Bug 报告模板

```markdown
**Bug 描述**
简要描述遇到的问题

**复现步骤**
1. 步骤1
2. 步骤2
3. 看到错误

**期望行为**
描述期望的正确行为

**实际行为**
描述实际的错误行为

**环境信息**
- Node.js 版本:
- pnpm 版本:
- 操作系统:
- 数据库版本:

**错误日志**
\`\`\`
粘贴错误日志
\`\`\`

**截图** (可选)
附上相关截图
```

### 功能请求模板

```markdown
**功能描述**
清晰简洁地描述你想要的功能

**使用场景**
描述该功能的使用场景和受益用户

**解决方案**
描述你期望的解决方案

**替代方案** (可选)
描述你考虑过的其他解决方案

**附加信息** (可选)
其他相关信息、截图、参考链接等
```

---

## ✅ Pull Request 检查清单

提交 PR 前，请确保:

- [ ] 代码符合项目的编码规范
- [ ] 通过了所有测试 (`pnpm run test`)
- [ ] 通过了代码检查 (`pnpm run lint`)
- [ ] 编译成功 (`pnpm run build`)
- [ ] 更新了相关文档
- [ ] 添加了必要的测试
- [ ] 提交消息遵循规范
- [ ] PR 描述清晰完整
- [ ] 关联了相关的 Issue

---

## 🎖️ 贡献者

感谢所有为本项目做出贡献的开发者！

<!-- 这里会显示贡献者列表 -->

---

## 📞 联系我们

如有任何问题，欢迎通过以下方式联系:

- **GitHub Issues**: https://github.com/your-org/school-forum-back-end/issues
- **Email**: support@example.com
- **技术文档**: [完整文档索引](./docs/DOCUMENTATION_INDEX.md)

---

## 📖 相关文档

- [开发指南](./docs/DEVELOPMENT_GUIDE.md)
- [代码规范详解](./docs/DEVELOPMENT_GUIDE.md#代码规范)
- [故障排查指南](./docs/TROUBLESHOOTING.md)
- [API 文档](./docs/02-implementation/api-documentation.md)

---

<div align="center">

**🤝 再次感谢你的贡献！**

Together we build better software 🚀

Made with ❤️ by 后端开发团队

</div>
