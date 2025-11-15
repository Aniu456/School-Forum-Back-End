import {
  Controller,
  Get,
  Post,
  Patch,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, ReportStatus, ReportTarget } from '@prisma/client';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
