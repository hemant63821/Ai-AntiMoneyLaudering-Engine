import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EmbeddingService } from '../embedding/embedding.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { KnowledgeSource } from '../common/types/aml.types';
import { IngestDocumentDto, IngestResponseDto } from './dto/ingest-document.dto';

interface Chunk {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private embedding: EmbeddingService,
    private pinecone: PineconeService,
  ) {}

  async ingestDocument(dto: IngestDocumentDto): Promise<IngestResponseDto> {
    const start = Date.now();
    const documentId = dto.documentId ?? uuidv4();
    const chunkSize = dto.chunkSize ?? 1000;
    const chunkOverlap = dto.chunkOverlap ?? 200;

    const chunks = this.chunkText(dto.content, chunkSize, chunkOverlap);
    this.logger.log(`Ingesting "${dto.title}" → ${chunks.length} chunks into ${dto.source}`);

    const preparedChunks: Chunk[] = chunks.map((text, i) => ({
      id: `${documentId}-chunk-${i}`,
      text: `${dto.title}\n\n${text}`,
      metadata: {
        source: dto.source,
        category: dto.category,
        documentTitle: dto.title,
        documentId,
        title: dto.title,
        content: text,
        chunkIndex: i,
        totalChunks: chunks.length,
        publicationDate: dto.publicationDate,
        jurisdiction: dto.jurisdiction,
        riskLevel: dto.riskLevel,
        sarCaseId: dto.sarCaseId,
        regulatoryRef: dto.regulatoryRef,
      },
    }));

    // Embed all chunks in one batched API call
    const embeddings = await this.embedding.embedBatch(preparedChunks.map((c) => c.text));

    const vectors = preparedChunks.map((chunk, i) => ({
      id: chunk.id,
      values: embeddings[i],
      metadata: chunk.metadata,
    }));

    await this.pinecone.upsertBatch(vectors, dto.source);

    return {
      documentId,
      title: dto.title,
      chunksIngested: chunks.length,
      namespace: dto.source,
      processingTimeMs: Date.now() - start,
    };
  }

  async ingestBatch(documents: IngestDocumentDto[]): Promise<IngestResponseDto[]> {
    const results: IngestResponseDto[] = [];
    for (const doc of documents) {
      try {
        const result = await this.ingestDocument(doc);
        results.push(result);
      } catch (err) {
        this.logger.error(`Failed to ingest "${doc.title}": ${err.message}`);
      }
    }
    return results;
  }

  async getIndexStats(): Promise<Record<string, any>> {
    return this.pinecone.describeIndexStats();
  }

  // Sliding-window chunker that respects word boundaries
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      if (end < text.length) {
        // Walk back to the nearest sentence or word boundary
        const boundary = text.lastIndexOf('. ', end);
        if (boundary > start + chunkSize / 2) {
          end = boundary + 1;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = end - overlap;

      if (start >= text.length) break;
    }

    return chunks.filter((c) => c.length > 50);
  }
}
