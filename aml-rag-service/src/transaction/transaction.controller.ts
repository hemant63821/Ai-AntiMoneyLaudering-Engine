import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ScreeningResponseDto } from './dto/screening-response.dto';
import { TransactionScreeningService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly screening: TransactionScreeningService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a transaction for AML jurisdiction screening' })
  screen(@Body() dto: CreateTransactionDto): Promise<ScreeningResponseDto> {
    return this.screening.screen(dto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all screened transactions flagged as high or critical risk' })
  getAlerts(): ScreeningResponseDto[] {
    return this.screening.getAlerts();
  }
}
