import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('subjects')
@ApiBearerAuth('access-token')
@Controller('subjects')
@UseGuards(AuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Get()
  @Roles('admin', 'giaovien')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.service.findAll(+page, +limit, search);
  }

  @Get(':maMon')
  @Roles('admin', 'giaovien')
  findOne(@Param('maMon') maMon: string) {
    return this.service.findOne(maMon);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateSubjectDto) {
    return this.service.create(dto);
  }

  @Patch(':maMon')
  @Roles('admin')
  update(@Param('maMon') maMon: string, @Body() dto: UpdateSubjectDto) {
    return this.service.update(maMon, dto);
  }

  @Delete(':maMon')
  @Roles('admin')
  remove(@Param('maMon') maMon: string) {
    return this.service.remove(maMon);
  }
}
