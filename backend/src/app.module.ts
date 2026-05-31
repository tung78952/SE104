import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RegulationsModule } from './regulations/regulations.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { DifficultiesModule } from './difficulties/difficulties.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';
import { GradesModule } from './grades/grades.module';
import { ReportsModule } from './reports/reports.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    RegulationsModule,
    SubjectsModule,
    ClassesModule,
    StudentsModule,
    DifficultiesModule,
    QuestionsModule,
    ExamsModule,
    GradesModule,
    ReportsModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
