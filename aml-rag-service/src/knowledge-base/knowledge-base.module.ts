import { Module } from '@nestjs/common';
import { EmbeddingModule } from '../embedding/embedding.module';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';

@Module({
  imports: [EmbeddingModule],
  providers: [KnowledgeBaseService],
  controllers: [KnowledgeBaseController],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
