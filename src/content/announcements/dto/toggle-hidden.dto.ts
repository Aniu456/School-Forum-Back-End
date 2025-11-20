import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleHiddenDto {
    @IsNotEmpty()
    @IsBoolean()
    isHidden: boolean;
}
