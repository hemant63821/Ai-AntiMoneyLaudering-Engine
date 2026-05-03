import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbedPatternDto } from './dto/embed-pattern.dto';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({ apiKey: config.get<string>('openai.apiKey') });
    this.model = config.get<string>('openai.embeddingModel');
    this.dimensions = config.get<number>('openai.embeddingDimensions');
  }

  async embedPattern(pattern: EmbedPatternDto): Promise<number[]> {
    const text = this.buildPatternNarrative(pattern);
    return this.embedText(text);
  }

  async embedText(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
      dimensions: this.dimensions,
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      dimensions: this.dimensions,
    });
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((e) => e.embedding);
  }

  // Converts structured pattern data into a rich natural-language narrative
  // that captures all AML-relevant signals for semantic embedding.
  buildPatternNarrative(pattern: EmbedPatternDto): string {
    const lines: string[] = [];

    lines.push(
      `AML Transaction Pattern Analysis for ${pattern.entityType} entity (${pattern.entityId}).`,
    );
    lines.push(
      `Over a ${pattern.timeWindowDays}-day window, ${pattern.transactionCount} transactions ` +
        `totaling ${pattern.currency} ${pattern.totalAmount.toLocaleString()} were observed. ` +
        `Average transaction amount: ${pattern.currency} ${pattern.avgTransactionAmount.toLocaleString()}. ` +
        `Transaction frequency: ${pattern.frequencyPerDay.toFixed(2)} transactions per day.`,
    );

    if (pattern.counterparties.length > 0) {
      lines.push(
        `Counterparties involved: ${pattern.counterparties.slice(0, 10).join(', ')}.` +
          (pattern.counterparties.length > 10
            ? ` Plus ${pattern.counterparties.length - 10} additional counterparties.`
            : ''),
      );
    }

    if (pattern.jurisdictions.length > 0) {
      lines.push(`Jurisdictions active: ${pattern.jurisdictions.join(', ')}.`);
      if (pattern.jurisdictions.length > 3) {
        lines.push(
          `Multi-jurisdiction activity spanning ${pattern.jurisdictions.length} countries raises layering concerns.`,
        );
      }
    }

    if (pattern.flaggedBehaviors.length > 0) {
      lines.push(`Flagged AML behaviors detected: ${pattern.flaggedBehaviors.join('; ')}.`);
    }

    lines.push(
      `Risk assessment: score ${pattern.riskScore}/100 (${pattern.riskLevel.toUpperCase()}).`,
    );

    if (pattern.structuringIndicators) {
      const s = pattern.structuringIndicators;
      lines.push(
        `Structuring indicators: ${s.transactionsBelowThreshold} transactions below ` +
          `${pattern.currency} ${s.thresholdAmount} threshold. ` +
          `Split transaction pattern: ${s.splitTransactionPattern ? 'YES' : 'no'}. ` +
          `Multiple accounts used: ${s.multipleAccountsUsed ? 'YES' : 'no'}.`,
      );
    }

    if (pattern.layeringIndicators) {
      const l = pattern.layeringIndicators;
      lines.push(
        `Layering indicators: funds moved through ${l.jurisdictionHops} jurisdiction hops. ` +
          `${l.unusualCounterparties} unusual counterparties. ` +
          `${l.roundAmountTransactions} round-amount transactions. ` +
          `Rapid movement within ${l.rapidMovementHours} hours.`,
      );
    }

    return lines.join(' ');
  }
}
