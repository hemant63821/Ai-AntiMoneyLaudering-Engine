import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskLevel } from '../../common/types/aml.types';

export class ScreeningSourceDto {
  @ApiProperty() title: string;
  @ApiProperty() score: number;
  @ApiProperty() snippet: string;
  @ApiPropertyOptional() jurisdiction?: string;
  @ApiPropertyOptional() publicationDate?: string;
}

export class ScreeningResponseDto {
  @ApiProperty() transactionId: string;
  @ApiProperty() customerName: string;
  @ApiProperty({ enum: RiskLevel }) riskLevel: RiskLevel | 'clear';
  @ApiPropertyOptional() flaggedCountry?: string;
  @ApiPropertyOptional({ enum: ['blacklist', 'grey-list'] }) listType?: 'blacklist' | 'grey-list';
  @ApiProperty() reason: string;
  @ApiProperty() amount: number;
  @ApiProperty() transactionDate: string;
  @ApiProperty() senderCountry: string;
  @ApiProperty() receiverCountry: string;
  @ApiProperty() jurisdiction: string;
  @ApiProperty() jurisdictionDate: string;
  @ApiProperty({ type: [ScreeningSourceDto] }) sources: ScreeningSourceDto[];
  @ApiProperty() processingTimeMs: number;
}
