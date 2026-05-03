import { IsString, IsNumber, IsArray, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskLevel } from '../../common/types/aml.types';

export class EmbedPatternDto {
  @ApiProperty({ description: 'Unique pattern identifier from Layer 2' })
  @IsString()
  patternId: string;

  @ApiProperty({ description: 'Entity under review' })
  @IsString()
  entityId: string;

  @ApiProperty({ enum: ['individual', 'business'] })
  @IsEnum(['individual', 'business'])
  entityType: 'individual' | 'business';

  @ApiProperty({ description: 'Total transaction volume in USD' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  transactionCount: number;

  @ApiProperty()
  @IsNumber()
  avgTransactionAmount: number;

  @ApiProperty({ description: 'Average daily transaction frequency' })
  @IsNumber()
  frequencyPerDay: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  counterparties: string[];

  @ApiProperty({ type: [String], description: 'ISO country codes' })
  @IsArray()
  @IsString({ each: true })
  jurisdictions: string[];

  @ApiProperty({ type: [String], description: 'Flagged AML behaviors from Layer 2' })
  @IsArray()
  @IsString({ each: true })
  flaggedBehaviors: string[];

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore: number;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Analysis window in days' })
  @IsNumber()
  timeWindowDays: number;

  @ApiPropertyOptional({ description: 'Structuring red flags' })
  @IsOptional()
  structuringIndicators?: {
    transactionsBelowThreshold: number;
    thresholdAmount: number;
    splitTransactionPattern: boolean;
    multipleAccountsUsed: boolean;
  };

  @ApiPropertyOptional({ description: 'Layering red flags' })
  @IsOptional()
  layeringIndicators?: {
    rapidMovementHours: number;
    jurisdictionHops: number;
    unusualCounterparties: number;
    roundAmountTransactions: number;
  };
}
