
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const requiredVariables = ["PORT", "DATABASE_URL", "JWT_SECRET"];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid port number.");
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port,
  databaseUrl: process.env.DATABASE_URL,

  frontendUrls: (
    process.env.FRONTEND_URL || "http://localhost:5173"
  )
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),

  // Kafka configuration
  kafkaBrokers: (
    process.env.KAFKA_BROKERS || "localhost:9092"
  )
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean),

  kafkaClientId:
    process.env.KAFKA_CLIENT_ID || "inventory-backend",

  kafkaTopic:
    process.env.KAFKA_TOPIC || "inventory-events",

  kafkaGroupId:
    process.env.KAFKA_GROUP_ID || "inventory-consumer-group",

  kafkaSaslUsername: process.env.KAFKA_SASL_USERNAME || "",
  kafkaSaslPassword: process.env.KAFKA_SASL_PASSWORD || "",

  kafkaSaslMechanism: (
    process.env.KAFKA_SASL_MECHANISM || "scram-sha-256"
  ).toLowerCase(),

  kafkaSsl: process.env.KAFKA_SSL === "true",

  // Authentication configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
