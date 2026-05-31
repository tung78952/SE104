import { Module } from '@nestjs/common';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { RegulationsModule } from '../regulations/regulations.module';

@Module({
  imports: [RegulationsModule], // để inject RuleEngineService (DiemMin / DiemMax)
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
