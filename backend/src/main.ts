import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

const MAX_RETRIES = 3;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [process.env.CORS_ORIGIN || "http://localhost:3000"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

function startWithRetry(attempt: number = 0) {
  bootstrap()
    .then(() => {
      console.log("Application started successfully");
    })
    .catch((error) => {
      console.error(
        `Failed to start application (attempt ${attempt + 1}/${MAX_RETRIES}):`,
        error,
      );

      if (attempt < MAX_RETRIES - 1) {
        const delay = (attempt + 1) * 2000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        setTimeout(() => startWithRetry(attempt + 1), delay);
      } else {
        console.error("Max retries reached. Exiting...");
        process.exit(1);
      }
    });
}

startWithRetry();
