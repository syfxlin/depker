import { EventEmitterModule } from "@nestjs/event-emitter";

export const events = EventEmitterModule.forRoot({
  wildcard: true,
  maxListeners: 30,
  verboseMemoryLeak: true,
  ignoreErrors: false,
});
