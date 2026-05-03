import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { PineconeService } from '../pinecone/pinecone.service';
import { KnowledgeSource, RiskLevel } from '../common/types/aml.types';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ScreeningResponseDto, ScreeningSourceDto } from './dto/screening-response.dto';
import { AlertsGateway } from './alerts.gateway';

// FATF High-Risk Jurisdictions subject to a Call for Action (blacklist) — Feb 2024
const BLACKLISTED: Set<string> = new Set(['KP', 'IR', 'MM']);

// FATF Jurisdictions under Increased Monitoring (grey-list) — Feb 2024
const GREY_LISTED: Set<string> = new Set([
  'BG', 'BF', 'CM', 'HR', 'CD', 'HT', 'JM', 'KE', 'ML', 'MZ',
  'NA', 'NP', 'NG', 'PH', 'SN', 'ZA', 'SS', 'SY', 'TZ', 'TR', 'UG', 'VN', 'YE',
]);

const COUNTRY_NAMES: Record<string, string> = {
  KP: 'North Korea', IR: 'Iran', MM: 'Myanmar',
  BG: 'Bulgaria', BF: 'Burkina Faso', CM: 'Cameroon', HR: 'Croatia',
  CD: 'DR Congo', HT: 'Haiti', JM: 'Jamaica', KE: 'Kenya', ML: 'Mali',
  MZ: 'Mozambique', NA: 'Namibia', NP: 'Nepal', NG: 'Nigeria', PH: 'Philippines',
  SN: 'Senegal', ZA: 'South Africa', SS: 'South Sudan', SY: 'Syria',
  TZ: 'Tanzania', TR: 'Turkey', UG: 'Uganda', VN: 'Vietnam', YE: 'Yemen',
};

// Maps full country names (uppercase) → ISO-2 code so the API accepts both formats
const NAME_TO_CODE: Record<string, string> = {
  'NORTH KOREA': 'KP', 'IRAN': 'IR', 'MYANMAR': 'MM', 'BURMA': 'MM',
  'BULGARIA': 'BG', 'BURKINA FASO': 'BF', 'CAMEROON': 'CM', 'CROATIA': 'HR',
  'DR CONGO': 'CD', 'DEMOCRATIC REPUBLIC OF CONGO': 'CD', 'CONGO': 'CD',
  'HAITI': 'HT', 'JAMAICA': 'JM', 'KENYA': 'KE', 'MALI': 'ML',
  'MOZAMBIQUE': 'MZ', 'NAMIBIA': 'NA', 'NEPAL': 'NP', 'NIGERIA': 'NG',
  'PHILIPPINES': 'PH', 'SENEGAL': 'SN', 'SOUTH AFRICA': 'ZA',
  'SOUTH SUDAN': 'SS', 'SYRIA': 'SY', 'TANZANIA': 'TZ',
  'TURKEY': 'TR', 'TURKIYE': 'TR', 'UGANDA': 'UG', 'VIETNAM': 'VN', 'YEMEN': 'YE',
};

function toIso2(input: string): string {
  const upper = input.trim().toUpperCase();
  return NAME_TO_CODE[upper] ?? upper;
}

@Injectable()
export class TransactionScreeningService {
  private readonly logger = new Logger(TransactionScreeningService.name);
  private readonly alerts: ScreeningResponseDto[] = [];

  constructor(
    private readonly embedding: EmbeddingService,
    private readonly pinecone: PineconeService,
    private readonly gateway: AlertsGateway,
  ) {}

  getAlerts(): ScreeningResponseDto[] {
    return this.alerts.filter(
      (a) => a.riskLevel === RiskLevel.HIGH || a.riskLevel === RiskLevel.CRITICAL,
    );
  }

  async screen(dto: CreateTransactionDto): Promise<ScreeningResponseDto> {
    const start = Date.now();

    const sender = toIso2(dto.senderCountry);
    const receiver = toIso2(dto.receiverCountry);

    // Determine which country (if any) triggers a flag, preferring the higher risk
    const flagged = this.resolveFlaggedCountry(sender, receiver);

    if (!flagged) {
      return {
        transactionId: dto.transactionId,
        customerName: dto.customerName,
        riskLevel: 'clear',
        amount: dto.amount,
        transactionDate: dto.transactionDate,
        senderCountry: sender,
        receiverCountry: receiver,
        reason: 'Neither sender nor receiver country appears on the FATF blacklist or grey-list.',
        jurisdiction: `${sender} / ${receiver}`,
        jurisdictionDate: dto.transactionDate,
        sources: [],
        processingTimeMs: Date.now() - start,
      };
    }

    const countryName = COUNTRY_NAMES[flagged.code] ?? flagged.code;
    const query = `FATF ${flagged.listType === 'blacklist' ? 'blacklisted high-risk jurisdiction' : 'grey-listed increased monitoring'} ${countryName} AML correspondent banking sanctions money laundering risk`;

    this.logger.log(`Screening ${dto.transactionId} — ${countryName} on FATF ${flagged.listType}`);

    const vector = await this.embedding.embedText(query);
    const matches = await this.pinecone.query(vector, KnowledgeSource.FATF, 5);

    const topMatches = matches.filter((m) => m.score >= 0.5);

    const sources: ScreeningSourceDto[] = topMatches.map((m) => ({
      title: m.metadata?.title ?? m.metadata?.documentTitle ?? 'FATF Guidance',
      score: Math.round(m.score * 1000) / 1000,
      snippet: (m.metadata?.content ?? '').slice(0, 300).trim(),
      jurisdiction: m.metadata?.jurisdiction,
      publicationDate: m.metadata?.publicationDate,
    }));

    const best = topMatches[0];
    const jurisdiction = best?.metadata?.jurisdiction ?? countryName;
    const jurisdictionDate = best?.metadata?.publicationDate ?? dto.transactionDate;

    const reason = this.buildReason(flagged, countryName, best?.metadata?.title);

    const result: ScreeningResponseDto = {
      transactionId: dto.transactionId,
      customerName: dto.customerName,
      riskLevel: flagged.riskLevel,
      flaggedCountry: countryName,
      listType: flagged.listType,
      amount: dto.amount,
      transactionDate: dto.transactionDate,
      senderCountry: sender,
      receiverCountry: receiver,
      reason,
      jurisdiction,
      jurisdictionDate,
      sources,
      processingTimeMs: Date.now() - start,
    };

    console.log(JSON.stringify(result, null, 2));

    this.alerts.push(result);
    this.gateway.broadcastCount(this.getAlerts().length);
    return result;
  }

  private resolveFlaggedCountry(
    sender: string,
    receiver: string,
  ): { code: string; listType: 'blacklist' | 'grey-list'; riskLevel: RiskLevel } | null {
    // Blacklist takes precedence over grey-list
    for (const code of [sender, receiver]) {
      if (BLACKLISTED.has(code)) {
        return { code, listType: 'blacklist', riskLevel: RiskLevel.CRITICAL };
      }
    }
    for (const code of [sender, receiver]) {
      if (GREY_LISTED.has(code)) {
        return { code, listType: 'grey-list', riskLevel: RiskLevel.HIGH };
      }
    }
    return null;
  }

  private buildReason(
    flagged: { code: string; listType: 'blacklist' | 'grey-list' },
    countryName: string,
    docTitle?: string,
  ): string {
    const listLabel =
      flagged.listType === 'blacklist'
        ? 'FATF High-Risk Jurisdiction (blacklist) — subject to a Call for Action'
        : 'FATF Jurisdiction under Increased Monitoring (grey-list)';

    const doc = docTitle ? ` Reference: ${docTitle}.` : '';
    return `${countryName} is designated as a ${listLabel}.${doc}`;
  }
}
