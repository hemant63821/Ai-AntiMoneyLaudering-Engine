export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  microservicePort: parseInt(process.env.MICROSERVICE_PORT, 10) || 3001,

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
    embeddingDimensions: parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS, 10) || 3072,
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    indexName: process.env.PINECONE_INDEX_NAME || 'aml-knowledge-base',
    environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
  },

  retrieval: {
    topK: parseInt(process.env.RETRIEVAL_TOP_K, 10) || 5,
    minScore: parseFloat(process.env.RETRIEVAL_MIN_SCORE) || 0.70,
  },

  namespaces: {
    fincen: process.env.NS_FINCEN || 'fincen-typologies',
    fatf: process.env.NS_FATF || 'fatf-guidance',
    sar: process.env.NS_SAR || 'sar-cases',
  },
});
