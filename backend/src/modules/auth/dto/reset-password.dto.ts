import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'alice', description: '用户名' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'alice@example.com', description: '注册邮箱（用于身份核验）' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'newpass123', description: '新密码，6–72 位' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  newPassword: string;
}
