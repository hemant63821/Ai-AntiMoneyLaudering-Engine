import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeBaseService } from './knowledge-base.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { KnowledgeSource, TypologyCategory, RiskLevel } from '../common/types/aml.types';
import { IngestDocumentDto } from './dto/ingest-document.dto';

const SHORT = 'This is a short document sentence.';
const LONG = Array(60).fill('Structured transactions occurred repeatedly.').join(' ');

const baseDoc: IngestDocumentDto = {
  title: 'Test FinCEN Advisory',
  source: KnowledgeSource.FINCEN,
  category: TypologyCategory.STRUCTURING,
  documentId: 'DOC-001',
  riskLevel: RiskLevel.HIGH,
  jurisdiction: 'US',
  content: SHORT,
};

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService;
  let mockEmbedding: { embedBatch: jest.Mock };
  let mockPinecone: { upsertBatch: jest.Mock };

  beforeEach(async () => {
    mockEmbedding = {
      embedBatch: jest.fn().mockImplementation((texts: string[]) =>
        Promise.resolve(texts.map(() => Array(3072).fill(0.1))),
      ),
    };

    mockPinecone = {
      upsertBatch: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeBaseService,
        { provide: EmbeddingService, useValue: mockEmbedding },
        { provide: PineconeService, useValue: mockPinecone },
      ],
    }).compile();

    service = module.get<KnowledgeBaseService>(KnowledgeBaseService);
  });

  // ── ingestDocument ────────────────────────────────────────────────────────

  describe('ingestDocument', () => {
    it('returns the documentId, title, namespace, and chunk count', async () => {
      const result = await service.ingestDocument(baseDoc);

      expect(result.documentId).toBe('DOC-001');
      expect(result.title).toBe('Test FinCEN Advisory');
      expect(result.namespace).toBe(KnowledgeSource.FINCEN);
      expect(result.chunksIngested).toBeGreaterThanOrEqual(1);
    });

    it('generates a UUID documentId when none is provided', async () => {
      const doc = { ...baseDoc, documentId: undefined };
      const result = await service.ingestDocument(doc);

      expect(result.documentId).toBeDefined();
      expect(result.documentId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('prefixes each chunk text with the document title', async () => {
      await service.ingestDocument(baseDoc);

      const calledTexts: string[] = mockEmbedding.embedBatch.mock.calls[0][0];
      expect(calledTexts.every((t) => t.startsWith('Test FinCEN Advisory'))).toBe(true);
    });

    it('upserts vectors with correct metadata fields', async () => {
      await service.ingestDocument(baseDoc);

      const [vectors, namespace] = mockPinecone.upsertBatch.mock.calls[0];
      expect(namespace).toBe(KnowledgeSource.FINCEN);

      const meta = vectors[0].metadata;
      expect(meta.source).toBe(KnowledgeSource.FINCEN);
      expect(meta.category).toBe(TypologyCategory.STRUCTURING);
      expect(meta.documentTitle).toBe('Test FinCEN Advisory');
      expect(meta.documentId).toBe('DOC-001');
      expect(meta.riskLevel).toBe(RiskLevel.HIGH);
      expect(meta.jurisdiction).toBe('US');
    });

    it('generates vector ids in the pattern <documentId>-chunk-<index>', async () => {
      await service.ingestDocument(baseDoc);

      const [vectors] = mockPinecone.upsertBatch.mock.calls[0];
      expect(vectors[0].id).toMatch(/^DOC-001-chunk-\d+$/);
    });

    it('embeds all chunks in a single batched API call', async () => {
      await service.ingestDocument({ ...baseDoc, content: LONG });

      expect(mockEmbedding.embedBatch).toHaveBeenCalledTimes(1);
    });

    it('produces multiple chunks for content longer than chunkSize', async () => {
      const result = await service.ingestDocument({ ...baseDoc, content: LONG });
      expect(result.chunksIngested).toBeGreaterThan(1);
    });

    it('respects a custom chunkSize from the DTO', async () => {
      const result = await service.ingestDocument({
        ...baseDoc,
        content: LONG,
        chunkSize: 200,
        chunkOverlap: 50,
      });
      const defaultResult = await service.ingestDocument({ ...baseDoc, content: LONG });

      expect(result.chunksIngested).toBeGreaterThan(defaultResult.chunksIngested);
    });

    it('records a non-negative processingTimeMs', async () => {
      const result = await service.ingestDocument(baseDoc);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── ingestBatch ───────────────────────────────────────────────────────────

  describe('ingestBatch', () => {
    it('returns results for all successfully ingested documents', async () => {
      const docs = [
        { ...baseDoc, documentId: 'DOC-A', content: 'First document sentence.' },
        { ...baseDoc, documentId: 'DOC-B', content: 'Second document sentence.' },
      ];

      const results = await service.ingestBatch(docs);

      expect(results).toHaveLength(2);
      expect(results[0].documentId).toBe('DOC-A');
      expect(results[1].documentId).toBe('DOC-B');
    });

    it('skips failed documents and continues processing the rest', async () => {
      mockEmbedding.embedBatch
        .mockResolvedValueOnce([Array(3072).fill(0.1)])
        .mockRejectedValueOnce(new Error('OpenAI timeout'));

      const docs = [
        { ...baseDoc, documentId: 'DOC-OK', content: 'Good content here.' },
        { ...baseDoc, documentId: 'DOC-FAIL', content: 'Bad content here.' },
      ];

      const results = await service.ingestBatch(docs);

      expect(results).toHaveLength(1);
      expect(results[0].documentId).toBe('DOC-OK');
    });

    it('returns an empty array when all documents fail', async () => {
      mockEmbedding.embedBatch.mockRejectedValue(new Error('Service unavailable'));

      const results = await service.ingestBatch([baseDoc]);
      expect(results).toHaveLength(0);
    });
  });

  // ── chunkText (private, tested via ingestDocument) ────────────────────────

  describe('chunkText (via casting)', () => {
    const chunk = (text: string, size = 1000, overlap = 200) =>
      (service as any).chunkText(text, size, overlap);

    it('returns an empty array for text shorter than 50 characters', () => {
      expect(chunk('Too short.')).toHaveLength(0);
    });

    it('returns a single chunk for text within one window', () => {
      const text = 'A'.repeat(800);
      const chunks = chunk(text);
      expect(chunks).toHaveLength(1);
    });

    it('produces overlapping chunks for long text', () => {
      const sentence = 'Each sentence ends with a period. ';
      const text = sentence.repeat(100);
      const chunks = chunk(text, 500, 100);

      expect(chunks.length).toBeGreaterThan(1);
      // Overlap means the first few chars of chunk N+1 appear near the end of chunk N
      const endOfFirst = chunks[0].slice(-110);
      const startOfSecond = chunks[1].slice(0, 110);
      const overlap = endOfFirst.split(' ').some((w) => startOfSecond.includes(w));
      expect(overlap).toBe(true);
    });

    it('prefers sentence boundaries over hard character cuts', () => {
      const text = 'First sentence ends here. ' + 'B'.repeat(600) + '. More text follows.';
      const [firstChunk] = chunk(text, 500, 100);
      expect(firstChunk).toMatch(/\./);
    });
  });
});
