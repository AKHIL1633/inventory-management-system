
import { Kafka, logLevel } from "kafkajs";
import { createRequire } from "node:module";
import SnappyCodec from "kafkajs-snappy";

import { env } from "./env.js";

// Access KafkaJS's CommonJS exports for codec registration.
const require = createRequire(import.meta.url);

const {
  CompressionTypes,
  CompressionCodecs,
} = require("kafkajs");

// Register Snappy decompression support.
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

export const kafka = new Kafka({
  clientId: env.kafkaClientId,
  brokers: env.kafkaBrokers,
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
