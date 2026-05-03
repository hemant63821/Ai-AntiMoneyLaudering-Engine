import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './common/config/configuration';
import { PineconeModule } from './pinecone/pinecone.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    PineconeModule,
    EmbeddingModule,
    RetrievalModule,
    KnowledgeBaseModule,
    HealthModule,
  ],
})
export class AppModule {}
