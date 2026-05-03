import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RetrievalService } from './retrieval.service';
import { RetrieveContextDto, RAGResponseDto } from './dto/retrieve-context.dto';
import { KnowledgeSource } from '../common/types/aml.types';

@ApiTags('RAG Retrieval')
@Controller('retrieval')
export class RetrievalController {
  constructor(private readonly retrieval: RetrievalService) {}

  @Post('context')
  @ApiOperation({
    summary: 'Retrieve AML context for a transaction pattern',
    description:
      'Embeds the transaction pattern and returns top-K matching typologies, ' +
      'regulatory guidance, and SAR precedents from the Pinecone knowledge base.',
  })
  async retrieveContext(@Body() dto: RetrieveContextDto): Promise<RAGResponseDto> {
    return this.retrieval.retrieveContext(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Ad-hoc similarity search within a specific namespace' })
  @ApiQuery({ name: 'q', description: 'Free-text search query' })
  @ApiQuery({ name: 'namespace', enum: KnowledgeSource })
  @ApiQuery({ name: 'topK', required: false, type: Number })
  async search(
    @Query('q') q: string,
    @Query('namespace') namespace: KnowledgeSource,
    @Query('topK') topK = 5,
  ) {
    return this.retrieval.similaritySearch(q, namespace, Number(topK));
  }

  // ── Microservice message patterns (TCP transport) ─────────────────────────

  @MessagePattern('aml.retrieve_context')
  async handleRetrieveContext(@Payload() dto: RetrieveContextDto): Promise<RAGResponseDto> {
    return this.retrieval.retrieveContext(dto);
  }

  @MessagePattern('aml.similarity_search')
  async handleSimilaritySearch(
    @Payload() payload: { text: string; namespace: KnowledgeSource; topK?: number },
  ) {
    return this.retrieval.similaritySearch(payload.text, payload.namespace, payload.topK);
  }
}
