import { IsString, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeSource, TypologyCategory, RiskLevel } from '../../common/types/aml.types';

export class IngestDocumentDto {
  @ApiProperty({ description: 'Document title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Full document text content' })
  @IsString()
  content: string;

  @ApiProperty({ enum: KnowledgeSource })
  @IsEnum(KnowledgeSource)
  source: KnowledgeSource;

  @ApiPropertyOptional({ enum: TypologyCategory })
  @IsOptional()
  @IsEnum(TypologyCategory)
  category?: TypologyCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ description: 'SAR case identifier' })
  @IsOptional()
  @IsString()
  sarCaseId?: string;

  @ApiPropertyOptional({ description: 'Regulatory reference number (e.g. FinCEN Advisory)' })
  @IsOptional()
  @IsString()
  regulatoryRef?: string;

  @ApiPropertyOptional({ description: 'Chunk size in characters', default: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(200)
  @Max(4000)
  chunkSize?: number;

  @ApiPropertyOptional({ description: 'Overlap between chunks in characters', default: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(800)
  chunkOverlap?: number;
}

export class IngestFileBatchMetaDto {
  @ApiPropertyOptional({ enum: KnowledgeSource, default: KnowledgeSource.FATF, description: 'Target namespace (defaults to fatf-guidance)' })
  @IsOptional()
  @IsEnum(KnowledgeSource)
  source?: KnowledgeSource;

  @ApiPropertyOptional({ default: 1000 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsNumber()
  @Min(200)
  @Max(4000)
  chunkSize?: number;

  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsNumber()
  @Min(0)
  @Max(800)
  chunkOverlap?: number;
}

export class IngestResponseDto {
  @ApiProperty()
  documentId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  chunksIngested: number;

  @ApiProperty()
  namespace: KnowledgeSource;

  @ApiProperty()
  processingTimeMs: number;
}
