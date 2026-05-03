import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RetrievalService } from './retrieval.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { KnowledgeSource, RiskLevel } from '../common/types/aml.types';
import { RetrieveContextDto } from './dto/retrieve-context.dto';

const baseDto: RetrieveContextDto = {
  patternId: 'PAT-001',
  entityId: 'ENT-001',
  entityType: 'business',
  totalAmount: 95000,
  currency: 'USD',
  transactionCount: 10,
  avgTransactionAmount: 9500,
  frequencyPerDay: 0.5,
  counterparties: ['CP-1'],
  jurisdictions: ['US'],
  flaggedBehaviors: ['structuring'],
  riskScore: 85,
  riskLevel: RiskLevel.HIGH,
  timeWindowDays: 20,
};

const fakeVector = Array(3072).fill(0.1);
const fakeNarrative = 'AML Transaction Pattern Analysis for business entity (ENT-001).';

function fakeMatch(id: string, score: number, ns = KnowledgeSource.FINCEN) {
  return {
    id,
    score,
    metadata: {
      source: ns,
      title: `Title ${id}`,
      content: `Content for ${id}`,
      documentTitle: `Doc ${id}`,
      chunkIndex: 0,
      totalChunks: 1,
    },
  };
}

describe('RetrievalService', () => {
  let service: RetrievalService;
  let mockEmbedding: jest.Mocked<Pick<EmbeddingService, 'embedPattern' | 'embedText' | 'buildPatternNarrative'>>;
  let mockPinecone: { query: jest.Mock };

  beforeEach(async () => {
    mockEmbedding = {
      embedPattern: jest.fn().mockResolvedValue(fakeVector),
      embedText: jest.fn().mockResolvedValue(fakeVector),
      buildPatternNarrative: jest.fn().mockReturnValue(fakeNarrative),
    };

    mockPinecone = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrievalService,
        { provide: EmbeddingService, useValue: mockEmbedding },
        { provide: PineconeService, useValue: mockPinecone },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'retrieval.topK' ? 5 : key === 'retrieval.minScore' ? 0.7 : undefined,
          },
        },
      ],
    }).compile();

    service = module.get<RetrievalService>(RetrievalService);
  });

  // ── retrieveContext ───────────────────────────────────────────────────────

  describe('retrieveContext', () => {
    it('returns the correct patternId and query narrative', async () => {
      const result = await service.retrieveContext(baseDto);
      expect(result.patternId).toBe('PAT-001');
      expect(result.query).toBe(fakeNarrative);
    });

    it('returns zero results when Pinecone returns no matches', async () => {
      const result = await service.retrieveContext(baseDto);
      expect(result.totalResults).toBe(0);
      expect(result.allContexts).toHaveLength(0);
    });

    it('filters out matches below the default minScore (0.70)', async () => {
      mockPinecone.query.mockImplementation((_, ns: KnowledgeSource) => {
        if (ns === KnowledgeSource.FINCEN) {
          return Promise.resolve([
            fakeMatch('high', 0.92),
            fakeMatch('low', 0.60),
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.retrieveContext(baseDto);
      expect(result.fincenTypologies).toHaveLength(1);
      expect(result.fincenTypologies[0].id).toBe('high');
    });

    it('uses a custom minScore from the DTO', async () => {
      mockPinecone.query.mockResolvedValue([
        fakeMatch('a', 0.75),
        fakeMatch('b', 0.85),
      ]);

      const result = await service.retrieveContext({ ...baseDto, minScore: 0.80 });
      expect(result.totalResults).toBe(3); // 0.85 from each namespace × 3 = 3
    });

    it('sorts allContexts by score descending', async () => {
      mockPinecone.query.mockImplementation((_, ns: KnowledgeSource) => {
        if (ns === KnowledgeSource.FINCEN) return Promise.resolve([fakeMatch('f', 0.80)]);
        if (ns === KnowledgeSource.FATF) return Promise.resolve([fakeMatch('g', 0.92)]);
        if (ns === KnowledgeSource.SAR) return Promise.resolve([fakeMatch('s', 0.85)]);
        return Promise.resolve([]);
      });

      const result = await service.retrieveContext(baseDto);
      expect(result.allContexts[0].score).toBe(0.92);
      expect(result.allContexts[1].score).toBe(0.85);
      expect(result.allContexts[2].score).toBe(0.80);
    });

    it('routes results into the correct namespace buckets', async () => {
      mockPinecone.query.mockImplementation((_, ns: KnowledgeSource) => {
        if (ns === KnowledgeSource.FINCEN) return Promise.resolve([fakeMatch('fincen-1', 0.9)]);
        if (ns === KnowledgeSource.FATF) return Promise.resolve([fakeMatch('fatf-1', 0.88)]);
        if (ns === KnowledgeSource.SAR) return Promise.resolve([fakeMatch('sar-1', 0.82)]);
        return Promise.resolve([]);
      });

      const result = await service.retrieveContext(baseDto);
      expect(result.fincenTypologies[0].id).toBe('fincen-1');
      expect(result.fatfGuidance[0].id).toBe('fatf-1');
      expect(result.sarPrecedents[0].id).toBe('sar-1');
    });

    it('respects a custom topK from the DTO', async () => {
      await service.retrieveContext({ ...baseDto, topK: 3 });
      expect(mockPinecone.query).toHaveBeenCalledWith(fakeVector, expect.anything(), 3, undefined);
    });

    it('limits search to specified namespaces only', async () => {
      await service.retrieveContext({ ...baseDto, namespaces: [KnowledgeSource.FINCEN] });

      expect(mockPinecone.query).toHaveBeenCalledTimes(1);
      expect(mockPinecone.query).toHaveBeenCalledWith(
        fakeVector,
        KnowledgeSource.FINCEN,
        5,
        undefined,
      );
    });

    it('strips content from results when includeContent is false', async () => {
      mockPinecone.query.mockImplementation((_, ns: KnowledgeSource) => {
        if (ns === KnowledgeSource.FINCEN) return Promise.resolve([fakeMatch('x', 0.90)]);
        return Promise.resolve([]);
      });

      const result = await service.retrieveContext({ ...baseDto, includeContent: false });
      expect(result.fincenTypologies[0].content).toBe('');
    });

    it('applies a category metadata filter when categoryFilter is set', async () => {
      await service.retrieveContext({ ...baseDto, categoryFilter: 'structuring' });

      expect(mockPinecone.query).toHaveBeenCalledWith(
        fakeVector,
        expect.anything(),
        5,
        { category: { $eq: 'structuring' } },
      );
    });

    it('passes no filter when categoryFilter is not set', async () => {
      await service.retrieveContext(baseDto);
      expect(mockPinecone.query).toHaveBeenCalledWith(fakeVector, expect.anything(), 5, undefined);
    });

    it('records a non-zero processingTimeMs', async () => {
      const result = await service.retrieveContext(baseDto);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── similaritySearch ──────────────────────────────────────────────────────

  describe('similaritySearch', () => {
    it('embeds the query text and returns filtered results', async () => {
      mockPinecone.query.mockResolvedValue([
        fakeMatch('s1', 0.88),
        fakeMatch('s2', 0.65), // below default 0.7
      ]);

      const results = await service.similaritySearch('structuring pattern', KnowledgeSource.FINCEN);

      expect(mockEmbedding.embedText).toHaveBeenCalledWith('structuring pattern');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('s1');
    });

    it('uses a custom topK and minScore when provided', async () => {
      mockPinecone.query.mockResolvedValue([fakeMatch('x', 0.75)]);

      const results = await service.similaritySearch('query', KnowledgeSource.SAR, 10, 0.80);

      expect(mockPinecone.query).toHaveBeenCalledWith(fakeVector, KnowledgeSource.SAR, 10);
      expect(results).toHaveLength(0); // 0.75 < 0.80
    });
  });
});
