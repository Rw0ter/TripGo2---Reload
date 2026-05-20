import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'alice', description: '用户名，2–20 位' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username: string;

  @ApiProperty({ example: 'alice@example.com', description: '邮箱' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: '密码，6–72 位' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}
