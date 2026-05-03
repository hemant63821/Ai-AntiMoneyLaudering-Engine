import { Module } from '@nestjs/common';
import { EmbeddingModule } from '../embedding/embedding.module';
import { TransactionController } from './transaction.controller';
import { TransactionScreeningService } from './transaction.service';
import { AlertsGateway } from './alerts.gateway';

@Module({
  imports: [EmbeddingModule],
  controllers: [TransactionController],
  providers: [TransactionScreeningService, AlertsGateway],
})
export class TransactionModule {}
