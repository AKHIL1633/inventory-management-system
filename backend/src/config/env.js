
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

const requiredVariables = [
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT),

  databaseUrl: process.env.DATABASE_URL,

  frontendUrl:
    process.env.FRONTEND_URL || "http://localhost:5173",

  // Kafka configuration
  kafkaBrokers: (
    process.env.KAFKA_BROKERS || "localhost:9092"
  )
    .split(",")
    .map((broker) => broker.trim()),

  kafkaClientId:
    process.env.KAFKA_CLIENT_ID || "inventory-backend",

  kafkaTopic:
    process.env.KAFKA_TOPIC || "inventory-events",

  kafkaGroupId:
    process.env.KAFKA_GROUP_ID || "inventory-consumer-group",

  // Authentication configuration
  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
