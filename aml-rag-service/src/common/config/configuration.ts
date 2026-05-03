export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  microservicePort: parseInt(process.env.MICROSERVICE_PORT, 10) || 3001,

  voyage: {
    apiKey: process.env.VOYAGE_API_KEY,
    embeddingModel: process.env.VOYAGE_EMBEDDING_MODEL || "voyage-finance-2",
    embeddingDimensions:
      parseInt(process.env.VOYAGE_EMBEDDING_DIMENSIONS, 10) || 1024,
  },

  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    completionModel: process.env.GOOGLE_COMPLETION_MODEL || "gemini-2.0-flash",
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    indexName: process.env.PINECONE_INDEX_NAME || "aml-knowledge-base",
    environment: process.env.PINECONE_ENVIRONMENT || "us-east-1",
  },

  retrieval: {
    topK: parseInt(process.env.RETRIEVAL_TOP_K, 10) || 5,
    minScore: parseFloat(process.env.RETRIEVAL_MIN_SCORE) || 0.7,
  },

  namespaces: {
    fincen: process.env.NS_FINCEN || "fincen-typologies",
    fatf: process.env.NS_FATF || "fatf-guidance",
    sar: process.env.NS_SAR || "sar-cases",
  },
});
