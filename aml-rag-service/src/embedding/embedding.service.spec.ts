import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { EmbedPatternDto } from './dto/embed-pattern.dto';
import { RiskLevel } from '../common/types/aml.types';

const basePattern: EmbedPatternDto = {
  patternId: 'PAT-001',
  entityId: 'ENT-001',
  entityType: 'business',
  totalAmount: 95000,
  currency: 'USD',
  transactionCount: 10,
  avgTransactionAmount: 9500,
  frequencyPerDay: 0.5,
  counterparties: ['CP-1', 'CP-2'],
  jurisdictions: ['US', 'MX'],
  flaggedBehaviors: ['structuring', 'rapid-movement'],
  riskScore: 85,
  riskLevel: RiskLevel.HIGH,
  timeWindowDays: 20,
};

const configValues: Record<string, any> = {
  'openai.apiKey': 'test-key',
  'openai.embeddingModel': 'text-embedding-3-large',
  'openai.embeddingDimensions': 3072,
};

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let mockCreate: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        { provide: ConfigService, useValue: { get: (k: string) => configValues[k] } },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);

    // Inject mock directly to avoid ESM/jest.mock hoisting issues
    mockCreate = jest.fn();
    (service as any).client = { embeddings: { create: mockCreate } };
  });

  // ── buildPatternNarrative ────────────────────────────────────────────────

  describe('buildPatternNarrative', () => {
    it('includes entity id, type, and transaction summary', () => {
      const text = service.buildPatternNarrative(basePattern);
      expect(text).toContain('ENT-001');
      expect(text).toContain('business');
      expect(text).toContain('10 transactions');
      expect(text).toContain('USD 95,000');
      expect(text).toContain('9,500');
    });

    it('includes counterparties and jurisdictions', () => {
      const text = service.buildPatternNarrative(basePattern);
      expect(text).toContain('CP-1');
      expect(text).toContain('US');
      expect(text).toContain('MX');
    });

    it('includes flagged behaviors and risk assessment', () => {
      const text = service.buildPatternNarrative(basePattern);
      expect(text).toContain('structuring');
      expect(text).toContain('85/100');
      expect(text).toContain('HIGH');
    });

    it('adds multi-jurisdiction note when 4+ jurisdictions are present', () => {
      const pattern = { ...basePattern, jurisdictions: ['US', 'MX', 'DE', 'CN'] };
      const text = service.buildPatternNarrative(pattern);
      expect(text).toContain('4 countries');
    });

    it('truncates counterparties list beyond 10 with overflow note', () => {
      const pattern = {
        ...basePattern,
        counterparties: Array.from({ length: 15 }, (_, i) => `CP-${i}`),
      };
      const text = service.buildPatternNarrative(pattern);
      expect(text).toContain('5 additional counterparties');
    });

    it('omits counterparty section when list is empty', () => {
      const pattern = { ...basePattern, counterparties: [] };
      const text = service.buildPatternNarrative(pattern);
      expect(text).not.toContain('Counterparties involved');
    });

    it('omits jurisdiction section when list is empty', () => {
      const pattern = { ...basePattern, jurisdictions: [] };
      const text = service.buildPatternNarrative(pattern);
      expect(text).not.toContain('Jurisdictions active');
    });

    it('includes structuring indicators when present', () => {
      const pattern = {
        ...basePattern,
        structuringIndicators: {
          transactionsBelowThreshold: 8,
          thresholdAmount: 10000,
          splitTransactionPattern: true,
          multipleAccountsUsed: true,
        },
      };
      const text = service.buildPatternNarrative(pattern);
      expect(text).toContain('8 transactions below');
      expect(text).toContain('Split transaction pattern: YES');
      expect(text).toContain('Multiple accounts used: YES');
    });

    it('shows "no" for false structuring flags', () => {
      const pattern = {
        ...basePattern,
        structuringIndicators: {
          transactionsBelowThreshold: 0,
          thresholdAmount: 10000,
          splitTransactionPattern: false,
          multipleAccountsUsed: false,
        },
      };
      const text = service.buildPatternNarrative(pattern);
      expect(text).toContain('Split transaction pattern: no');
      expect(text).toContain('Multiple accounts used: no');
    });

    it('includes layering indicators when present', () => {
      const pattern = {
        ...basePattern,
        layeringIndicators: {
          rapidMovementHours: 24,
          jurisdictionHops: 3,
          unusualCounterparties: 5,
          roundAmountTransactions: 4,
        },
      };
      const text = service.buildPatternNarrative(pattern);
      expect(text).toContain('3 jurisdiction hops');
      expect(text).toContain('24 hours');
      expect(text).toContain('5 unusual counterparties');
      expect(text).toContain('4 round-amount transactions');
    });
  });

  // ── embedText ────────────────────────────────────────────────────────────

  describe('embedText', () => {
    it('calls OpenAI with the correct model and dimensions', async () => {
      const fakeEmbedding = Array(3072).fill(0.1);
      mockCreate.mockResolvedValue({ data: [{ index: 0, embedding: fakeEmbedding }] });

      const result = await service.embedText('test query');

      expect(result).toEqual(fakeEmbedding);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        input: 'test query',
        dimensions: 3072,
      });
    });
  });

  // ── embedPattern ─────────────────────────────────────────────────────────

  describe('embedPattern', () => {
    it('builds a narrative from the pattern and embeds it', async () => {
      const fakeEmbedding = Array(3072).fill(0.2);
      mockCreate.mockResolvedValue({ data: [{ index: 0, embedding: fakeEmbedding }] });

      const result = await service.embedPattern(basePattern);

      expect(result).toEqual(fakeEmbedding);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const calledInput: string = mockCreate.mock.calls[0][0].input;
      expect(calledInput).toContain('ENT-001');
    });
  });

  // ── embedBatch ────────────────────────────────────────────────────────────

  describe('embedBatch', () => {
    it('returns embeddings sorted by original index regardless of API response order', async () => {
      const embedA = Array(3072).fill(0.1);
      const embedB = Array(3072).fill(0.9);
      mockCreate.mockResolvedValue({
        data: [
          { index: 1, embedding: embedB },
          { index: 0, embedding: embedA },
        ],
      });

      const result = await service.embedBatch(['text A', 'text B']);
      expect(result[0]).toEqual(embedA);
      expect(result[1]).toEqual(embedB);
    });

    it('passes all texts in a single API call', async () => {
      mockCreate.mockResolvedValue({
        data: [
          { index: 0, embedding: Array(3072).fill(0.1) },
          { index: 1, embedding: Array(3072).fill(0.2) },
          { index: 2, embedding: Array(3072).fill(0.3) },
        ],
      });

      const result = await service.embedBatch(['a', 'b', 'c']);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate.mock.calls[0][0].input).toEqual(['a', 'b', 'c']);
      expect(result).toHaveLength(3);
    });
  });
});
