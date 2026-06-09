import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

// 岭南文化题库（按 quiz tag 匹配对应题目组）
const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  '粤剧': [
    { q: '粤剧被列入联合国教科文组织人类非物质文化遗产代表作名录是在哪一年？', options: ['2006年', '2009年', '2012年', '2015年'], answer: 1 },
    { q: '粤剧的表演语言主要是？', options: ['普通话', '英语', '粤语', '客家话'], answer: 2 },
    { q: '以下哪个是粤剧经典剧目？', options: ['《帝女花》', '《牡丹亭》', '《长生殿》', '《桃花扇》'], answer: 0 },
  ],
  '广绣': [
    { q: '广绣与潮绣合称为？', options: ['粤绣', '湘绣', '蜀绣', '苏绣'], answer: 0 },
    { q: '以下哪项是广绣的代表性针法？', options: ['乱针绣', '钉金绣', '十字绣', '缎面绣'], answer: 1 },
    { q: '广绣作品《岭南锦绣》现藏于？', options: ['广东省博物馆', '故宫博物院', '中国美术馆', '广州艺术博物院'], answer: 0 },
  ],
  '醒狮': [
    { q: '广东醒狮又被称为？', options: ['北狮', '南狮', '西狮', '东狮'], answer: 1 },
    { q: '醒狮中"采青"的含义是？', options: ['采摘青菜', '采撷好运和财富', '采集青色颜料', '一种舞蹈动作'], answer: 1 },
    { q: '佛山醒狮中，传统的狮头制作主要材料是？', options: ['塑料和铁丝', '竹篾和纸', '木头和布', '金属和皮革'], answer: 1 },
  ],
  '工夫茶': [
    { q: '潮汕工夫茶中"关公巡城"指的是？', options: ['煮水方式', '斟茶手法', '茶叶品种', '茶具名称'], answer: 1 },
    { q: '工夫茶常用的茶叶是？', options: ['绿茶', '红茶', '乌龙茶（凤凰单丛）', '白茶'], answer: 2 },
    { q: '潮汕工夫茶一般几个杯子？', options: ['2个', '3个', '4个', '6个'], answer: 1 },
  ],
  '龙舟': [
    { q: '广东端午节赛龙舟的习俗与纪念谁有关？', options: ['李白', '孔子', '屈原', '关羽'], answer: 2 },
    { q: '以下哪项是广东著名的龙舟赛事？', options: ['广州国际龙舟邀请赛', '上海龙舟赛', '北京龙舟节', '成都龙舟会'], answer: 0 },
    { q: '传统龙舟上，负责指挥节奏的人称为？', options: ['舵手', '鼓手', '旗手', '锣手'], answer: 1 },
  ],
};

function fallbackQuestions(title: string): QuizQuestion[] {
  return [
    { q: `${title}是岭南文化的瑰宝，以下哪项描述最准确？`, options: ['一种传统艺术形式', '一种美食', '一种建筑风格', '一种方言'], answer: 0 },
    { q: `关于${title}，以下说法正确的是？`, options: ['它起源于明清时期', '它是近代才出现的', '它源自北方地区', '它已被遗忘'], answer: 0 },
    { q: `保护${title}这类非物质文化遗产的意义在于？`, options: ['仅仅为了旅游', '传承中华优秀传统文化', '只是为了赚钱', '没有实际意义'], answer: 1 },
  ];
}

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.quiz.findMany({ orderBy: { sort: 'asc' } });
  }

  // 取 quiz 及其题目（含正确答案，仅服务端内部使用）。
  private async getQuizWithAnswers(id: number) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('答题卡不存在');
    const questions = QUESTION_BANK[quiz.tag] ?? fallbackQuestions(quiz.title);
    return { quiz, questions };
  }

  // 答题卡详情：下发题目时剥离 answer，避免前端直接拿到答案作弊。
  async findOne(id: number) {
    const { quiz, questions } = await this.getQuizWithAnswers(id);
    return {
      ...quiz,
      questions: questions.map(({ answer: _answer, ...rest }) => rest),
    };
  }

  // 逐题校验：返回该题是否答对 + 正确答案（供 UI 即时高亮）。
  async check(id: number, questionIndex: number, choice: number) {
    const { questions } = await this.getQuizWithAnswers(id);
    if (questionIndex < 0 || questionIndex >= questions.length) {
      throw new BadRequestException('题目序号越界');
    }
    const answer = questions[questionIndex].answer;
    return { correct: choice === answer, answer };
  }

  // 提交全部答案：服务端权威判分 + 按答对数发积分（每题 10 分）。
  async submit(id: number, userId: string, answers: number[]) {
    const { questions } = await this.getQuizWithAnswers(id);
    let correct = 0;
    questions.forEach((qst, i) => {
      if (answers[i] === qst.answer) correct += 1;
    });
    const score = correct * 10;
    if (score > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { points: { increment: score } },
      });
    }
    return { total: questions.length, correct, score };
  }
}
