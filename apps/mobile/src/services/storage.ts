import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHistoryItem, Product, PriceEstimate } from '../types';

const HISTORY_KEY = '@scan2market:history';
const SETTINGS_KEY = '@scan2market:settings';
const MAX_HISTORY_ITEMS = 50;

interface Settings {
  zipCode?: string;
  radius?: number;
}

class StorageService {
  /**
   * Get scan history
   */
  async getHistory(): Promise<ScanHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Add item to scan history
   */
  async addToHistory(
    barcode: string,
    product: Product,
    priceEstimate?: PriceEstimate,
    zipCode?: string
  ): Promise<void> {
    try {
      const history = await this.getHistory();

      // Check if item already exists
      const existingIndex = history.findIndex(item => item.barcode === barcode);
      if (existingIndex !== -1) {
        // Update existing item
        history[existingIndex] = {
          ...history[existingIndex],
          product,
          priceEstimate,
          scannedAt: new Date().toISOString(),
          zipCode
        };
      } else {
        // Add new item
        const newItem: ScanHistoryItem = {
          id: `${Date.now()}-${barcode}`,
          barcode,
          product,
          priceEstimate,
          scannedAt: new Date().toISOString(),
          zipCode
        };
        history.unshift(newItem);
      }

      // Limit history size
      const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  /**
   * Update history item with new price estimate
   */
  async updateHistoryItem(
    barcode: string,
    priceEstimate: PriceEstimate
  ): Promise<void> {
    try {
      const history = await this.getHistory();
      const index = history.findIndex(item => item.barcode === barcode);

      if (index !== -1) {
        history[index].priceEstimate = priceEstimate;
        history[index].scannedAt = new Date().toISOString();
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('Error updating history item:', error);
    }
  }

  /**
   * Delete item from history
   */
  async deleteFromHistory(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filtered = history.filter(item => item.id !== id);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting from history:', error);
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<Settings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  /**
   * Save user settings
   */
  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
}

export const storageService = new StorageService();
