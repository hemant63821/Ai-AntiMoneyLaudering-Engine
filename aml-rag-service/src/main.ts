import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // ── TCP Microservice transport ────────────────────────────────────────────
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: "0.0.0.0",
      port: parseInt(process.env.MICROSERVICE_PORT || "3001", 10),
    },
  });

  // ── Swagger ───────────────────────────────────────────────────────────────
  const swaggerDoc = new DocumentBuilder()
    .setTitle("AML RAG Service — Layer 3")
    .setDescription(
      "Embeds transaction patterns as vectors and retrieves semantically similar " +
        "AML typologies, FATF guidance, and historical SAR cases from the Pinecone knowledge base.",
    )
    .setVersion("1.0")
    .addTag("RAG Retrieval")
    .addTag("Knowledge Base")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup("docs", app, document);

  await app.startAllMicroservices();

  const port = parseInt(process.env.PORT || "3000", 10);
  await app.listen(port);
  console.log(`AML RAG Service running on http://localhost:${port}`);
  console.log(`  Swagger UI:   http://localhost:${port}/docs`);
  console.log(
    `  Microservice: tcp://localhost:${process.env.MICROSERVICE_PORT || 3001}`,
  );
}

bootstrap();
