/**
 * One-shot ingestion script — runs outside NestJS DI to seed the Pinecone index.
 * Usage: npm run ingest
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { VoyageAIClient } from 'voyageai';
import { Pinecone } from '@pinecone-database/pinecone';
import { FINCEN_TYPOLOGIES } from './fincen-typologies';
import { FATF_GUIDANCE } from './fatf-guidance';
import { SAR_CASES } from './sar-cases';
import { IngestDocumentDto } from '../dto/ingest-document.dto';
import { KnowledgeSource } from '../../common/types/aml.types';
import { v4 as uuidv4 } from 'uuid';

const EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL || 'voyage-finance-2';
const EMBEDDING_DIMENSIONS = parseInt(process.env.VOYAGE_EMBEDDING_DIMENSIONS || '1024', 10);
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'aml-knowledge-base';
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

function stripNulls(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + size;
    if (end < text.length) {
      const boundary = text.lastIndexOf('. ', end);
      if (boundary > start + size / 2) end = boundary + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks.filter((c) => c.length > 50);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await voyage.embed({ input: texts, model: EMBEDDING_MODEL });
  return res.data.sort((a, b) => a.index - b.index).map((e) => e.embedding);
}

async function ingestDocument(doc: IngestDocumentDto, index: ReturnType<Pinecone['index']>) {
  const documentId = doc.documentId ?? uuidv4();
  const chunks = chunkText(doc.content, CHUNK_SIZE, CHUNK_OVERLAP);
  const texts = chunks.map((c) => `${doc.title}\n\n${c}`);

  console.log(`  Embedding ${chunks.length} chunks for "${doc.title}"...`);
  const embeddings = await embedBatch(texts);

  const vectors = chunks.map((chunk, i) => ({
    id: `${documentId}-chunk-${i}`,
    values: embeddings[i],
    metadata: stripNulls({
      source: doc.source,
      category: doc.category,
      documentTitle: doc.title,
      title: doc.title,
      documentId,
      content: chunk,
      chunkIndex: i,
      totalChunks: chunks.length,
      publicationDate: doc.publicationDate,
      jurisdiction: doc.jurisdiction,
      riskLevel: doc.riskLevel,
      sarCaseId: doc.sarCaseId,
      regulatoryRef: doc.regulatoryRef,
    }),
  }));

  // Upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    await index.namespace(doc.source).upsert(vectors.slice(i, i + 100));
  }

  console.log(`  ✓ Ingested ${chunks.length} chunks → namespace: ${doc.source}`);
}

async function ensureIndex() {
  const existing = await pinecone.listIndexes();
  const names = existing.indexes?.map((i) => i.name) ?? [];

  if (!names.includes(INDEX_NAME)) {
    console.log(`Creating index "${INDEX_NAME}"...`);
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: EMBEDDING_DIMENSIONS,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
        },
      },
    });
    console.log('Waiting 60s for index to initialize...');
    await new Promise((r) => setTimeout(r, 60_000));
  } else {
    console.log(`Index "${INDEX_NAME}" already exists.`);
  }
}

async function main() {
  console.log('=== AML Knowledge Base Ingestion ===\n');

  await ensureIndex();
  const index = pinecone.index(INDEX_NAME);

  const allDocs: IngestDocumentDto[] = [
    ...FINCEN_TYPOLOGIES,
    ...FATF_GUIDANCE,
    ...SAR_CASES,
  ];

  console.log(`\nIngesting ${allDocs.length} documents...\n`);

  for (const doc of allDocs) {
    try {
      await ingestDocument(doc, index);
    } catch (err) {
      console.error(`  ✗ Failed: "${doc.title}" — ${err.message}`);
    }
  }

  const stats = await index.describeIndexStats();
  console.log('\n=== Index Stats ===');
  console.log(JSON.stringify(stats, null, 2));
  console.log('\nIngestion complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
