
import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from 'src/common/enums/user-status.enum';

export class UpdateConsultantDto {
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Indicates whether the consultant is verified', type: Boolean })
    isVerified?: boolean;

    @IsOptional()
    @IsEnum(UserStatus)
    @ApiPropertyOptional({ description: 'Status of the user', enum: UserStatus })
    status?: UserStatus;
}

