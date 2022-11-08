import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { WebSocketAdapter } from "./ws/websocket.adapter";

(async () => {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.enableShutdownHooks();
    app.useWebSocketAdapter(new WebSocketAdapter(app));
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        validateCustomDecorators: true,
      })
    );
    await app.listen(3000, "0.0.0.0");
  } catch (e) {
    console.error("Nest application failed.", e);
    process.exit(1);
  }
})();
