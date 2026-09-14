/**
 * Converter Engine: Hex, Base64, Morse Code and Cyberpunk Data Generator
 */

// 摩尔斯电码对照表
const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};

const REVERSE_MORSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [char, morse]) => {
    acc[morse] = char;
    return acc;
  },
  {} as Record<string, string>
);

export class Converter {
  /**
   * 字符串转为 UTF-8 字节数组
   */
  private static stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * 字节数组转为字符串
   */
  private static bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  // --- 1. HEX 转换 ---
  public static textToHex(text: string, formatted = false): string {
    const bytes = this.stringToBytes(text);
    if (!formatted) {
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
    }

    // 格式化为古董终端标准 Hex Dump (Offset | Hex bytes | ASCII)
    const lines: string[] = [];
    const chunkSize = 16;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const offset = i.toString(16).padStart(8, '0').toUpperCase();
      const hexPart = Array.from(chunk)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ')
        .padEnd(chunkSize * 3, ' ');

      const asciiPart = Array.from(chunk)
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('');

      lines.push(`${offset}  ${hexPart} |${asciiPart}|`);
    }
    return lines.join('\n');
  }

  public static hexToText(hex: string): string {
    // 过滤掉 Hex Dump 中的地址头与 ASCII 区域、分隔符
    // 清理所有非十六进制字符
    const cleanHex = hex
      .replace(/^[\da-fA-F]{8}\s+/gm, '') // 去除 00000010 偏移量
      .replace(/\|.*?\|/gm, '')           // 去除 |ascii| 区域
      .replace(/[^0-9a-fA-F]/g, '');

    if (cleanHex.length % 2 !== 0) {
      throw new Error('HEX_LENGTH_INVALID: Hex string must have even byte count');
    }

    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return this.bytesToString(bytes);
  }

  // --- 2. BASE64 转换 ---
  public static textToBase64(text: string): string {
    const bytes = this.stringToBytes(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public static base64ToText(b64: string): string {
    const clean = b64.trim().replace(/\s+/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return this.bytesToString(bytes);
  }

  // --- 3. 摩尔斯电码转换 ---
  public static textToMorse(text: string): string {
    const words = text.toUpperCase().split(/\s+/);
    return words
      .map((word) => {
        return word
          .split('')
          .map((char) => MORSE_MAP[char] || '?')
          .join(' ');
      })
      .join(' / ');
  }

  public static morseToText(morse: string): string {
    const words = morse.trim().split(/\s*\/\s*|\s{3,}/);
    return words
      .map((word) => {
        return word
          .trim()
          .split(/\s+/)
          .map((code) => REVERSE_MORSE_MAP[code] || '?')
          .join('');
      })
      .join(' ');
  }

  // --- 4. 二进制 (BINARY) 转换 ---
  public static textToBinary(text: string): string {
    const bytes = this.stringToBytes(text);
    return Array.from(bytes)
      .map((b) => b.toString(2).padStart(8, '0'))
      .join(' ');
  }

  public static binaryToText(bin: string): string {
    const clean = bin.replace(/[^01]/g, '');
    if (clean.length === 0) return '';
    if (clean.length % 8 !== 0) {
      throw new Error('BIN_LENGTH_INVALID: Binary bitstream must be multiples of 8 bits');
    }
    const bytes = new Uint8Array(clean.length / 8);
    for (let i = 0; i < clean.length; i += 8) {
      bytes[i / 8] = parseInt(clean.substring(i, i + 8), 2);
    }
    return this.bytesToString(bytes);
  }

  // --- 5. 经典密码学 ROT13 加密/解密 ---
  public static rot13(text: string): string {
    return text.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
  }

  // --- 6. 赛博工业数据生成器 ---
  public static generateHexDump(bytesCount = 64): string {
    const bytes = new Uint8Array(bytesCount);
    crypto.getRandomValues(bytes);

    const lines: string[] = [];
    const chunkSize = 16;
    const baseAddr = Math.floor(Math.random() * 0xF00000) + 0x100000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const offset = (baseAddr + i).toString(16).padStart(8, '0').toUpperCase();
      const hexPart = Array.from(chunk)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ')
        .padEnd(chunkSize * 3, ' ');

      const asciiPart = Array.from(chunk)
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('');

      lines.push(`${offset}  ${hexPart} |${asciiPart}|`);
    }
    return lines.join('\n');
  }

  public static generateCyberPacket(): string {
    const nodes = ['CORE-01', 'SUB-NET-09', 'NEXUS-8', 'MAINFRAME', 'SAT-RELAY', 'ORBITAL-7'];
    const protocols = ['MIL-STD-1553', 'X.25', 'ARPANET-RAW', 'NEUROLINK-V2', 'CYBER-TELNET'];
    const statusCodes = ['ARMED', 'SYNCHRONIZED', 'ENCRYPTED', 'CARRIER_OK', 'DIVERGENT'];

    const randNode = nodes[Math.floor(Math.random() * nodes.length)];
    const randProto = protocols[Math.floor(Math.random() * protocols.length)];
    const randStatus = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const randHexKey = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    const randTemp = (30 + Math.random() * 25).toFixed(1);
    const timeStr = new Date().toISOString();

    return `--- INCOMING PACKET STREAM ---
[TIMESTAMP]: ${timeStr}
[SOURCE]   : ${randNode}
[PROTOCOL] : ${randProto}
[SECURITY] : CIPHER-KEY 0x${randHexKey}
[TELEMETRY]: CORE_TEMP=${randTemp}°C | PWR_LINE=98.4%
[STATUS]   : ${randStatus}
[PAYLOAD]  : READY_FOR_HANDSHAKE`;
  }

  public static calculateTelemetry(input: string): { length: number; crc32: string; xorChecksum: string } {
    const bytes = this.stringToBytes(input);
    let xor = 0;
    for (let i = 0; i < bytes.length; i++) {
      xor ^= bytes[i];
    }

    // CRC32 计算
    let crc = 0 ^ -1;
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
    }
    crc = (crc ^ -1) >>> 0;

    return {
      length: bytes.length,
      crc32: '0x' + crc.toString(16).toUpperCase().padStart(8, '0'),
      xorChecksum: '0x' + xor.toString(16).toUpperCase().padStart(2, '0')
    };
  }
}

// CRC32 预置表
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}
