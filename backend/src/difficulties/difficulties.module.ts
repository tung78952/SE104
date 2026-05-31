import { Module } from '@nestjs/common';
import { DifficultiesController } from './difficulties.controller';
import { DifficultiesService } from './difficulties.service';

@Module({
  controllers: [DifficultiesController],
  providers: [DifficultiesService],
  exports: [DifficultiesService],
})
export class DifficultiesModule {}
