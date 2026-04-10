import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 开启 CORS
  app.enableCors({
    origin: '*',  // 生产环境应该限制具体域名
    credentials: true,
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,  // 自动剔除非 dto 属性
    forbidNonWhitelisted: true,
  }));

  // 全局异常过滤器
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3001);
  console.log('========== 财务系统后端启动成功 ==========');
  console.log('API 地址: http://localhost:3001/api');
  console.log('文档地址: (待配置 Swagger)');
  console.log('===========================================');
}
bootstrap();