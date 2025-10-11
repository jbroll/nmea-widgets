export interface ConnectionType {
  id: string;
  label: string;
  constructor: ConnectionConstructor;
  isSupported: boolean;
}

export interface ConnectionInterface {
  id: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onMessage(callback: (data: string) => void): void;
  sendCommand(command: string): Promise<void>;
}

export interface ConnectionConstructor {
  new (): ConnectionInterface;
  supported: boolean;
}
