import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, Index } from '@pinecone-database/pinecone';
import { KnowledgeSource, ChunkMetadata } from '../common/types/aml.types';

export interface PineconeMatch {
  id: string;
  score: number;
  metadata: ChunkMetadata & { content: string; title: string };
}

@Injectable()
export class PineconeService implements OnModuleInit {
  private readonly logger = new Logger(PineconeService.name);
  private client: Pinecone;
  private index: Index;
  private readonly indexName: string;

  constructor(private config: ConfigService) {
    this.indexName = config.get<string>('pinecone.indexName');
  }

  async onModuleInit() {
    this.client = new Pinecone({ apiKey: this.config.get<string>('pinecone.apiKey') });
    await this.ensureIndex();
    this.index = this.client.index(this.indexName);
    this.logger.log(`Connected to Pinecone index: ${this.indexName}`);
  }

  private async ensureIndex() {
    const dimension = this.config.get<number>('voyage.embeddingDimensions');
    const existing = await this.client.listIndexes();
    const names = existing.indexes?.map((i) => i.name) ?? [];

    if (names.includes(this.indexName)) {
      const desc = await this.client.describeIndex(this.indexName);
      if (desc.dimension === dimension) return;

      this.logger.warn(
        `Index "${this.indexName}" has dimension ${desc.dimension} but embeddings are ${dimension}. ` +
        `Deleting and recreating — all existing vectors will be lost.`,
      );
      await this.client.deleteIndex(this.indexName);
      await new Promise((r) => setTimeout(r, 10_000));
    }

    this.logger.log(`Creating Pinecone index: ${this.indexName} (dim=${dimension})`);
    await this.client.createIndex({
      name: this.indexName,
      dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: this.config.get<string>('pinecone.environment'),
        },
      },
    });
    await new Promise((r) => setTimeout(r, 60_000));
  }

  async upsert(
    id: string,
    values: number[],
    metadata: Record<string, any>,
    namespace: KnowledgeSource,
  ): Promise<void> {
    await this.index.namespace(namespace).upsert([{ id, values, metadata }]);
  }

  async upsertBatch(
    vectors: Array<{ id: string; values: number[]; metadata: Record<string, any> }>,
    namespace: KnowledgeSource,
  ): Promise<void> {
    // Pinecone recommends batches of ≤100
    const BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      await this.index.namespace(namespace).upsert(vectors.slice(i, i + BATCH_SIZE));
      this.logger.debug(`Upserted batch ${i / BATCH_SIZE + 1} into namespace ${namespace}`);
    }
  }

  async query(
    vector: number[],
    namespace: KnowledgeSource,
    topK: number,
    filter?: Record<string, any>,
  ): Promise<PineconeMatch[]> {
    const response = await this.index.namespace(namespace).query({
      vector,
      topK,
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    });

    return (response.matches ?? []).map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: m.metadata as unknown as PineconeMatch['metadata'],
    }));
  }

  async queryAllNamespaces(
    vector: number[],
    topK: number,
  ): Promise<Record<KnowledgeSource, PineconeMatch[]>> {
    const [fincen, fatf, sar] = await Promise.all([
      this.query(vector, KnowledgeSource.FINCEN, topK),
      this.query(vector, KnowledgeSource.FATF, topK),
      this.query(vector, KnowledgeSource.SAR, topK),
    ]);

    return {
      [KnowledgeSource.FINCEN]: fincen,
      [KnowledgeSource.FATF]: fatf,
      [KnowledgeSource.SAR]: sar,
    };
  }

  async deleteByIds(ids: string[], namespace: KnowledgeSource): Promise<void> {
    await this.index.namespace(namespace).deleteMany(ids);
  }

  async describeIndexStats(): Promise<Record<string, any>> {
    return this.index.describeIndexStats();
  }
}
