export class UserActivityDto {
    userId: string;
    recentPosts?: any[];
    recentComments?: any[];
    recentLikes?: any[];
    favorites?: any[];
    following?: any[];
    followers?: any[];
}

export class UserActivityQueryDto {
    type?: 'posts' | 'comments' | 'likes' | 'favorites' | 'following' | 'followers';
    page?: number;
    limit?: number;
}
