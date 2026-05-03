import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import "multer";
import { KnowledgeSource } from "../common/types/aml.types";
import {
  IngestDocumentDto,
  IngestFileBatchMetaDto,
  IngestResponseDto,
} from "./dto/ingest-document.dto";
import { KnowledgeBaseService } from "./knowledge-base.service";

@ApiTags("Knowledge Base")
@Controller("knowledge-base")
export class KnowledgeBaseController {
  constructor(private readonly kb: KnowledgeBaseService) {}

  @Post("ingest")
  @ApiOperation({
    summary: "Ingest a single document into the vector knowledge base",
  })
  async ingest(@Body() dto: IngestDocumentDto): Promise<IngestResponseDto> {
    return this.kb.ingestDocument(dto);
  }

  @Post("ingest/fatf/batch")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Ingest multiple PDF or DOCX documents in a single request",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["files"],
      properties: {
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
          description:
            "PDF or DOCX FATF sanction documents to ingest. Title is set to FATF_SANCTIONS, jurisdiction to UAE. All other metadata is auto-extracted via OpenAI.",
        },
        source: {
          type: "string",
          enum: Object.values(KnowledgeSource),
          default: KnowledgeSource.FATF,
          description: "Target Pinecone namespace (defaults to fatf-guidance)",
        },
        chunkSize: { type: "number", default: 1000 },
        chunkOverlap: { type: "number", default: 200 },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("files", 20, {
      fileFilter: (_req, file, cb) => {
        const allowed = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Unsupported file type: ${file.mimetype}. Only PDF and DOCX are accepted.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async ingestBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() meta: IngestFileBatchMetaDto,
  ): Promise<IngestResponseDto[]> {
    if (!files?.length) {
      throw new BadRequestException(
        "At least one PDF or DOCX file is required.",
      );
    }
    return this.kb.ingestFileBatch(files, meta);
  }

  @Get("stats")
  @ApiOperation({
    summary: "Describe Pinecone index stats across all namespaces",
  })
  async stats() {
    return this.kb.getIndexStats();
  }

  // ── Microservice message patterns ────────────────────────────────────────

  @MessagePattern("aml.ingest_document")
  async handleIngest(
    @Payload() dto: IngestDocumentDto,
  ): Promise<IngestResponseDto> {
    return this.kb.ingestDocument(dto);
  }

  @MessagePattern("aml.ingest_batch")
  async handleIngestBatch(
    @Payload() docs: IngestDocumentDto[],
  ): Promise<IngestResponseDto[]> {
    return this.kb.ingestBatch(docs);
  }

  @MessagePattern("aml.kb_stats")
  async handleStats() {
    return this.kb.getIndexStats();
  }
}
