import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { parseJsonArray } from '../filters/json-array.transform';

export class PaginationDto {
    @ApiPropertyOptional({ example: 1, description: 'Page number (default: 1)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Items per page (default: 10)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ example: 'john', description: 'Search term for name or email' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: 'CONSULTANT', description: 'Role filter (CONSULTANT / USER)', default: 'CONSULTANT' })
    @IsOptional()
    @IsString()
    role?: string;

    @ApiPropertyOptional({ example: 'ACTIVE', description: 'User status filter' })
    @IsOptional()
    @IsString()
    status?: string;
}
export class searchDto {
    @ApiPropertyOptional({ description: 'Search' })
    @IsOptional()
    search?: string;

}


export class GetConsultantsQueryDto {
    @ApiPropertyOptional({ example: 1, description: 'Page number (default: 1)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Items per page (default: 10)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ example: 'john', description: 'Search by consultant name' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        type: String,
        example: "['Angular','React']",
        description: 'Filter by skills (e.g. ["Angular","React"])',
    })
    @IsOptional()
    @Transform((params) => parseJsonArray(params, (v) => String(v).trim()))
    skills?: string[];

    @ApiPropertyOptional({
        type: String,
        example: '[1,2,3]',
        description: 'Filter by specialty IDs (e.g. [1,2,3])',
    })
    @IsOptional()
    @Transform((params) => parseJsonArray(params, (v) => Number(v)))
    specialtyId?: number[];
}


