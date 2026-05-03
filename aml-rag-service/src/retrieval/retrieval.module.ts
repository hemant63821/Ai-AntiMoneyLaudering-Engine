import { Module } from '@nestjs/common';
import { EmbeddingModule } from '../embedding/embedding.module';
import { RetrievalService } from './retrieval.service';
import { RetrievalController } from './retrieval.controller';

@Module({
  imports: [EmbeddingModule],
  providers: [RetrievalService],
  controllers: [RetrievalController],
  exports: [RetrievalService],
})
export class RetrievalModule {}
