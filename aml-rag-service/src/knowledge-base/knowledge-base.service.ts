import 'multer';
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmbeddingService } from "../embedding/embedding.service";
import { PineconeService } from "../pinecone/pinecone.service";
import { KnowledgeSource, TypologyCategory, RiskLevel } from "../common/types/aml.types";
import {
  IngestDocumentDto,
  IngestFileBatchMetaDto,
  IngestResponseDto,
} from "./dto/ingest-document.dto";

interface Chunk {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

interface ExtractedDocumentMetadata {
  category: TypologyCategory;
  publicationDate: string | null;
  regulatoryRef: string | null;
  sarCaseId: string | null;
  riskLevel: RiskLevel;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly genai: GoogleGenerativeAI;
  private readonly completionModel: string;

  constructor(
    private embedding: EmbeddingService,
    private pinecone: PineconeService,
    private config: ConfigService,
  ) {
    this.genai = new GoogleGenerativeAI(config.get<string>("google.apiKey"));
    this.completionModel = config.get<string>("google.completionModel");
  }

  async ingestDocument(dto: IngestDocumentDto): Promise<IngestResponseDto> {
    const start = Date.now();
    const documentId = dto.documentId ?? uuidv4();
    const chunkSize = dto.chunkSize ?? 1000;
    const chunkOverlap = dto.chunkOverlap ?? 200;

    const chunks = this.chunkText(dto.content, chunkSize, chunkOverlap);
    this.logger.log(
      `Ingesting "${dto.title}" → ${chunks.length} chunks into ${dto.source}`,
    );

    const preparedChunks: Chunk[] = chunks.map((text, i) => ({
      id: `${documentId}-chunk-${i}`,
      text: `${dto.title}\n\n${text}`,
      metadata: this.stripNulls({
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
      }),
    }));

    const embeddings = await this.embedding.embedBatch(
      preparedChunks.map((c) => c.text),
    );

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

  async ingestBatch(
    documents: IngestDocumentDto[],
  ): Promise<IngestResponseDto[]> {
    const results: IngestResponseDto[] = [];
    for (const doc of documents) {
      try {
        const result = await this.ingestDocument(doc);
        results.push(result);
      } catch (err: any) {
        this.logger.error(`Failed to ingest "${doc.title}": ${err.message}`);
      }
    }
    return results;
  }

  async ingestFileBatch(
    files: Express.Multer.File[],
    meta: IngestFileBatchMetaDto,
  ): Promise<IngestResponseDto[]> {
    const docs: IngestDocumentDto[] = await Promise.all(
      files.map(async (file) => {
        const content = await this.extractTextFromBuffer(
          file.buffer,
          file.mimetype,
          file.originalname,
        );

        this.logger.log(`Extracting metadata from "${file.originalname}" via Gemini...`);
        const extracted = await this.extractMetadataWithAI(content);
        this.logger.log(
          `Extracted — category: ${extracted.category}, riskLevel: ${extracted.riskLevel}, ` +
          `ref: ${extracted.regulatoryRef}, date: ${extracted.publicationDate}`,
        );

        return {
          title: "FATF_SANCTIONS",
          content,
          source: meta.source ?? KnowledgeSource.FATF,
          jurisdiction: "UAE",
          category: extracted.category,
          riskLevel: extracted.riskLevel,
          publicationDate: extracted.publicationDate,
          regulatoryRef: extracted.regulatoryRef,
          sarCaseId: extracted.sarCaseId,
          chunkSize: meta.chunkSize ? Number(meta.chunkSize) : undefined,
          chunkOverlap: meta.chunkOverlap ? Number(meta.chunkOverlap) : undefined,
        };
      }),
    );
    return this.ingestBatch(docs);
  }

  private async extractMetadataWithAI(text: string): Promise<ExtractedDocumentMetadata> {
    const SYSTEM_PROMPT = `You are an AML compliance analyst specialising in FATF (Financial Action Task Force) sanctions and guidance documents.
Your task is to extract structured metadata from a provided document excerpt.
Return ONLY a valid JSON object — no markdown fences, no extra text.`;

    const USER_PROMPT = `Analyse the FATF document excerpt below and return a JSON object with exactly these fields:

{
  "category": "<one of: structuring | layering | integration | trade_based | cyber | real_estate | shell_companies | correspondent_banking | cash_intensive | crypto>",
  "publicationDate": "<publication date in YYYY-MM-DD format, or null if not found>",
  "regulatoryRef": "<FATF report number, document ID, or reference code, or null>",
  "sarCaseId": "<SAR case identifier if present, otherwise null>",
  "riskLevel": "<critical | high | medium | low>"
}

Risk level rules:
- "critical"  → the document classifies this as a FATF blacklisted jurisdiction (High-Risk Jurisdictions subject to a Call for Action / Public Statement)
- "high"      → the document classifies this as a FATF grey-listed jurisdiction (Jurisdictions under Increased Monitoring)
- "medium"    → general AML guidance or advisory document
- "low"       → informational or background document

Category rules — choose the primary AML typology the document addresses:
- structuring, layering, integration, trade_based, cyber, real_estate, shell_companies, correspondent_banking, cash_intensive, crypto

Document excerpt (first 8 000 characters):
---
${text.slice(0, 8000)}
---`;

    try {
      const model = this.genai.getGenerativeModel({
        model: this.completionModel,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { maxOutputTokens: 512, temperature: 0 },
      });

      const result = await model.generateContent(USER_PROMPT);
      const raw = JSON.parse(result.response.text());

      return {
        category: Object.values(TypologyCategory).includes(raw.category)
          ? (raw.category as TypologyCategory)
          : TypologyCategory.CORRESPONDENT_BANKING,
        publicationDate: raw.publicationDate ?? null,
        regulatoryRef: raw.regulatoryRef ?? null,
        sarCaseId: raw.sarCaseId ?? null,
        riskLevel: this.parseRiskLevel(raw.riskLevel),
      };
    } catch (err: any) {
      this.logger.error(`Gemini metadata extraction failed: ${err.message}. Using defaults.`);
      return {
        category: TypologyCategory.CORRESPONDENT_BANKING,
        publicationDate: null,
        regulatoryRef: null,
        sarCaseId: null,
        riskLevel: RiskLevel.HIGH,
      };
    }
  }

  private stripNulls(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
  }

  private parseRiskLevel(value: string): RiskLevel {
    const map: Record<string, RiskLevel> = {
      critical: RiskLevel.CRITICAL,
      high: RiskLevel.HIGH,
      medium: RiskLevel.MEDIUM,
      low: RiskLevel.LOW,
    };
    return map[value?.toLowerCase()] ?? RiskLevel.HIGH;
  }

  private async extractTextFromBuffer(
    buffer: Buffer,
    mimetype: string,
    filename: string,
  ): Promise<string> {
    const ext = filename.split(".").pop()?.toLowerCase();

    if (mimetype === "application/pdf" || ext === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    throw new BadRequestException(`Unsupported file type: ${mimetype}`);
  }

  async getIndexStats(): Promise<Record<string, any>> {
    return this.pinecone.describeIndexStats();
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      if (end < text.length) {
        const boundary = text.lastIndexOf(". ", end);
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
