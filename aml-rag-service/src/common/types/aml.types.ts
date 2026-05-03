export enum KnowledgeSource {
  FINCEN = 'fincen-typologies',
  FATF = 'fatf-guidance',
  SAR = 'sar-cases',
}

export enum TypologyCategory {
  STRUCTURING = 'structuring',
  LAYERING = 'layering',
  INTEGRATION = 'integration',
  TRADE_BASED = 'trade_based',
  CYBER = 'cyber',
  REAL_ESTATE = 'real_estate',
  SHELL_COMPANIES = 'shell_companies',
  CORRESPONDENT_BANKING = 'correspondent_banking',
  CASH_INTENSIVE = 'cash_intensive',
  CRYPTO = 'crypto',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface TransactionPattern {
  patternId: string;
  entityId: string;
  entityType: 'individual' | 'business';
  totalAmount: number;
  currency: string;
  transactionCount: number;
  avgTransactionAmount: number;
  frequencyPerDay: number;
  counterparties: string[];
  jurisdictions: string[];
  flaggedBehaviors: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  timeWindowDays: number;
  structuringIndicators?: StructuringIndicators;
  layeringIndicators?: LayeringIndicators;
}

export interface StructuringIndicators {
  transactionsBelowThreshold: number;
  thresholdAmount: number;
  splitTransactionPattern: boolean;
  multipleAccountsUsed: boolean;
}

export interface LayeringIndicators {
  rapidMovementHours: number;
  jurisdictionHops: number;
  unusualCounterparties: number;
  roundAmountTransactions: number;
}

export interface KnowledgeChunk {
  id: string;
  source: KnowledgeSource;
  category?: TypologyCategory;
  title: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  source: KnowledgeSource;
  category?: TypologyCategory;
  documentTitle: string;
  documentId?: string;
  chunkIndex: number;
  totalChunks: number;
  publicationDate?: string;
  jurisdiction?: string;
  riskLevel?: RiskLevel;
  sarCaseId?: string;
  regulatoryRef?: string;
}

export interface RetrievedContext {
  id: string;
  score: number;
  source: KnowledgeSource;
  category?: TypologyCategory;
  title: string;
  content: string;
  metadata: ChunkMetadata;
}

export interface RAGResult {
  patternId: string;
  query: string;
  retrievedContexts: RetrievedContext[];
  fincenTypologies: RetrievedContext[];
  fatfGuidance: RetrievedContext[];
  sarPrecedents: RetrievedContext[];
  totalResults: number;
  processingTimeMs: number;
}
