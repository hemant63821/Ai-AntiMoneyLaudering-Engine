import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KnowledgeBaseService } from './knowledge-base.service';
import { IngestDocumentDto, IngestResponseDto } from './dto/ingest-document.dto';

@ApiTags('Knowledge Base')
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly kb: KnowledgeBaseService) {}

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest a single document into the vector knowledge base' })
  async ingest(@Body() dto: IngestDocumentDto): Promise<IngestResponseDto> {
    return this.kb.ingestDocument(dto);
  }

  @Post('ingest/batch')
  @ApiOperation({ summary: 'Ingest multiple documents in a single request' })
  async ingestBatch(@Body() dto: IngestDocumentDto[]): Promise<IngestResponseDto[]> {
    return this.kb.ingestBatch(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Describe Pinecone index stats across all namespaces' })
  async stats() {
    return this.kb.getIndexStats();
  }

  // ── Microservice message patterns ────────────────────────────────────────

  @MessagePattern('aml.ingest_document')
  async handleIngest(@Payload() dto: IngestDocumentDto): Promise<IngestResponseDto> {
    return this.kb.ingestDocument(dto);
  }

  @MessagePattern('aml.ingest_batch')
  async handleIngestBatch(@Payload() docs: IngestDocumentDto[]): Promise<IngestResponseDto[]> {
    return this.kb.ingestBatch(docs);
  }

  @MessagePattern('aml.kb_stats')
  async handleStats() {
    return this.kb.getIndexStats();
  }
}
