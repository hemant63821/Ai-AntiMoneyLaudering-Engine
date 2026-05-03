import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PineconeService } from '../pinecone/pinecone.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly pinecone: PineconeService) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Readiness check — verifies Pinecone connectivity and returns index stats',
  })
  async ready() {
    const indexStats = await this.pinecone.describeIndexStats();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      indexStats,
    };
  }

  @Get('live')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness probe — returns 200 if the process is alive' })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
