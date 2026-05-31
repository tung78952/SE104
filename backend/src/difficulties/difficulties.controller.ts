import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DifficultiesService } from './difficulties.service';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';
import { UpdateDifficultyDto } from './dto/update-difficulty.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('difficulties')
@ApiBearerAuth('access-token')
@Controller('difficulties')
@UseGuards(AuthGuard, RolesGuard)
export class DifficultiesController {
  constructor(private readonly service: DifficultiesService) {}

  // BM1: dropdown độ khó — cả giảng viên và admin đều cần
  @Get()
  @Roles('admin', 'giaovien')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateDifficultyDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDifficultyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
