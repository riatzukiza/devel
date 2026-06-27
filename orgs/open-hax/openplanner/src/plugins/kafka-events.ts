import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { kafkaEventBusConfigFromEnv, OpenPlannerKafkaEventBus } from "../lib/kafka-events.js";

declare module "fastify" {
  interface FastifyInstance {
    kafkaEvents: OpenPlannerKafkaEventBus;
  }
}

export const kafkaEventsPlugin = fp(async (app: FastifyInstance) => {
  const bus = new OpenPlannerKafkaEventBus(kafkaEventBusConfigFromEnv(), app.log);
  app.decorate("kafkaEvents", bus);

  const status = bus.status();
  app.log.info({ enabled: status.enabled, brokers: status.brokers, topic: status.rawEventsTopic }, "kafka event bus configured");

  app.addHook("onClose", async () => {
    await bus.close();
  });
});
