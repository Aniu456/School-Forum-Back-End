import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { ResetUserPasswordDto } from '../admin/dto/reset-user-password.dto';
import { UpdateUserRoleDto } from '../admin/dto/update-user-role.dto';
import { ToggleUserPermissionDto } from '../admin/dto/toggle-user-permission.dto';
import { BulkDeleteDto } from '../admin/dto/bulk-delete.dto';
import { CurrentUser } from '../core/common/decorators/current-user.decorator';
import { Roles } from '../core/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  /**
   * 获取用户列表（管理员）
   * GET /admin/users
   */
  @Roles(Role.ADMIN)
  @Get('admin/users')
  async getUsers(
    @CurrentUser('id') currentUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('role') role?: Role,
    @Query('isBanned') isBanned?: string,
  ) {
    // 转换 isBanned 参数
    let isBannedBool: boolean | undefined;
    if (isBanned === 'true') {
      isBannedBool = true;
    } else if (isBanned === 'false') {
      isBannedBool = false;
    }

    return this.adminService.getUsers(currentUserId, page, limit, role, isBannedBool);
  }

  /**
   * 封禁用户（管理员）
   * POST /admin/users/:id/ban
   */
  @Roles(Role.ADMIN)
  @Post('admin/users/:id/ban')
  @HttpCode(HttpStatus.OK)
  async banUser(@Param('id') userId: string) {
    return this.adminService.banUser(userId);
  }

  /**
   * 解封用户（管理员）
   * POST /admin/users/:id/unban
   */
  @Roles(Role.ADMIN)
  @Post('admin/users/:id/unban')
  @HttpCode(HttpStatus.OK)
  async unbanUser(@Param('id') userId: string) {
    return this.adminService.unbanUser(userId);
  }

  /**
   * 获取系统统计数据（管理员）
   * GET /admin/statistics
   * GET /admin/statistics/overview (别名)
   */
  @Roles(Role.ADMIN)
  @Get('admin/statistics')
  async getStatistics() {
    return this.adminService.getStatistics();
  }

  @Roles(Role.ADMIN)
  @Get('admin/statistics/overview')
  async getStatisticsOverview() {
    return this.adminService.getStatistics();
  }

  /**
   * 删除用户（管理员）
   * DELETE /admin/users/:id
   */
  @Roles(Role.ADMIN)
  @Delete('admin/users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  /**
   * 删除单条评论（管理员）
   * DELETE /admin/comments/:id
   */
  @Roles(Role.ADMIN)
  @Delete('admin/comments/:id')
  @HttpCode(HttpStatus.OK)
  async deleteComment(@Param('id') commentId: string) {
    return this.adminService.deleteComment(commentId);
  }

  // ============================================
  // 用户管理新增功能
  // ============================================

  /**
   * 重置用户密码（管理员）
   * POST /admin/users/:id/reset-password
   */
  @Roles(Role.ADMIN)
  @Post('admin/users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetUserPassword(
    @Param('id') userId: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.adminService.resetUserPassword(userId, dto.newPassword);
  }

  /**
   * 修改用户角色（管理员）
   * PATCH /admin/users/:id/role
   */
  @Roles(Role.ADMIN)
  @Patch('admin/users/:id/role')
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto.role);
  }

  /**
   * 查看用户登录历史（管理员）
   * GET /admin/users/:id/login-history
   */
  @Roles(Role.ADMIN)
  @Get('admin/users/:id/login-history')
  async getUserLoginHistory(
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getUserLoginHistory(userId, page, limit);
  }

  /**
   * 禁止/允许用户发帖（管理员）
   * POST /admin/users/:id/toggle-post-permission
   */
  @Roles(Role.ADMIN)
  @Post('admin/users/:id/toggle-post-permission')
  @HttpCode(HttpStatus.OK)
  async togglePostPermission(
    @Param('id') userId: string,
    @Body() dto: ToggleUserPermissionDto,
  ) {
    return this.adminService.togglePostPermission(userId, dto.canPost ?? true);
  }

  /**
   * 禁止/允许用户评论（管理员）
   * POST /admin/users/:id/toggle-comment-permission
   */
  @Roles(Role.ADMIN)
  @Post('admin/users/:id/toggle-comment-permission')
  @HttpCode(HttpStatus.OK)
  async toggleCommentPermission(
    @Param('id') userId: string,
    @Body() dto: ToggleUserPermissionDto,
  ) {
    return this.adminService.toggleCommentPermission(
      userId,
      dto.canComment ?? true,
    );
  }

  // ============================================
  // 内容管理新增功能
  // ============================================

  /**
   * 获取帖子详情（管理员）
   * GET /admin/posts/:id
   */
  @Roles(Role.ADMIN)
  @Get('admin/posts/:id')
  async getPostDetail(@Param('id') postId: string) {
    return this.adminService.getPostDetail(postId);
  }

  /**
   * 获取帖子列表（管理员）
   * GET /admin/posts
   */
  @Roles(Role.ADMIN)
  @Get('admin/posts')
  async getPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('isPinned') isPinned?: string,
    @Query('isHighlighted') isHighlighted?: string,
    @Query('keyword') keyword?: string,
    @Query('authorId') authorId?: string,
    @Query('tag') tag?: string,
  ) {
    return this.adminService.getPosts(
      page,
      limit,
      isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
      isHighlighted === 'true'
        ? true
        : isHighlighted === 'false'
          ? false
          : undefined,
      keyword,
      authorId,
      tag,
    );
  }

  /**
   * 获取评论列表（管理员）
   * GET /admin/comments
   */
  @Roles(Role.ADMIN)
  @Get('admin/comments')
  async getComments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('authorId') authorId?: string,
    @Query('postId') postId?: string,
  ) {
    return this.adminService.getComments(page, limit, keyword, authorId, postId);
  }

  /**
   * 置顶帖子（管理员）
   * POST /admin/posts/:id/pin
   */
  @Roles(Role.ADMIN)
  @Post('admin/posts/:id/pin')
  @HttpCode(HttpStatus.OK)
  async pinPost(@Param('id') postId: string) {
    return this.adminService.pinPost(postId);
  }

  /**
   * 取消置顶帖子（管理员）
   * DELETE /admin/posts/:id/pin
   */
  @Roles(Role.ADMIN)
  @Delete('admin/posts/:id/pin')
  async unpinPost(@Param('id') postId: string) {
    return this.adminService.unpinPost(postId);
  }

  /**
   * 加精华（管理员）
   * POST /admin/posts/:id/highlight
   */
  @Roles(Role.ADMIN)
  @Post('admin/posts/:id/highlight')
  @HttpCode(HttpStatus.OK)
  async highlightPost(@Param('id') postId: string) {
    return this.adminService.highlightPost(postId);
  }

  /**
   * 取消精华（管理员）
   * DELETE /admin/posts/:id/highlight
   */
  @Roles(Role.ADMIN)
  @Delete('admin/posts/:id/highlight')
  async unhighlightPost(@Param('id') postId: string) {
    return this.adminService.unhighlightPost(postId);
  }

  /**
   * 锁定帖子（禁止评论）（管理员）
   * POST /admin/posts/:id/lock
   */
  @Roles(Role.ADMIN)
  @Post('admin/posts/:id/lock')
  @HttpCode(HttpStatus.OK)
  async lockPost(@Param('id') postId: string) {
    return this.adminService.lockPost(postId);
  }

  /**
   * 解锁帖子（管理员）
   * DELETE /admin/posts/:id/lock
   */
  @Roles(Role.ADMIN)
  @Delete('admin/posts/:id/lock')
  async unlockPost(@Param('id') postId: string) {
    return this.adminService.unlockPost(postId);
  }

  /**
   * 隐藏帖子（管理员）
   * POST /admin/posts/:id/hide
   */
  @Roles(Role.ADMIN)
  @Post('admin/posts/:id/hide')
  @HttpCode(HttpStatus.OK)
  async hidePost(@Param('id') postId: string) {
    return this.adminService.hidePost(postId);
  }

  /**
   * 取消隐藏帖子（管理员）
   * POST /admin/posts/:id/unhide
   */
  @Roles(Role.ADMIN)
  @Post('admin/posts/:id/unhide')
  @HttpCode(HttpStatus.OK)
  async unhidePost(@Param('id') postId: string) {
    return this.adminService.unhidePost(postId);
  }

  /**
   * 批量删除帖子（管理员）
   * POST /admin/posts/bulk-delete
   */
  @Roles(Role.ADMIN)
  @Post('admin/posts/bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDeletePosts(@Body() dto: BulkDeleteDto) {
    return this.adminService.bulkDeletePosts(dto.ids);
  }

  /**
   * 批量删除评论（管理员）
   * POST /admin/comments/bulk-delete
   */
  @Roles(Role.ADMIN)
  @Post('admin/comments/bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDeleteComments(@Body() dto: BulkDeleteDto) {
    return this.adminService.bulkDeleteComments(dto.ids);
  }
}
