import { Module } from '@nestjs/common';
import { RegulationsController } from './regulations.controller';
import { RegulationsService } from './regulations.service';
import { RuleEngineService } from './rule-engine.service';

@Module({
  controllers: [RegulationsController],
  providers: [RegulationsService, RuleEngineService],
  exports: [RuleEngineService],
})
export class RegulationsModule {}
