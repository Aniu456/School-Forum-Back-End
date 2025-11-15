import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { HandleReportDto } from './dto/handle-report.dto';
import { ReportStatus, Role, ReportTarget } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建举报
   */
  async createReport(userId: string, createReportDto: CreateReportDto) {
    const { targetId, targetType, reason } = createReportDto;

    // 验证被举报的目标是否存在
    await this.validateTarget(targetId, targetType);

    // 检查是否已经举报过
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reporterId: userId,
        targetId,
        targetType,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new BadRequestException('您已经举报过此内容，请勿重复举报');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId: userId,
        targetId,
        targetType,
        reason,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    return report;
  }

  /**
   * 获取举报列表（管理员）
   */
  async getReports(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus,
    targetType?: ReportTarget,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (targetType) {
      where.targetType = targetType;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
          handler: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 处理举报（管理员）
   */
  async handleReport(
    reportId: string,
    handlerId: string,
    handleReportDto: HandleReportDto,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('举报记录不存在');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('该举报已被处理');
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: handleReportDto.status,
        handlerId,
        handleNote: handleReportDto.handleNote,
        handledAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
        handler: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    // 如果举报被批准，执行相应的处理
    if (handleReportDto.status === ReportStatus.APPROVED) {
      await this.handleApprovedReport(report.targetId, report.targetType);
    }

    return updatedReport;
  }

  /**
   * 获取用户列表（管理员）
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
    role?: Role,
    isBanned?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (isBanned !== undefined) {
      where.isBanned = isBanned;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          studentId: true,
          nickname: true,
          avatar: true,
          role: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        ...user,
        postCount: user._count.posts,
        commentCount: user._count.comments,
        _count: undefined,
      })),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 封禁用户（管理员）
   */
  async banUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('不能封禁管理员');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
      },
    });

    return { message: '用户已被封禁' };
  }

  /**
   * 解封用户（管理员）
   */
  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
      },
    });

    return { message: '用户已被解封' };
  }

  /**
   * 获取系统统计数据（管理员）
   */
  async getStatistics() {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalReports,
      pendingReports,
      bannedUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count({ where: { isDeleted: false } }),
      this.prisma.comment.count({ where: { isDeleted: false } }),
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.user.count({ where: { isBanned: true } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalComments,
      totalReports,
      pendingReports,
      bannedUsers,
    };
  }

  /**
   * 验证目标是否存在
   */
  private async validateTarget(targetId: string, targetType: ReportTarget) {
    if (targetType === ReportTarget.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });
      if (!post || post.isDeleted) {
        throw new NotFoundException('帖子不存在');
      }
    } else if (targetType === ReportTarget.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
      });
      if (!comment || comment.isDeleted) {
        throw new NotFoundException('评论不存在');
      }
    } else if (targetType === ReportTarget.USER) {
      const user = await this.prisma.user.findUnique({
        where: { id: targetId },
      });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
    }
  }

  /**
   * 处理已批准的举报
   */
  private async handleApprovedReport(
    targetId: string,
    targetType: ReportTarget,
  ) {
    // 根据举报类型执行相应的处理
    if (targetType === ReportTarget.POST) {
      // 软删除帖子
      await this.prisma.post.update({
        where: { id: targetId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    } else if (targetType === ReportTarget.COMMENT) {
      // 软删除评论
      await this.prisma.comment.update({
        where: { id: targetId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    } else if (targetType === ReportTarget.USER) {
      // 封禁用户
      await this.banUser(targetId);
    }
  }
}
