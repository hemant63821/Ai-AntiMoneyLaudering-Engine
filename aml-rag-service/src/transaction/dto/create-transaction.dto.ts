import { IsString, IsNumber, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: 9800 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'US' })
  @IsString()
  senderCountry: string;

  @ApiProperty({ example: 'NG' })
  @IsString()
  receiverCountry: string;

  @ApiProperty({ example: 'TXN-20260504-001' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: '2026-05-04' })
  @IsDateString()
  transactionDate: string;
}
