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

// 绿色低碳 / 环保科学题库（按 quiz.tag 匹配题组；与 prisma seed 的 quizzes.tag 一一对应）。
const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  碳积分专场: [
    { q: '「碳达峰」指的是什么？', options: ['二氧化碳排放量翻倍', '二氧化碳排放量达到峰值后转入下降', '彻底停止使用电力', '碳排放永久归零'], answer: 1 },
    { q: '我国「碳中和」目标的时间节点是？', options: ['2030 年前', '2060 年前', '2045 年前', '2080 年前'], answer: 1 },
    { q: '下列出行方式中，单位里程碳排放通常最低的是？', options: ['私家车', '飞机', '步行或骑自行车', '出租车'], answer: 2 },
    { q: '「碳足迹」指的是？', options: ['鞋底沾的碳灰', '森林的总面积', '个人或产品全生命周期产生的温室气体总量', '煤炭的储量'], answer: 2 },
    { q: '下列哪种做法最不利于节能减排？', options: ['随手关灯', '家用电器长期待机不断电', '绿色出行', '一水多用'], answer: 1 },
  ],
  趣味问答: [
    { q: '下列属于「可回收物」的是？', options: ['剩饭剩菜', '废报纸和塑料瓶', '废旧电池', '用过的餐巾纸'], answer: 1 },
    { q: '废旧电池、过期药品应投入哪类垃圾？', options: ['厨余垃圾', '可回收物', '有害垃圾', '其他垃圾'], answer: 2 },
    { q: '果皮、菜叶、剩饭属于？', options: ['可回收物', '厨余（湿）垃圾', '有害垃圾', '其他垃圾'], answer: 1 },
    { q: '用过的纸巾、烟头通常属于？', options: ['可回收物', '有害垃圾', '其他（干）垃圾', '厨余垃圾'], answer: 2 },
    { q: '推行垃圾分类最主要的意义是？', options: ['增加垃圾总量', '促进资源回收、减少环境污染', '让分类更麻烦', '没有实际意义'], answer: 1 },
  ],
  进阶挑战: [
    { q: '被称为「地球之肺」的生态系统是？', options: ['沙漠', '森林', '城市', '农田'], answer: 1 },
    { q: '被称为「地球之肾」、能净化水质的生态系统是？', options: ['草原', '雪山', '湿地', '戈壁'], answer: 2 },
    { q: '「生物多样性」指的是？', options: ['动物园里动物的数量', '物种、基因与生态系统的丰富程度', '植物的平均高度', '单一物种的数量'], answer: 1 },
    { q: '下列有利于保护生物多样性的行为是？', options: ['滥砍滥伐', '过度捕捞', '保护自然栖息地', '随意引入外来物种'], answer: 2 },
    { q: '近年珊瑚礁大面积「白化」的主要原因是？', options: ['海水温度持续升高', '阳光不足', '鱼类过多', '海水变淡'], answer: 0 },
  ],
  能源专场: [
    { q: '下列属于可再生能源的是？', options: ['煤炭', '石油', '太阳能', '天然气'], answer: 2 },
    { q: '风力发电主要利用的是？', options: ['风的动能', '地热', '潮汐', '核裂变'], answer: 0 },
    { q: '利用江河水流落差发电的方式是？', options: ['火力发电', '水力发电', '燃气发电', '燃油发电'], answer: 1 },
    { q: '光伏发电是把什么直接转化为电能？', options: ['热水', '光能', '煤炭', '风'], answer: 1 },
    { q: '下列能源在使用过程中基本不排放二氧化碳的是？', options: ['燃煤', '燃油', '风能', '天然气'], answer: 2 },
  ],
};

// 未匹配到 tag 时的通用绿色低碳兜底题，避免无题可答。
function fallbackQuestions(_title: string): QuizQuestion[] {
  return [
    { q: '主要的温室气体是？', options: ['氧气', '二氧化碳', '氮气', '氢气'], answer: 1 },
    { q: '全球气候变暖的主要原因是？', options: ['火山喷发', '太阳活动', '人类活动排放温室气体', '地球公转'], answer: 2 },
    { q: '下列哪种做法更低碳环保？', options: ['使用一次性餐具', '自带购物袋', '过度包装商品', '长明灯彻夜不关'], answer: 1 },
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
