import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS (Quan trọng khi kết nối với React Frontend)
  app.enableCors({
    origin: 'http://localhost:3000', // Sửa lại đúng port của frontend React
    credentials: true, // Cho phép đính kèm cookie
  });

  // Kích hoạt Validation toàn cục
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Tự động loại bỏ các thuộc tính không được khai báo trong DTO
    transform: true, // Cho phép class-transformer (@Type) áp dụng cho nested DTO
  }));

  // Kích hoạt cookie parser để đọc refresh token
  app.use(cookieParser());

  // Swagger UI tại /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hệ thống Quản lý Ra đề và Chấm thi (SE104)')
    .setDescription('API documentation cho đồ án SE104 — UIT')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(5001);
  console.log('Server đang chạy tại: http://localhost:5001');
  console.log('Swagger docs: http://localhost:5001/api/docs');
}
bootstrap();
