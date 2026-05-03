const { VoyageAIClient } = require("voyageai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testVoyage() {
  console.log("\n--- VoyageAI ---");
  const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  console.log("Model:", process.env.VOYAGE_EMBEDDING_MODEL || "voyage-finance-2");
  const response = await client.embed({
    input: "AML test connection",
    model: process.env.VOYAGE_EMBEDDING_MODEL || "voyage-finance-2",
  });
  console.log("Connected! Embedding dimensions:", response.data[0].embedding.length);
  console.log("Tokens used:", response.usage?.totalTokens ?? response.usage?.total_tokens ?? "n/a");
}

async function testGemini() {
  console.log("\n--- Google Gemini ---");
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set in .env");

  const model = process.env.GOOGLE_COMPLETION_MODEL || "gemini-2.0-flash";
  console.log("Model:", model);

  const genai = new GoogleGenerativeAI(apiKey);
  const gemini = genai.getGenerativeModel({ model });
  const result = await gemini.generateContent("Reply with just: OK");
  console.log("Connected! Response:", result.response.text().trim());
}

async function run() {
  let failed = false;

  await testVoyage().catch((err) => {
    console.error("VoyageAI failed:", err.message);
    failed = true;
  });

  await testGemini().catch((err) => {
    console.error("Gemini failed:", err.message);
    failed = true;
  });

  if (failed) process.exit(1);
}

run();
