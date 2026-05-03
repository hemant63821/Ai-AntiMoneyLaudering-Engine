import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { KnowledgeSource, RiskLevel } from '../../common/types/aml.types';
import { EmbedPatternDto } from '../../embedding/dto/embed-pattern.dto';

export class RetrieveContextDto extends EmbedPatternDto {
  @ApiPropertyOptional({ description: 'Max results per namespace', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  topK?: number;

  @ApiPropertyOptional({ description: 'Minimum cosine similarity score (0-1)', default: 0.70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minScore?: number;

  @ApiPropertyOptional({
    type: [String],
    enum: KnowledgeSource,
    description: 'Limit retrieval to specific namespaces',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(KnowledgeSource, { each: true })
  namespaces?: KnowledgeSource[];

  @ApiPropertyOptional({ description: 'Filter by typology category' })
  @IsOptional()
  @IsString()
  categoryFilter?: string;

  @ApiPropertyOptional({ description: 'Include full chunk content in response', default: true })
  @IsOptional()
  @IsBoolean()
  includeContent?: boolean;
}

export class RetrievedContextResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  score: number;

  @ApiProperty({ enum: KnowledgeSource })
  source: KnowledgeSource;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiProperty()
  metadata: Record<string, any>;
}

export class RAGResponseDto {
  @ApiProperty()
  patternId: string;

  @ApiProperty()
  query: string;

  @ApiProperty({ type: [RetrievedContextResponseDto] })
  fincenTypologies: RetrievedContextResponseDto[];

  @ApiProperty({ type: [RetrievedContextResponseDto] })
  fatfGuidance: RetrievedContextResponseDto[];

  @ApiProperty({ type: [RetrievedContextResponseDto] })
  sarPrecedents: RetrievedContextResponseDto[];

  @ApiProperty({ type: [RetrievedContextResponseDto] })
  allContexts: RetrievedContextResponseDto[];

  @ApiProperty()
  totalResults: number;

  @ApiProperty()
  processingTimeMs: number;
}
