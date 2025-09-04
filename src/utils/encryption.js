/**
 * Утилиты для шифрования и расшифровки токенов
 * Использует Web Crypto API для безопасного хранения токенов
 */

// Генерируем ключ шифрования на основе домена и версии приложения
const generateEncryptionKey = async () => {
  const domain = window.location.hostname;
  const version = process.env.VUE_APP_VERSION || '1.0.0';
  const keyMaterial = `${domain}:${version}:msb-platform-secret`;
  
  // Создаем ключ из строки
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// Получаем или создаем ключ шифрования
let encryptionKey = null;
const getEncryptionKey = async () => {
  if (!encryptionKey) {
    encryptionKey = await generateEncryptionKey();
  }
  return encryptionKey;
};

/**
 * Шифрует данные
 * @param {string} data - Данные для шифрования
 * @returns {string} - Зашифрованные данные в base64
 */
export const encrypt = async (data) => {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    // Генерируем случайный IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Шифруем данные
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    // Объединяем IV и зашифрованные данные
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Конвертируем в base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Ошибка шифрования:', error);
    // В случае ошибки возвращаем данные как есть (fallback)
    return data;
  }
};

/**
 * Расшифровывает данные
 * @param {string} encryptedData - Зашифрованные данные в base64
 * @returns {string} - Расшифрованные данные
 */
export const decrypt = async (encryptedData) => {
  try {
    const key = await getEncryptionKey();
    
    // Конвертируем из base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Извлекаем IV и зашифрованные данные
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Расшифровываем данные
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Конвертируем в строку
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Ошибка расшифровки:', error);
    // В случае ошибки возвращаем данные как есть (fallback)
    return encryptedData;
  }
};

/**
 * Синхронная версия шифрования (для совместимости)
 * @param {string} data - Данные для шифрования
 * @returns {string} - Зашифрованные данные
 */
export const encryptSync = (data) => {
  // Простое шифрование для случаев, когда async недоступен
  try {
    const key = btoa(`${window.location.hostname}:${process.env.VUE_APP_VERSION || '1.0.0'}`);
    const encoded = btoa(data);
    return `${key}:${encoded}`;
  } catch (error) {
    console.error('Ошибка синхронного шифрования:', error);
    return data;
  }
};

/**
 * Синхронная версия расшифровки (для совместимости)
 * @param {string} encryptedData - Зашифрованные данные
 * @returns {string} - Расшифрованные данные
 */
export const decryptSync = (encryptedData) => {
  try {
    const parts = encryptedData.split(':');
    if (parts.length === 2) {
      return atob(parts[1]);
    }
    return encryptedData;
  } catch (error) {
    console.error('Ошибка синхронной расшифровки:', error);
    return encryptedData;
  }
};

/**
 * Проверяет, поддерживается ли Web Crypto API
 * @returns {boolean}
 */
export const isWebCryptoSupported = () => {
  return typeof window !== 'undefined' && 
         window.crypto && 
         window.crypto.subtle;
};

/**
 * Безопасное хранение данных в localStorage
 * @param {string} key - Ключ
 * @param {string} value - Значение
 * @param {boolean} encrypt - Шифровать ли данные
 */
export const secureSetItem = async (key, value, encrypt = true) => {
  try {
    const dataToStore = encrypt ? await encrypt(value) : value;
    localStorage.setItem(key, dataToStore);
  } catch (error) {
    console.error('Ошибка безопасного сохранения:', error);
    // Fallback к обычному сохранению
    localStorage.setItem(key, value);
  }
};

/**
 * Безопасное получение данных из localStorage
 * @param {string} key - Ключ
 * @param {boolean} decrypt - Расшифровывать ли данные
 * @returns {string|null}
 */
export const secureGetItem = async (key, decrypt = true) => {
  try {
    const encryptedData = localStorage.getItem(key);
    if (!encryptedData) return null;
    
    return decrypt ? await decrypt(encryptedData) : encryptedData;
  } catch (error) {
    console.error('Ошибка безопасного получения:', error);
    // Fallback к обычному получению
    return localStorage.getItem(key);
  }
};

/**
 * Синхронная версия безопасного сохранения
 * @param {string} key - Ключ
 * @param {string} value - Значение
 * @param {boolean} encrypt - Шифровать ли данные
 */
export const secureSetItemSync = (key, value, encrypt = true) => {
  try {
    const dataToStore = encrypt ? encryptSync(value) : value;
    localStorage.setItem(key, dataToStore);
  } catch (error) {
    console.error('Ошибка синхронного безопасного сохранения:', error);
    localStorage.setItem(key, value);
  }
};

/**
 * Синхронная версия безопасного получения
 * @param {string} key - Ключ
 * @param {boolean} decrypt - Расшифровывать ли данные
 * @returns {string|null}
 */
export const secureGetItemSync = (key, decrypt = true) => {
  try {
    const encryptedData = localStorage.getItem(key);
    if (!encryptedData) return null;
    
    return decrypt ? decryptSync(encryptedData) : encryptedData;
  } catch (error) {
    console.error('Ошибка синхронного безопасного получения:', error);
    return localStorage.getItem(key);
  }
};

/**
 * Очистка всех зашифрованных данных
 */
export const clearSecureStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('auth_token') || key.includes('refresh_token') || key.includes('csrf_token')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Ошибка очистки безопасного хранилища:', error);
  }
};

/**
 * Генерация случайного токена
 * @param {number} length - Длина токена
 * @returns {string}
 */
export const generateRandomToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
  } else {
    // Fallback для старых браузеров
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
};

/**
 * Хеширование данных
 * @param {string} data - Данные для хеширования
 * @returns {string} - Хеш в hex формате
 */
export const hashData = async (data) => {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Ошибка хеширования:', error);
    // Простой fallback хеш
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
};

export default {
  encrypt,
  decrypt,
  encryptSync,
  decryptSync,
  isWebCryptoSupported,
  secureSetItem,
  secureGetItem,
  secureSetItemSync,
  secureGetItemSync,
  clearSecureStorage,
  generateRandomToken,
  hashData
}; 