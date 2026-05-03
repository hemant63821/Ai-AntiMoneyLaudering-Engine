import { KnowledgeSource, TypologyCategory, RiskLevel } from '../../common/types/aml.types';
import { IngestDocumentDto } from '../dto/ingest-document.dto';

export const SAR_CASES: IngestDocumentDto[] = [
  {
    title: 'SAR Case: Multi-Jurisdiction Structuring Network — Retail Business',
    source: KnowledgeSource.SAR,
    category: TypologyCategory.STRUCTURING,
    documentId: 'SAR-CASE-2021-STR-001',
    sarCaseId: 'SAR-2021-STR-001',
    publicationDate: '2021-03-15',
    jurisdiction: 'US',
    riskLevel: RiskLevel.HIGH,
    content: `
Case Summary: A small retail business conducted 47 cash deposits over 6 months totaling
$412,000. Individual deposits ranged from $8,500 to $9,900, with no deposit exceeding $10,000.

Transaction Pattern:
- Account opened 8 months prior to suspicious activity
- Average deposit frequency: 2.5 deposits per week
- Deposits made at 4 different branch locations of same bank
- 3 additional individuals (identified as family members) made deposits to same account
- Total monthly deposits 300-400% higher than initial business profile

Red Flags Identified:
- Consistent pattern of deposits just below $10,000 threshold
- Use of multiple depositors and multiple branch locations
- Account holder expressed awareness of CTR reporting to branch teller
- Cash deposits inconsistent with business type (online retail)
- Immediate transfer of deposited funds to overseas account within 24-48 hours

SAR Filing Outcome: SAR filed Day 22 after pattern identified. Law enforcement subpoena
issued Day 45. Investigation revealed business was front for drug proceeds from regional
distribution network. Criminal referral made; prosecution resulted in forfeiture of $412,000.

Lessons Learned: The combination of multiple depositors, multiple branches, and immediate
international wire transfers post-deposit is a strong indicator of coordinated structuring.
Monitor customer's declared business activity against actual transaction patterns.
    `.trim(),
  },
  {
    title: 'SAR Case: Trade Finance Anomaly — Over-Invoiced Imports',
    source: KnowledgeSource.SAR,
    category: TypologyCategory.TRADE_BASED,
    documentId: 'SAR-CASE-2020-TBML-003',
    sarCaseId: 'SAR-2020-TBML-003',
    publicationDate: '2020-09-22',
    jurisdiction: 'US',
    riskLevel: RiskLevel.HIGH,
    content: `
Case Summary: An import/export company received letters of credit for electronic goods imports
from Southeast Asia totaling $2.3M over 4 months. Customs valuation data showed consistent
25-40% over-valuation of goods compared to benchmark commodity prices.

Transaction Pattern:
- 12 separate LC transactions over 120-day period
- Average LC value: $192,000 (range $145,000-$280,000)
- All transactions involving same overseas supplier (incorporated in free-trade zone)
- Payments routed through intermediary bank in UAE before reaching supplier
- No corresponding US export activity from importing entity

Discrepancy Analysis:
- US Customs entry data showed goods valued at $1.4M
- LC payments totaled $2.3M
- Unexplained value transfer to overseas beneficiary: $900,000

Red Flags Identified:
- Invoice values significantly above commodity price benchmarks
- Third-country payment routing (UAE intermediary) without commercial rationale
- Single supplier dominating all import activity
- No legitimate supply chain relationship between importer and end customers
- Business principals with prior involvement in customs fraud investigations

SAR Outcome: Coordinated SAR filing with correspondent bank. Joint investigation identified
$2.1M in total TBML scheme over 18 months. Underlying proceeds linked to narcotics trafficking
in source country. Asset forfeiture proceedings initiated.
    `.trim(),
  },
  {
    title: 'SAR Case: Rapid Fund Movement — Possible Money Mule Network',
    source: KnowledgeSource.SAR,
    category: TypologyCategory.LAYERING,
    documentId: 'SAR-CASE-2022-LAY-007',
    sarCaseId: 'SAR-2022-LAY-007',
    publicationDate: '2022-11-03',
    jurisdiction: 'US',
    riskLevel: RiskLevel.CRITICAL,
    content: `
Case Summary: 23 individual accounts at a regional bank received large ACH credits followed
by immediate wire transfers within 6-48 hours. Accounts were recently opened with minimal
transaction history prior to activity.

Transaction Pattern:
- 23 accounts received total $1.8M in ACH deposits over 45-day period
- Average per-account receipt: $78,000 (range $35,000-$150,000)
- 94% of funds wired out within 48 hours of receipt
- Wire beneficiaries: 8 different overseas accounts in 5 jurisdictions (Nigeria, Ghana,
  Philippines, Mexico, and UAE)
- Account openers shared common characteristics: similar geographic area, similar age group,
  recently filed for new accounts

Red Flags Identified:
- Accounts showed no prior transaction history before large deposits
- Immediate outward wire transfers after receiving funds
- Common beneficiaries across seemingly unrelated accounts
- Source of ACH credits: compromised business accounts (later identified as BEC fraud victims)
- Account holders unable to explain purpose of transactions when contacted

Account Holder Profile Analysis:
- 18/23 had responded to social media job advertisements for "financial processing" roles
- Classic money mule recruitment pattern
- Most unaware their activities constituted money laundering

SAR Outcome: All 23 accounts closed. Coordinated SAR filing triggered FinCEN investigation.
Traced to BEC fraud ring operating from Lagos. Victim businesses recovered $340,000 via
emergency federal court orders. Prosecution of ring leaders ongoing.
    `.trim(),
  },
  {
    title: 'SAR Case: Cryptocurrency Exchange — Layering via Chain Hopping',
    source: KnowledgeSource.SAR,
    category: TypologyCategory.CRYPTO,
    documentId: 'SAR-CASE-2023-CRYPTO-012',
    sarCaseId: 'SAR-2023-CRYPTO-012',
    publicationDate: '2023-04-18',
    jurisdiction: 'US',
    riskLevel: RiskLevel.CRITICAL,
    content: `
Case Summary: A cryptocurrency exchange identified a customer who conducted 34 transactions
over 60 days, converting funds through 4 different cryptocurrencies before withdrawing fiat.

Transaction Pattern:
- Initial deposit: $285,000 USD purchased Bitcoin (BTC)
- Transaction 1: BTC → Ethereum (ETH) on Exchange A
- Transaction 2: ETH → Monero (XMR) on Exchange B (non-US, weak KYC)
- Transaction 3: XMR → Litecoin (LTC) via P2P exchange
- Transaction 4: LTC → USD fiat via multiple exchanges in small amounts
- Total conversion chain completed in 72 hours

Blockchain Analytics Findings:
- Source BTC wallet flagged by Chainalysis as high-risk (darknet market association)
- XMR conversion specifically chosen to break blockchain tracing chain
- Receiving fiat accounts at 5 different financial institutions across 3 states
- IP addresses associated with TOR network and VPN services

Red Flags Identified:
- Use of privacy coin (Monero) as deliberate transaction obfuscation
- Chain hopping pattern specifically designed to break blockchain audit trail
- TOR/VPN usage inconsistent with legitimate user behavior
- Fiat withdrawals fragmented across multiple institutions to avoid detection
- Source wallet cluster associated with ransomware proceeds

SAR Outcome: Blockchain analytics traced original funds to ransomware attack on healthcare
provider. SAR filed on Day 7. Coordination with FBI Cyber Division. $195,000 of $285,000
seized via emergency court order before full laundering completed.
    `.trim(),
  },
  {
    title: 'SAR Case: Real Estate Shell Company Purchase — Beneficial Ownership Concealment',
    source: KnowledgeSource.SAR,
    category: TypologyCategory.REAL_ESTATE,
    documentId: 'SAR-CASE-2021-RE-005',
    sarCaseId: 'SAR-2021-RE-005',
    publicationDate: '2021-07-30',
    jurisdiction: 'US',
    riskLevel: RiskLevel.HIGH,
    content: `
Case Summary: A luxury condominium worth $4.2M was purchased via a Delaware LLC with
nominee directors. Title insurance company filed SAR after identifying multi-layer
ownership structure and all-cash transaction.

Transaction Pattern:
- Buyer entity: Delaware LLC (Incorporated 6 weeks before purchase)
- Delaware LLC 100% owned by: BVI Company (incorporated same month)
- BVI Company directors: professional nominees from registered agent firm
- Wire transfer origin: Singapore bank, funds routed through Cayman Islands correspondent
- No mortgage; all-cash transaction

Due Diligence Findings:
- Beneficial owner concealed through 3 corporate layers across 3 jurisdictions
- Wire transfer path: Singapore → Cayman correspondent → US bank → seller
- LLC had no other assets, employees, or business activity
- Property intended use: listed as "investment" without tenants or rental listing
- No legitimate explanation for complex structure from nominee directors

Beneficial Ownership Investigation (Post-SAR):
- Subpoena to registered agent revealed beneficial owner was foreign PEP
- PEP subject to asset freeze in home jurisdiction for corruption charges
- Property purchase coincided with timing of corruption investigation in home country
- Classic capital flight and asset concealment pattern

SAR Outcome: Property subject to civil forfeiture proceedings. Collaboration with MLAT
request to home jurisdiction. SAR information shared with FinCEN GTO (Geographic Targeting
Order) database. Case became precedent for enhanced beneficial ownership disclosure
requirements under Corporate Transparency Act (CTA).
    `.trim(),
  },
];
