import { useState, useEffect, useCallback } from 'react';
import { ConnectionInterface, ConnectionType } from './ConnectionInterface';
import { ConnectionFactory } from './ConnectionFactory';
import { NMEAAccumulator } from './NMEAAccumulator';

export interface NMEAState {
  serialData: string;
  processedData: any;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  supportedTypes: ConnectionType[];
}

interface SentenceFilter {
  [key: string]: boolean;
}

// Keep singleton state to share across hook instances
let globalConnection: ConnectionInterface | null = null;
let globalAccumulator: NMEAAccumulator | null = null;
let globalSerialData = '';
let globalState: NMEAState = {
  serialData: '',
  processedData: {},
  isConnected: false,
  isConnecting: false,
  error: null,
  supportedTypes: []
};
let listeners = new Set<(state: NMEAState) => void>();

// Initialize filters with default values
let sentenceFilters: SentenceFilter = {
  'GGA': true,
  'GST': true,
  'GSA': true,
  'GSV_GP': true,
  'GSV_GL': true,
  'GSV_GA': true,
  'GSV_GB': true
};

const MAX_SERIAL_LINES = 100;

const shouldShowSentence = (sentence: string): boolean => {
  if (!sentence.startsWith('$')) return false;
  
  const parts = sentence.split(',');
  if (parts.length < 1) return false;
  
  const header = parts[0].substring(1); // Remove $
  const messageType = header.substring(2); // Get message type (after talker ID)
  const talkerId = header.substring(0, 2); // Get talker ID
  
  // Special handling for GSV messages
  if (messageType === 'GSV') {
    const filterId = `GSV_${talkerId}`;
    return sentenceFilters[filterId] ?? false;
  }
  
  // Regular message types
  return sentenceFilters[messageType] ?? false;
};

export function useNMEA() {
  const [state, setState] = useState<NMEAState>({
    ...globalState,
    supportedTypes: ConnectionFactory.getConnectionTypes()
  });

  // Listen for state updates
  useEffect(() => {
    const updateState = (newState: NMEAState) => {
      setState(newState);
    };

    listeners.add(updateState);
    return () => {
      listeners.delete(updateState);
    };
  }, []);

  // Update global state and notify listeners
  const updateGlobalState = useCallback((update: Partial<NMEAState>) => {
    globalState = { ...globalState, ...update };
    listeners.forEach(listener => listener(globalState));
  }, []);

  const updateSerialData = useCallback((data: string) => {
    if (!shouldShowSentence(data)) return;

    const lines = globalSerialData.split('\n');
    lines.push(data);
    if (lines.length > MAX_SERIAL_LINES) {
      lines.shift();
    }
    globalSerialData = lines.join('\n');
    updateGlobalState({ serialData: globalSerialData });
  }, []);

  const setFilter = useCallback((sentenceType: string, enabled: boolean) => {
    sentenceFilters[sentenceType] = enabled;
    
    // Clear existing data when filter changes
    globalSerialData = '';
    updateGlobalState({ serialData: '' });
  }, []);

  const connect = useCallback(async (type: ConnectionType) => {
    if (state.isConnected) {
      await disconnect();
      return;
    }

    if (state.isConnecting) return;

    updateGlobalState({ isConnecting: true, error: null });

    try {
      if (!globalConnection) {
        globalConnection = ConnectionFactory.createConnection(type);
      }
      if (!globalAccumulator) {
        globalAccumulator = new NMEAAccumulator();
      }

      // Set up message handling
      globalConnection.onMessage((data: string) => {
        updateSerialData(data);
        
        if (data.startsWith('$') && globalAccumulator) {
          try {
            globalAccumulator.process(data);
            const processedData = globalAccumulator.getData();
            updateGlobalState({ processedData });
          } catch (e) {
            console.error('Error processing NMEA sentence:', e);
          }
        }
      });

      await globalConnection.connect();

      updateGlobalState({
        isConnected: true,
        isConnecting: false
      });
    } catch (error) {
      await disconnect();
      updateGlobalState({
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  }, [state.isConnected, state.isConnecting]);

  const disconnect = useCallback(async () => {
    if (globalConnection?.isConnected()) {
      try {
        await globalConnection.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }

    // Reset connection but keep accumulated data
    globalConnection = null;
    updateGlobalState({
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  const sendCommand = useCallback(async (command: string) => {
    if (!globalConnection?.isConnected()) {
      throw new Error('Not connected');
    }
    
    try {
      await globalConnection.sendCommand(command);
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendCommand,
    setFilter,
    connection: globalConnection,
    supportedTypes: ConnectionFactory.getConnectionTypes()
  };
}
