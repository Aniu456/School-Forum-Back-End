import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class BulkDeleteDto {
    @IsArray()
    @ArrayNotEmpty({ message: 'ID 数组不能为空' })
    @IsString({ each: true })
    ids: string[];
}
