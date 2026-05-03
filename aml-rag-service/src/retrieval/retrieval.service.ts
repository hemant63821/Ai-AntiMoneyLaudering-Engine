import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '../embedding/embedding.service';
import { PineconeService, PineconeMatch } from '../pinecone/pinecone.service';
import { KnowledgeSource, RetrievedContext } from '../common/types/aml.types';
import { RetrieveContextDto, RAGResponseDto } from './dto/retrieve-context.dto';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private readonly defaultTopK: number;
  private readonly defaultMinScore: number;

  constructor(
    private embedding: EmbeddingService,
    private pinecone: PineconeService,
    private config: ConfigService,
  ) {
    this.defaultTopK = config.get<number>('retrieval.topK');
    this.defaultMinScore = config.get<number>('retrieval.minScore');
  }

  async retrieveContext(dto: RetrieveContextDto): Promise<RAGResponseDto> {
    const start = Date.now();
    const topK = dto.topK ?? this.defaultTopK;
    const minScore = dto.minScore ?? this.defaultMinScore;
    const namespaces = dto.namespaces ?? Object.values(KnowledgeSource);
    const includeContent = dto.includeContent !== false;

    // Build embedding from the transaction pattern
    const [vector, query] = await Promise.all([
      this.embedding.embedPattern(dto),
      Promise.resolve(this.embedding.buildPatternNarrative(dto)),
    ]);

    this.logger.debug(`Embedded pattern ${dto.patternId} — querying ${namespaces.length} namespace(s)`);

    // Parallel cosine similarity search across requested namespaces
    const searchResults = await Promise.all(
      namespaces.map(async (ns) => ({
        namespace: ns,
        matches: await this.pinecone.query(vector, ns, topK, this.buildFilter(dto)),
      })),
    );

    const byNamespace: Record<KnowledgeSource, RetrievedContext[]> = {
      [KnowledgeSource.FINCEN]: [],
      [KnowledgeSource.FATF]: [],
      [KnowledgeSource.SAR]: [],
    };

    for (const { namespace, matches } of searchResults) {
      byNamespace[namespace] = matches
        .filter((m) => m.score >= minScore)
        .map((m) => this.toRetrievedContext(m, namespace, includeContent));
    }

    const allContexts = [
      ...byNamespace[KnowledgeSource.FINCEN],
      ...byNamespace[KnowledgeSource.FATF],
      ...byNamespace[KnowledgeSource.SAR],
    ].sort((a, b) => b.score - a.score);

    this.logger.log(
      `Pattern ${dto.patternId}: retrieved ${allContexts.length} contexts ` +
        `(fincen=${byNamespace[KnowledgeSource.FINCEN].length}, ` +
        `fatf=${byNamespace[KnowledgeSource.FATF].length}, ` +
        `sar=${byNamespace[KnowledgeSource.SAR].length}) ` +
        `in ${Date.now() - start}ms`,
    );

    return {
      patternId: dto.patternId,
      query,
      fincenTypologies: byNamespace[KnowledgeSource.FINCEN],
      fatfGuidance: byNamespace[KnowledgeSource.FATF],
      sarPrecedents: byNamespace[KnowledgeSource.SAR],
      allContexts,
      totalResults: allContexts.length,
      processingTimeMs: Date.now() - start,
    };
  }

  // Standalone vector similarity search used by admin tooling
  async similaritySearch(
    text: string,
    namespace: KnowledgeSource,
    topK = 5,
    minScore = 0.7,
  ): Promise<RetrievedContext[]> {
    const vector = await this.embedding.embedText(text);
    const matches = await this.pinecone.query(vector, namespace, topK);
    return matches
      .filter((m) => m.score >= minScore)
      .map((m) => this.toRetrievedContext(m, namespace, true));
  }

  private buildFilter(dto: RetrieveContextDto): Record<string, any> | undefined {
    if (!dto.categoryFilter) return undefined;
    return { category: { $eq: dto.categoryFilter } };
  }

  private toRetrievedContext(
    match: PineconeMatch,
    namespace: KnowledgeSource,
    includeContent: boolean,
  ): RetrievedContext {
    return {
      id: match.id,
      score: match.score,
      source: namespace,
      category: match.metadata?.category,
      title: match.metadata?.title ?? match.metadata?.documentTitle ?? 'Unknown',
      content: includeContent ? (match.metadata?.content ?? '') : '',
      metadata: match.metadata,
    };
  }
}
