import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// 对外返回用户信息统一用这个白名单：以后 User 加了敏感字段也不会被默认泄露
const userSelect = {
  id: true,
  username: true,
  email: true,
  avatar: true,
  points: true,
  balance: true,
  couponCount: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const password = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: { username: dto.username, email: dto.email, password },
        select: userSelect,
      });
    } catch (e) {
      // 唯一约束冲突（用户名/邮箱重复）由数据库兜底，避免先查后插的竞态
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('用户名或邮箱已存在');
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
    });
    return { token, user: await this.getProfile(user.id) };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }
}
