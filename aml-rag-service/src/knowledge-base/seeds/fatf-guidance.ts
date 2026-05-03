import { KnowledgeSource, TypologyCategory, RiskLevel } from '../../common/types/aml.types';
import { IngestDocumentDto } from '../dto/ingest-document.dto';

export const FATF_GUIDANCE: IngestDocumentDto[] = [
  {
    title: 'FATF Guidance: Money Laundering through the Real Estate Sector',
    source: KnowledgeSource.FATF,
    category: TypologyCategory.REAL_ESTATE,
    documentId: 'FATF-REAL-ESTATE-2022',
    publicationDate: '2022-07-01',
    jurisdiction: 'GLOBAL',
    riskLevel: RiskLevel.HIGH,
    regulatoryRef: 'FATF-2022-REAL-ESTATE',
    content: `
Real estate is a high-risk sector for money laundering due to the large transaction values,
complexity of transactions, and the ability to hold value in physical assets.

Typologies identified by FATF:
1. All-Cash Purchases: Purchasing property with cash or near-cash instruments to avoid
   financial institution scrutiny. Often facilitated through shell companies or trusts.

2. Mortgage Fraud: Inflating property value to obtain larger mortgage, then defaulting
   or repaying with illicit funds.

3. Property Flipping: Rapidly buying and selling property to generate seemingly legitimate
   income. May involve falsified renovation records.

4. Rental Income Manipulation: Reporting false rental income to justify otherwise unexplained
   funds. Shell companies used as "tenants."

Geographic Risk Factors:
- Markets with high-value luxury real estate (NY, Miami, LA, London, Dubai, Singapore)
- Jurisdictions with weak beneficial ownership registries
- Markets with high foreign investment without source of funds scrutiny

Risk Indicators for Financial Institutions:
- Client unwilling to provide source of funds documentation
- Third-party payments (funds from entities not party to the transaction)
- Transaction structure significantly above or below market value
- Unusually short holding periods (< 6 months) with significant price appreciation
- Client insists on all-cash transaction when financing is available
- Use of legal professional to conduct transactions (potential for legal privilege misuse)

FATF Recommendation 22 requires real estate agents, notaries, and lawyers involved in
real estate transactions to implement customer due diligence and report suspicious transactions.
    `.trim(),
  },
  {
    title: 'FATF Report: Correspondent Banking Services — AML/CFT Risks',
    source: KnowledgeSource.FATF,
    category: TypologyCategory.CORRESPONDENT_BANKING,
    documentId: 'FATF-CORR-BANK-2016',
    publicationDate: '2016-10-27',
    jurisdiction: 'GLOBAL',
    riskLevel: RiskLevel.HIGH,
    regulatoryRef: 'FATF-2016-CORR-BANKING',
    content: `
Correspondent banking relationships allow banks to provide services to their respondent banks'
customers in jurisdictions where they do not have a physical presence. This creates significant
ML/TF risks when due diligence on respondents or their customers is insufficient.

Key Risk Factors:
1. Shell Bank Risk: Correspondent relationships with institutions without physical presence
   in the country of license (prohibited under FATF Recommendation 13).

2. Nested Correspondent Accounts: Respondent bank provides correspondent services to
   other banks, creating opacity about ultimate account holders.

3. Payable Through Accounts (PTAs): Foreign customers given direct access to correspondent
   bank's payment systems, bypassing CDD.

4. High-Risk Jurisdiction Exposure: Respondent banks in FATF-identified high-risk
   jurisdictions (currently: North Korea, Iran, Myanmar, and others on grey/black lists).

Transaction Red Flags:
- Rapid movement of large funds through correspondent accounts with no apparent commercial purpose
- Transactions inconsistent with respondent bank's known business profile
- Large volumes of transactions from or to high-risk jurisdictions
- Transactions structured to avoid SWIFT MT103 disclosures
- Multiple currency conversions within correspondent accounts
- Concentration risk: large percentage of respondent's business from single customer or sector

FATF Recommendation 13: Banks should not enter into or continue correspondent relationships
with shell banks. They should take measures to ensure that respondent institutions do not
permit their accounts to be used by shell banks.

De-Risking Concern: FATF acknowledges that wholesale de-risking of correspondent banking
relationships may itself create ML/TF risk by driving transactions to unregulated channels.
    `.trim(),
  },
  {
    title: 'FATF Typologies: Layering Techniques in Professional Money Laundering Networks',
    source: KnowledgeSource.FATF,
    category: TypologyCategory.LAYERING,
    documentId: 'FATF-LAYERING-2021',
    publicationDate: '2021-06-25',
    jurisdiction: 'GLOBAL',
    riskLevel: RiskLevel.CRITICAL,
    regulatoryRef: 'FATF-2021-LAYERING',
    content: `
Professional Money Laundering Networks (PMLNs) are specialized criminal organizations that
provide ML services to drug traffickers, fraud networks, and other criminal groups for a fee.

Layering Mechanisms:
1. Complex Corporate Structures: Interlocking companies across multiple jurisdictions.
   Funds flow: Crime → Offshore FI → BVI Holding → LLP → UK Solicitor Client Account → Asset.

2. Loan-Back Schemes: Criminal deposits funds in foreign account, then "borrows" own money
   back through a seemingly legitimate loan transaction.

3. Mirror Transactions: Identical or near-identical transactions in two different currencies
   or jurisdictions that cancel each other out.

4. Commingling: Mixing illicit funds with legitimate business revenue in a cash-intensive
   business (restaurant, car wash, nightclub).

5. Smurfing Networks: Coordinated use of multiple individuals to conduct multiple transactions
   below reporting thresholds, then aggregating funds.

Network Indicators:
- Multiple individuals conducting transactions on behalf of same beneficial owner
- Transactions across borders that mirror each other in timing and amount
- Use of professional intermediaries (lawyers, accountants) without apparent business rationale
- Complex loan arrangements between related entities with no commercial substance
- Cash-intensive business with revenues disproportionate to known customer base

FATF Recommendation 12 requires enhanced due diligence for politically exposed persons (PEPs),
who represent a significant proportion of PMLN clients due to access to state funds.
    `.trim(),
  },
  {
    title: 'FATF Guidance on Virtual Assets and VASPs — AML/CFT Standards',
    source: KnowledgeSource.FATF,
    category: TypologyCategory.CRYPTO,
    documentId: 'FATF-VASP-2021',
    publicationDate: '2021-10-28',
    jurisdiction: 'GLOBAL',
    riskLevel: RiskLevel.HIGH,
    regulatoryRef: 'FATF-2021-VA-VASP',
    content: `
FATF's updated guidance on virtual assets (VAs) and virtual asset service providers (VASPs)
extends Recommendations 10-21 to the virtual asset ecosystem.

Travel Rule for Virtual Assets (Recommendation 16):
VASPs must collect and transmit beneficiary and originator information for VA transfers ≥$1,000/€1,000.
This applies to transactions between VASPs and, in some jurisdictions, to unhosted wallet transfers.

High-Risk VA Scenarios:
1. Unhosted Wallets: Transfers to/from self-hosted wallets present increased risk due to
   inability to verify KYC of the counterparty.

2. Privacy-Enhancing Technologies: Transactions using privacy coins, mixers, or zero-knowledge
   proof protocols that intentionally obscure transaction trail.

3. DeFi Protocols: Decentralized exchanges and protocols that lack a clear VASP operator
   subject to AML/CFT obligations.

4. Cross-Chain Bridges: Infrastructure that moves assets between blockchains, creating
   traceability challenges similar to chain hopping.

Risk-Based Approach for VASPs:
- Apply enhanced due diligence for transactions > $1,000 involving unhosted wallets
- Screen all wallet addresses against OFAC SDN and other sanctions lists
- Implement blockchain analytics to identify high-risk wallet clusters
- Monitor for unusual patterns: rapid in-and-out, coin conversion chains, mixer service use

Jurisdictional Implementation: As of 2023, 75% of FATF members have partially implemented
VA/VASP requirements. Gaps in implementation create arbitrage opportunities for criminals
routing through non-compliant jurisdictions.
    `.trim(),
  },
];
