import { Controller, Post, Body } from '@nestjs/common';
import { LikesService } from './likes.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator';
import { Public } from '../../../core/common/decorators/public.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

  /**
   * 点赞/取消点赞
   * POST /likes/toggle
   */
  @Post('toggle')
  async toggle(
    @CurrentUser('id') userId: string,
    @Body() toggleLikeDto: ToggleLikeDto,
  ) {
    return this.likesService.toggle(userId, toggleLikeDto);
  }
}
