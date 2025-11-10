import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({ example: 'testmail@gmail.com' })
    email: string;

    @ApiProperty({ example: 'Password@123' })
    password: string;
}