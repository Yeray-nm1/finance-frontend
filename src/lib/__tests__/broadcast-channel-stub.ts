/** Doble de BroadcastChannel para unitarios: simula canales de otras pestañas del mismo origen. */
type Listener = (event: MessageEvent<unknown>) => void;

export class BroadcastChannelStub {
  static instances: BroadcastChannelStub[] = [];

  readonly name: string;
  readonly posted: unknown[] = [];
  onmessage: Listener | null = null;
  closed = false;

  constructor(name: string) {
    this.name = name;
    BroadcastChannelStub.instances.push(this);
  }

  postMessage(data: unknown): void {
    this.posted.push(data);
    // El emisor no recibe su propio mensaje, pero sí los demás canales del mismo nombre.
    for (const other of BroadcastChannelStub.instances) {
      if (other !== this && other.name === this.name && !other.closed) {
        other.onmessage?.({ data } as MessageEvent<unknown>);
      }
    }
  }

  close(): void {
    this.closed = true;
  }

  static reset(): void {
    BroadcastChannelStub.instances = [];
  }
}
