import { RawData, WebSocket } from 'ws';

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Set<WebSocket> = new Set();
  private subscriptions: Map<WebSocket, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public register(ws: WebSocket) {
    this.connections.add(ws);
    this.subscriptions.set(ws, new Set());

    ws.on('message', (message: RawData) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'subscribe' && typeof parsed.topic === 'string') {
          this.subscriptions.get(ws)?.add(parsed.topic);
        } else if (parsed.type === 'unsubscribe' && typeof parsed.topic === 'string') {
          this.subscriptions.get(ws)?.delete(parsed.topic);
        }
      } catch (err) {
        // ignore malformed ws messages
      }
    });

    ws.on('close', () => {
      this.connections.delete(ws);
      this.subscriptions.delete(ws);
    });
  }

  public broadcast(topic: string, event: string, data: any) {
    const payload = JSON.stringify({ topic, event, data });
    for (const ws of this.connections) {
      if (ws.readyState === ws.OPEN) {
        const subs = this.subscriptions.get(ws);
        // If subscribed to this topic or no topic restriction
        if (!topic || subs?.has(topic)) {
          ws.send(payload);
        }
      }
    }
  }

  // Helper to send straight to all
  public broadcastAll(event: string, data: any) {
    const payload = JSON.stringify({ event, data });
    for (const ws of this.connections) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  }
}
