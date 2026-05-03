import { KnowledgeSource, TypologyCategory, RiskLevel } from '../../common/types/aml.types';
import { IngestDocumentDto } from '../dto/ingest-document.dto';

export const FINCEN_TYPOLOGIES: IngestDocumentDto[] = [
  {
    title: 'FinCEN Advisory FIN-2014-A005: Structuring and Smurfing',
    source: KnowledgeSource.FINCEN,
    category: TypologyCategory.STRUCTURING,
    documentId: 'FIN-2014-A005',
    publicationDate: '2014-08-01',
    jurisdiction: 'US',
    riskLevel: RiskLevel.HIGH,
    regulatoryRef: 'FIN-2014-A005',
    content: `
Structuring, also known as smurfing, is a federal crime under 31 U.S.C. § 5324. It involves
breaking up large cash transactions into smaller amounts specifically to evade the Currency
Transaction Report (CTR) filing threshold of $10,000.

Red Flag Indicators:
- Multiple cash deposits just below $10,000 at the same or different branches
- Transactions conducted by multiple individuals (smurfs) to keep each below threshold
- Pattern of deposits totaling just under $10,000 over consecutive days
- Customer expresses awareness of CTR reporting requirements and requests to stay below threshold
- Frequent cash deposits followed by immediate transfers or withdrawals
- Use of multiple accounts at the same institution to aggregate deposits
- Deposits at multiple branches of the same institution on the same day

Typology Pattern: Deposits of $9,500, $9,800, $9,700 in same week across multiple accounts
to same beneficiary suggest coordinated structuring operation. Velocity: 3+ transactions per
week below threshold, involving 2+ counterparties.

Penalties: Up to 5 years imprisonment and civil money penalties up to $10,000 per violation.
Financial institutions must file Suspicious Activity Reports (SARs) within 30 days of detecting
structuring activity, regardless of whether a CTR was filed.

Case Example: In 2013, a business owner made 23 deposits totaling $236,840 over 11 months,
with each individual deposit between $7,000 and $9,900. No single deposit exceeded $10,000.
The consistent pattern and amounts just under the threshold indicated deliberate structuring.
    `.trim(),
  },
  {
    title: 'FinCEN Advisory FIN-2016-A006: Trade-Based Money Laundering (TBML)',
    source: KnowledgeSource.FINCEN,
    category: TypologyCategory.TRADE_BASED,
    documentId: 'FIN-2016-A006',
    publicationDate: '2016-08-22',
    jurisdiction: 'US',
    riskLevel: RiskLevel.HIGH,
    regulatoryRef: 'FIN-2016-A006',
    content: `
Trade-Based Money Laundering (TBML) exploits international trade to move value across borders,
conceal the origin of funds, and integrate proceeds into the legitimate financial system.

Primary TBML Schemes:
1. Over/Under-Invoicing of Goods: Manipulating trade invoice values to transfer value between
   importer and exporter. Over-invoiced imports move money from the importer's country to
   the exporter's country.

2. Multiple Invoicing: Using more than one invoice for the same goods shipment, allowing
   multiple payments for a single shipment.

3. Falsely Described Goods and Services: Misrepresenting the quality, quantity, or type of
   goods to justify inflated or deflated payments.

4. Black Market Peso Exchange (BMPE): Drug proceeds in the US are used to purchase goods
   which are then shipped to drug-source countries and sold for local currency.

Red Flag Indicators:
- Significant discrepancy between invoice value and fair market value of goods
- Transactions involving high-risk jurisdictions without legitimate trade purpose
- Payments to or from third parties not named in trade documents
- Back-to-back letters of credit with similar amounts
- Complex trade finance structures without apparent business purpose
- Shell company involvement in trade transactions

Transaction Patterns: Large wire transfers to/from high-risk jurisdictions coinciding with
trade finance activity; round-number transactions inconsistent with commodity pricing.
    `.trim(),
  },
  {
    title: 'FinCEN Advisory FIN-2019-A003: Shell Companies and Beneficial Ownership',
    source: KnowledgeSource.FINCEN,
    category: TypologyCategory.SHELL_COMPANIES,
    documentId: 'FIN-2019-A003',
    publicationDate: '2019-05-06',
    jurisdiction: 'US',
    riskLevel: RiskLevel.CRITICAL,
    regulatoryRef: 'FIN-2019-A003',
    content: `
Shell companies are legal entities that have no active business operations or significant assets.
While they have legitimate uses, they are frequently misused to conceal beneficial ownership and
launder illicit funds.

Key Abuse Patterns:
1. Layered Ownership Structures: Multiple layers of companies across jurisdictions to obscure
   true beneficial owners. Typical structure: Individual → Holding Co (BVI) → Operating Co (DE)
   → US Bank Account.

2. Nominee Directors/Shareholders: Using third parties to appear as the company's officers
   while concealing the true beneficial owner.

3. Anonymous Land Purchases: Using shell companies to purchase real estate to avoid disclosure
   of the buyer's identity (Geographic Targeting Orders issued for major US markets).

Red Flag Indicators:
- Entity registered in high-secrecy jurisdiction (BVI, Cayman, Panama, Delaware without
  beneficial ownership disclosure)
- Ownership structure involving 3+ layers without apparent business rationale
- Company with no employees, no revenue, but significant transaction volumes
- Multiple unrelated businesses sharing same registered agent/address
- Reluctance to provide beneficial ownership information
- Transactions between related shell entities without clear commercial purpose

Transaction Signature: High-volume wire transfers between entities sharing common beneficial
ownership indicators, often involving round amounts and immediate onward transmission.
    `.trim(),
  },
  {
    title: 'FinCEN Advisory FIN-2022-A001: Cryptocurrency Money Laundering',
    source: KnowledgeSource.FINCEN,
    category: TypologyCategory.CRYPTO,
    documentId: 'FIN-2022-A001',
    publicationDate: '2022-03-07',
    jurisdiction: 'US',
    riskLevel: RiskLevel.HIGH,
    regulatoryRef: 'FIN-2022-A001',
    content: `
Virtual currency presents unique money laundering risks due to pseudonymity, speed of
transactions, and cross-border accessibility. FinCEN has observed the following typologies.

Typologies:
1. Chain Hopping: Converting cryptocurrencies through multiple platforms and coin types
   to obscure transaction trail. e.g., BTC → ETH → Monero → back to BTC.

2. Mixing/Tumbling Services: Using cryptocurrency mixing services that pool and redistribute
   funds from multiple users to break the transaction chain.

3. DeFi Layering: Using decentralized exchanges and protocols to layer transactions without
   KYC requirements.

4. Peer-to-Peer Exchanges: Using unregistered P2P exchanges to convert crypto to fiat or
   vice versa, bypassing regulated exchange AML controls.

5. NFT Wash Trading: Using non-fungible tokens to launder funds through self-dealing
   transactions that create artificial value.

Red Flag Indicators:
- Multiple conversions between cryptocurrencies within short timeframe (chain hopping)
- Use of privacy coins (Monero, Zcash) for large transactions
- Transactions flowing through mixing service addresses (flagged in OFAC SDN list)
- Large cryptocurrency purchases followed by immediate withdrawal to external wallets
- Multiple unhosted wallets conducting frequent transactions with exchanges

Regulatory Note: Cryptocurrency exchanges operating in the US are Money Services Businesses
under the Bank Secrecy Act and must implement AML programs, file SARs, and comply with
Travel Rule requirements for transactions ≥$3,000.
    `.trim(),
  },
  {
    title: 'FinCEN Advisory FIN-2018-A007: Cyber-Enabled Financial Crime',
    source: KnowledgeSource.FINCEN,
    category: TypologyCategory.CYBER,
    documentId: 'FIN-2018-A007',
    publicationDate: '2018-10-25',
    jurisdiction: 'US',
    riskLevel: RiskLevel.CRITICAL,
    regulatoryRef: 'FIN-2018-A007',
    content: `
Cyber-enabled financial crime encompasses business email compromise (BEC), account takeover
fraud, ransomware, and other cyber threats that facilitate money laundering.

Business Email Compromise (BEC):
- Fraudsters compromise or spoof executive email accounts to authorize fraudulent wire transfers
- Average BEC loss: $120,000 per incident (2021 FBI IC3 report)
- Funds typically routed to domestic accounts then rapidly wired internationally

Money Mule Activity:
- Recruited individuals receive fraudulent funds and forward them to overseas accounts
- Mules often unaware they are participating in criminal activity
- Characteristics: recently opened account, receives large deposits then immediately transfers out
- Common in romance scams, lottery scams, work-from-home schemes

Account Takeover Patterns:
- Sudden address changes followed by high-value transfers
- Login from new devices/geographies followed by wire activity
- Multiple failed login attempts preceding successful authentication and transfer

Ransomware Proceeds Laundering:
- Ransom paid in cryptocurrency, immediately moved through chain hopping
- Converted at exchanges with weak AML controls in high-risk jurisdictions
- May involve OFAC-sanctioned entities (e.g., Darkside, REvil affiliates)

SAR Filing Guidance: Report BEC-related suspicious activity using keyword "BEC" in SAR
narrative. Include IP addresses, email domains, and beneficiary account information.
    `.trim(),
  },
];
