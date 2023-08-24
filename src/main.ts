import { NestFactory } from "@nestjs/core";
import { SwaggerInit } from "./util/SwaggerConfig";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./util/http-exception.filter";

// TODO: Add SDKs for Firebase products that you want to use
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();

  app.setGlobalPrefix("/");
  if (process.env.NODE_ENV === "development") {
    app.enableCors({
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders: "*",
    });
  }

  SwaggerInit.init(app);
  await app.listen(4000);
  console.log(`Application is running on: ${4000}`);
  console.log(`Swagger Docomentation On: ${await app.getUrl()}/api/v1/docs`);
}

bootstrap();
