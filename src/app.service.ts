import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class AppService {
  constructor(private eventEmitter: EventEmitter2) { }

  @OnEvent('order.created', { async: true })
  handleOrderCreatedEvent(payload: any) {
    // handle and process "OrderCreatedEvent" event
  }
}
