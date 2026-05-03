import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PineconeService } from './pinecone.service';
import { KnowledgeSource } from '../common/types/aml.types';

const configValues: Record<string, any> = {
  'pinecone.apiKey': 'test-pcsk',
  'pinecone.indexName': 'aml-knowledge-base',
  'pinecone.environment': 'us-east-1',
  'openai.embeddingDimensions': 3072,
};

function buildMockIndex() {
  const namespace = jest.fn();
  const describeIndexStats = jest.fn().mockResolvedValue({
    namespaces: {},
    totalVectorCount: 0,
  });
  const upsert = jest.fn().mockResolvedValue({});
  const query = jest.fn().mockResolvedValue({ matches: [] });
  const deleteMany = jest.fn().mockResolvedValue({});

  namespace.mockReturnValue({ upsert, query, deleteMany });
  return { index: { namespace, describeIndexStats }, namespace, upsert, query, deleteMany };
}

describe('PineconeService', () => {
  let service: PineconeService;
  let mocks: ReturnType<typeof buildMockIndex>;

  beforeEach(async () => {
    mocks = buildMockIndex();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PineconeService,
        { provide: ConfigService, useValue: { get: (k: string) => configValues[k] } },
      ],
    }).compile();

    service = module.get<PineconeService>(PineconeService);

    // Bypass real Pinecone connection; inject mock index directly
    (service as any).index = mocks.index;
  });

  // ── upsert ───────────────────────────────────────────────────────────────

  describe('upsert', () => {
    it('upserts a single vector into the correct namespace', async () => {
      const vec = Array(3072).fill(0.1);
      await service.upsert('vec-1', vec, { title: 'test' }, KnowledgeSource.FINCEN);

      expect(mocks.namespace).toHaveBeenCalledWith(KnowledgeSource.FINCEN);
      expect(mocks.upsert).toHaveBeenCalledWith([
        { id: 'vec-1', values: vec, metadata: { title: 'test' } },
      ]);
    });
  });

  // ── upsertBatch ──────────────────────────────────────────────────────────

  describe('upsertBatch', () => {
    it('splits 250 vectors into 3 batches of ≤100 each', async () => {
      const vectors = Array.from({ length: 250 }, (_, i) => ({
        id: `vec-${i}`,
        values: Array(10).fill(0.1),
        metadata: {},
      }));

      await service.upsertBatch(vectors, KnowledgeSource.FINCEN);

      expect(mocks.upsert).toHaveBeenCalledTimes(3);
      expect(mocks.upsert.mock.calls[0][0]).toHaveLength(100);
      expect(mocks.upsert.mock.calls[1][0]).toHaveLength(100);
      expect(mocks.upsert.mock.calls[2][0]).toHaveLength(50);
    });

    it('handles a batch smaller than 100 in a single call', async () => {
      const vectors = Array.from({ length: 15 }, (_, i) => ({
        id: `vec-${i}`,
        values: Array(10).fill(0.5),
        metadata: {},
      }));

      await service.upsertBatch(vectors, KnowledgeSource.SAR);

      expect(mocks.upsert).toHaveBeenCalledTimes(1);
      expect(mocks.upsert.mock.calls[0][0]).toHaveLength(15);
    });
  });

  // ── query ────────────────────────────────────────────────────────────────

  describe('query', () => {
    it('returns mapped matches with id, score, and metadata', async () => {
      mocks.query.mockResolvedValue({
        matches: [
          {
            id: 'doc-1',
            score: 0.92,
            metadata: { title: 'Structuring', content: 'test', source: KnowledgeSource.FINCEN },
          },
          {
            id: 'doc-2',
            score: 0.75,
            metadata: { title: 'Layering', content: 'test2', source: KnowledgeSource.FINCEN },
          },
        ],
      });

      const results = await service.query(Array(3072).fill(0.5), KnowledgeSource.FINCEN, 5);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('doc-1');
      expect(results[0].score).toBe(0.92);
      expect(results[1].score).toBe(0.75);
    });

    it('returns empty array when there are no matches', async () => {
      mocks.query.mockResolvedValue({ matches: [] });
      const results = await service.query([], KnowledgeSource.SAR, 5);
      expect(results).toHaveLength(0);
    });

    it('defaults score to 0 when Pinecone omits it', async () => {
      mocks.query.mockResolvedValue({
        matches: [{ id: 'x', metadata: { title: 'doc' } }],
      });
      const [result] = await service.query([], KnowledgeSource.FINCEN, 1);
      expect(result.score).toBe(0);
    });

    it('forwards an optional metadata filter to Pinecone', async () => {
      mocks.query.mockResolvedValue({ matches: [] });
      const filter = { category: { $eq: 'structuring' } };

      await service.query(Array(10).fill(0.1), KnowledgeSource.FINCEN, 5, filter);

      expect(mocks.query).toHaveBeenCalledWith(
        expect.objectContaining({ filter }),
      );
    });

    it('does not send a filter key when none is provided', async () => {
      mocks.query.mockResolvedValue({ matches: [] });
      await service.query([], KnowledgeSource.FINCEN, 5);

      const callArg = mocks.query.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('filter');
    });
  });

  // ── queryAllNamespaces ────────────────────────────────────────────────────

  describe('queryAllNamespaces', () => {
    it('returns results keyed by all three KnowledgeSource namespaces', async () => {
      mocks.query.mockResolvedValue({ matches: [] });

      const result = await service.queryAllNamespaces(Array(10).fill(0.1), 5);

      expect(result).toHaveProperty(KnowledgeSource.FINCEN);
      expect(result).toHaveProperty(KnowledgeSource.FATF);
      expect(result).toHaveProperty(KnowledgeSource.SAR);
    });

    it('queries all three namespaces (three separate calls)', async () => {
      mocks.query.mockResolvedValue({ matches: [] });

      await service.queryAllNamespaces(Array(10).fill(0.1), 5);

      expect(mocks.namespace).toHaveBeenCalledWith(KnowledgeSource.FINCEN);
      expect(mocks.namespace).toHaveBeenCalledWith(KnowledgeSource.FATF);
      expect(mocks.namespace).toHaveBeenCalledWith(KnowledgeSource.SAR);
    });
  });

  // ── deleteByIds ───────────────────────────────────────────────────────────

  describe('deleteByIds', () => {
    it('deletes the provided ids from the given namespace', async () => {
      await service.deleteByIds(['id-1', 'id-2'], KnowledgeSource.FINCEN);

      expect(mocks.namespace).toHaveBeenCalledWith(KnowledgeSource.FINCEN);
      expect(mocks.deleteMany).toHaveBeenCalledWith(['id-1', 'id-2']);
    });
  });

  // ── describeIndexStats ────────────────────────────────────────────────────

  describe('describeIndexStats', () => {
    it('returns the stats from Pinecone', async () => {
      const fakeStats = { namespaces: { 'fincen-typologies': { vectorCount: 42 } }, totalVectorCount: 42 };
      mocks.index.describeIndexStats.mockResolvedValue(fakeStats);

      const result = await service.describeIndexStats();
      expect(result).toEqual(fakeStats);
    });
  });
});
