
import { Kafka, logLevel } from "kafkajs";
import { createRequire } from "node:module";
import SnappyCodec from "kafkajs-snappy";

import { env } from "./env.js";

const require = createRequire(import.meta.url);

const { CompressionTypes, CompressionCodecs } = require("kafkajs");

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const hasUsername = Boolean(env.kafkaSaslUsername);
const hasPassword = Boolean(env.kafkaSaslPassword);

if (hasUsername !== hasPassword) {
  throw new Error(
    "Both KAFKA_SASL_USERNAME and KAFKA_SASL_PASSWORD must be provided."
  );
}

if (hasUsername && !env.kafkaSsl) {
  throw new Error(
    "KAFKA_SSL must be true when SASL authentication is enabled."
  );
}

const sasl = hasUsername
  ? {
      mechanism: env.kafkaSaslMechanism,
      username: env.kafkaSaslUsername,
      password: env.kafkaSaslPassword,
    }
  : undefined;

export const kafka = new Kafka({
  clientId: env.kafkaClientId,
  brokers: env.kafkaBrokers,

  ...(sasl
    ? {
        ssl: true,
        sasl,
      }
    : {}),

  logLevel: logLevel.ERROR,

  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});

export const producer = kafka.producer();

export const consumer = kafka.consumer({
  groupId: env.kafkaGroupId,
});
