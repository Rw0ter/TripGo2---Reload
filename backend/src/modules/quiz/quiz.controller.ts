import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuizService } from './quiz.service';
import { CheckQuizDto } from './dto/check-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @ApiOperation({ summary: '知识小课堂答题卡列表' })
  findAll() {
    return this.quizService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '答题卡详情（含题目，不含正确答案）' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.findOne(id);
  }

  @Post(':id/check')
  @ApiOperation({ summary: '逐题校验（返回该题对错与正确答案）' })
  check(@Param('id', ParseIntPipe) id: number, @Body() dto: CheckQuizDto) {
    return this.quizService.check(id, dto.questionIndex, dto.choice);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交全部答案，服务端判分并发积分' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizService.submit(id, userId, dto.answers);
  }
}
