import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { RegulationsModule } from '../regulations/regulations.module';

@Module({
  imports: [RegulationsModule], // để inject RuleEngineService (đọc SoCauToiDa, ThoiLuongMin/Max)
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
