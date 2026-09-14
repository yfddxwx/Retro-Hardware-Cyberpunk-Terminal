/**
 * History Manager for Retro Hardware Terminal with LocalStorage persistence
 */

export interface HistoryItem {
  id: string;
  timestamp: string;
  mode: string;
  input: string;
  output: string;
  byteLength: number;
}

const STORAGE_KEY = 'retro_terminal_history_v1';
const MAX_HISTORY = 40;

export class HistoryManager {
  public static getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as HistoryItem[];
    } catch {
      return [];
    }
  }

  public static addEntry(mode: string, input: string, output: string): HistoryItem {
    const list = this.getHistory();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

    const item: HistoryItem = {
      id: 'REC_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: timeStr,
      mode,
      input,
      output,
      byteLength: new TextEncoder().encode(output).length
    };

    list.unshift(item);
    if (list.length > MAX_HISTORY) {
      list.pop();
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage quota or access warning:', e);
    }

    return item;
  }

  public static deleteEntry(id: string): void {
    const list = this.getHistory().filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn(e);
    }
  }

  public static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  }
}
