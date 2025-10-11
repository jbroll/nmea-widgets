import type { ConnectionInterface } from './ConnectionInterface';

export class SerialConnection implements ConnectionInterface {
  private port: SerialPort | null = null;
  private messageCallback: ((data: string) => void) | null = null;
  private isReading: boolean = false;

  // Constants
  private static BAUD_RATE = 115200;

  static supported: boolean = 'serial' in navigator;

  static Id = 'serail';
  id: string = SerialConnection.Id;

  public async connect(): Promise<void> {
    if (!SerialConnection.supported) {
      throw new Error('Web Serial is not supported in this browser.');
    }

    if (this.isConnected()) {
      throw new Error('Already connected');
    }

    try {
      this.port = await navigator.serial.requestPort();

      await this.port.open({
        baudRate: SerialConnection.BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });

      if (!this.port.readable) {
        throw new Error('Port readable stream is undefined');
      }

      // Set up the streaming pipeline
      const decoder = new TextDecoderStream();
      let buffer = '';

      const lineBreakTransformer = new TransformStream({
        transform(chunk, controller) {
          buffer += chunk;
          const lines = buffer.split('\r\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
              controller.enqueue(trimmed);
            }
          }
        },
        flush(controller) {
          if (buffer.length > 0) {
            const trimmed = buffer.trim();
            if (trimmed.length > 0) {
              controller.enqueue(trimmed);
            }
          }
        },
      });

      this.isReading = true;

      this.port.readable
        .pipeThrough(decoder)
        .pipeThrough(lineBreakTransformer)
        .pipeTo(
          new WritableStream({
            write: (line: string) => {
              if (this.isReading && this.messageCallback) {
                this.messageCallback(line);
              }
            },
            abort: (reason) => {
              console.error(new Error(`Stream aborted: ${reason}`));
            },
          }),
        )
        .catch((error) => {
          console.error(error instanceof Error ? error : new Error('Stream error'));
        });
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  public onMessage(callback: (data: string) => void) {
    this.messageCallback = callback;
  }

  private async cleanup() {
    this.isReading = false;

    if (this.port) {
      // First try to cancel any ongoing reads
      if (this.port.readable) {
        try {
          await this.port.readable.cancel();
        } catch (_e) {
          // console.error(`Readable cancel failed: ${e}`);
        }
      }

      // Then try to abort any writes
      if (this.port.writable) {
        try {
          await this.port.writable.abort();
        } catch (_e) {
          // console.error(`Writable abort failed: ${e}`);
        }
      }

      // Try to force forget the port
      try {
        await this.port.forget();
      } catch (_e) {
        // console.error(`Port forget failed: ${e}`);
      }

      // Finally try to close the port
      try {
        await this.port.close();
      } catch (_e) {
        // console.error(`Port close failed: ${e}`);
      }

      this.port = null;
    }
  }

  public async disconnect() {
    this.isReading = false;
    await this.cleanup();
  }

  public async sendCommand(command: string) {
    if (!this.port?.writable) {
      throw new Error('Not connected');
    }

    try {
      const encoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(encoder.encode(`${command}\r\n`));
      writer.releaseLock();
    } catch (error) {
      console.error(error instanceof Error ? error : new Error('Write error'));
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.port !== null && this.isReading;
  }
}
