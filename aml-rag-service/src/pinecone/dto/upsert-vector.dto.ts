import { IsString, IsArray, IsNumber, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KnowledgeSource } from '../../common/types/aml.types';

export class UpsertVectorDto {
  @ApiProperty({ description: 'Unique vector identifier' })
  @IsString()
  id: string;

  @ApiProperty({ type: [Number], description: 'Embedding vector values' })
  @IsArray()
  @IsNumber({}, { each: true })
  values: number[];

  @ApiProperty({ description: 'Arbitrary metadata stored alongside the vector' })
  @IsObject()
  metadata: Record<string, any>;

  @ApiProperty({ enum: KnowledgeSource, description: 'Target Pinecone namespace' })
  @IsEnum(KnowledgeSource)
  namespace: KnowledgeSource;
}
