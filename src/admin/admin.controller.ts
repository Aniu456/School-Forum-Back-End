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
import { AdminService } from './admin.service';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ToggleUserPermissionDto } from './dto/toggle-user-permission.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, ReportStatus, ReportTarget } from '@prisma/client';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  /**
   * 创建举报
   * POST /reports
   */
  @Post('reports')
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.adminService.createReport(userId, createReportDto);
  }

  /**
   * 获取举报列表（管理员）
   * GET /admin/reports
   */
  @Roles(Role.ADMIN)
  @Get('admin/reports')
  async getReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: ReportStatus,
    @Query('targetType') targetType?: ReportTarget,
  ) {
    return this.adminService.getReports(page, limit, status, targetType);
  }

  /**
   * 处理举报（管理员）
   * PATCH /admin/reports/:id
   */
  @Roles(Role.ADMIN)
  @Patch('admin/reports/:id')
  async handleReport(
    @Param('id') reportId: string,
    @CurrentUser('id') handlerId: string,
    @Body() handleReportDto: HandleReportDto,
  ) {
    return this.adminService.handleReport(reportId, handlerId, handleReportDto);
  }

  /**
   * 获取用户列表（管理员）
   * GET /admin/users
   */
  @Roles(Role.ADMIN)
  @Get('admin/users')
  async getUsers(
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

    return this.adminService.getUsers(page, limit, role, isBannedBool);
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
   */
  @Roles(Role.ADMIN)
  @Get('admin/statistics')
  async getStatistics() {
    return this.adminService.getStatistics();
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
