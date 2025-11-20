/**
 * 服务中心标签常量
 */
export const SERVICE_CENTER_TAGS = {
    CLUB_RECRUITMENT: '社团招新',
    LOST_AND_FOUND: '失物招领',
    CARPOOL: '拼车拼单',
    SECONDHAND: '二手交易',
    STUDY_RESOURCE: '学习资源',
} as const;

export type ServiceCenterTag = typeof SERVICE_CENTER_TAGS[keyof typeof SERVICE_CENTER_TAGS];

/**
 * 所有服务中心标签列表
 */
export const SERVICE_CENTER_TAG_LIST = Object.values(SERVICE_CENTER_TAGS);

/**
 * 检查是否为服务中心标签
 */
export function isServiceCenterTag(tag: string): tag is ServiceCenterTag {
    return SERVICE_CENTER_TAG_LIST.includes(tag as ServiceCenterTag);
}

/**
 * 服务中心分类映射（用于前端展示）
 */
export const SERVICE_CENTER_CATEGORIES = [
    {
        key: 'CLUB_RECRUITMENT',
        label: '社团招新',
        tag: SERVICE_CENTER_TAGS.CLUB_RECRUITMENT,
        description: '校园社团招募新成员',
    },
    {
        key: 'LOST_AND_FOUND',
        label: '失物招领',
        tag: SERVICE_CENTER_TAGS.LOST_AND_FOUND,
        description: '失物寻找和拾物招领',
    },
    {
        key: 'CARPOOL',
        label: '拼车拼单',
        tag: SERVICE_CENTER_TAGS.CARPOOL,
        description: '拼车出行和团购拼单',
    },
    {
        key: 'SECONDHAND',
        label: '二手交易',
        tag: SERVICE_CENTER_TAGS.SECONDHAND,
        description: '二手物品买卖交换',
    },
    {
        key: 'STUDY_RESOURCE',
        label: '学习资源',
        tag: SERVICE_CENTER_TAGS.STUDY_RESOURCE,
        description: '学习资料和资源分享',
    },
];
