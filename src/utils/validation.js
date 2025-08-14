/**
 * Утилиты для валидации входных данных
 */

import { validationI18n } from './validation-i18n';

// Регулярные выражения для валидации
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  INN: /^\d{10,12}$/,
  KPP: /^\d{9}$/,
  OGRN: /^\d{13,15}$/,
  BANK_ACCOUNT: /^\d{20}$/,
  BIK: /^\d{9}$/,
  CORRESPONDENT_ACCOUNT: /^\d{20}$/,
  CARD_NUMBER: /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/,
  CVV: /^\d{3,4}$/,
  EXPIRY_DATE: /^(0[1-9]|1[0-2])\/\d{2}$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/.+/,
  FILE_EXTENSION: /\.(pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png|gif)$/i,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  POSTAL_CODE: /^\d{6}$/,
  PASSPORT: /^\d{4}\s\d{6}$/,
  SNILS: /^\d{3}-\d{3}-\d{3}\s\d{2}$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/
};

// Сообщения об ошибках
const ERROR_MESSAGES = {
  REQUIRED: 'Это поле обязательно для заполнения',
  INVALID_EMAIL: 'Введите корректный email адрес',
  INVALID_PHONE: 'Введите корректный номер телефона',
  INVALID_INN: 'ИНН должен содержать 10 или 12 цифр',
  INVALID_KPP: 'КПП должен содержать 9 цифр',
  INVALID_OGRN: 'ОГРН должен содержать 13 или 15 цифр',
  INVALID_BANK_ACCOUNT: 'Номер счета должен содержать 20 цифр',
  INVALID_BIK: 'БИК должен содержать 9 цифр',
  INVALID_CARD_NUMBER: 'Номер карты должен содержать 16 цифр',
  INVALID_CVV: 'CVV должен содержать 3-4 цифры',
  INVALID_EXPIRY_DATE: 'Введите дату в формате ММ/ГГ',
  INVALID_DATE: 'Введите дату в формате ГГГГ-ММ-ДД',
  INVALID_TIME: 'Введите время в формате ЧЧ:ММ',
  INVALID_UUID: 'Некорректный UUID',
  INVALID_URL: 'Введите корректный URL',
  INVALID_FILE_EXTENSION: 'Неподдерживаемый тип файла',
  MIN_LENGTH: (min) => `Минимальная длина: ${min} символов`,
  MAX_LENGTH: (max) => `Максимальная длина: ${max} символов`,
  MIN_VALUE: (min) => `Минимальное значение: ${min}`,
  MAX_VALUE: (max) => `Максимальное значение: ${max}`,
  RANGE: (min, max) => `Значение должно быть от ${min} до ${max}`,
  POSITIVE: 'Значение должно быть положительным',
  INTEGER: 'Значение должно быть целым числом',
  DECIMAL: 'Значение должно быть числом с десятичными знаками',
  FUTURE_DATE: 'Дата должна быть в будущем',
  PAST_DATE: 'Дата должна быть в прошлом',
  VALID_STATUS: (validStatuses) => `Статус должен быть одним из: ${validStatuses.join(', ')}`,
  VALID_ROLE: (validRoles) => `Роль должна быть одной из: ${validRoles.join(', ')}`
};

/**
 * Основной класс валидации
 */
export class Validator {
  constructor() {
    this.errors = new Map();
    this.customValidators = new Map();
  }

  /**
   * Добавить кастомный валидатор
   */
  addCustomValidator(fieldName, validator, message) {
    this.customValidators.set(fieldName, { validator, message });
  }

  /**
   * Очистить ошибки
   */
  clearErrors() {
    this.errors.clear();
  }

  /**
   * Получить все ошибки
   */
  getErrors() {
    return Object.fromEntries(this.errors);
  }

  /**
   * Проверить, есть ли ошибки
   */
  hasErrors() {
    return this.errors.size > 0;
  }

  /**
   * Получить ошибки для конкретного поля
   */
  getFieldErrors(fieldName) {
    return this.errors.get(fieldName) || [];
  }

  /**
   * Добавить ошибку для поля
   */
  addError(fieldName, message) {
    if (!this.errors.has(fieldName)) {
      this.errors.set(fieldName, []);
    }
    this.errors.get(fieldName).push(message);
  }

  /**
   * Валидация обязательного поля
   */
  required(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      this.addError(fieldName, ERROR_MESSAGES.REQUIRED);
      return false;
    }
    return true;
  }

  /**
   * Валидация email
   */
  email(value, fieldName) {
    if (value && !PATTERNS.EMAIL.test(value)) {
      this.addError(fieldName, ERROR_MESSAGES.INVALID_EMAIL);
      return false;
    }
    return true;
  }

  /**
   * Валидация телефона
   */
  phone(value, fieldName) {
    if (value && !PATTERNS.PHONE.test(value)) {
      this.addError(fieldName, ERROR_MESSAGES.INVALID_PHONE);
      return false;
    }
    return true;
  }

  /**
   * Валидация длины строки
   */
  length(value, fieldName, min, max) {
    if (value) {
      if (min && value.length < min) {
        this.addError(fieldName, ERROR_MESSAGES.MIN_LENGTH(min));
        return false;
      }
      if (max && value.length > max) {
        this.addError(fieldName, ERROR_MESSAGES.MAX_LENGTH(max));
        return false;
      }
    }
    return true;
  }

  /**
   * Валидация числового значения
   */
  number(value, fieldName, min, max) {
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        this.addError(fieldName, ERROR_MESSAGES.INTEGER);
        return false;
      }
      if (min !== undefined && num < min) {
        this.addError(fieldName, ERROR_MESSAGES.MIN_VALUE(min));
        return false;
      }
      if (max !== undefined && num > max) {
        this.addError(fieldName, ERROR_MESSAGES.MAX_VALUE(max));
        return false;
      }
    }
    return true;
  }

  /**
   * Валидация положительного числа
   */
  positive(value, fieldName) {
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        this.addError(fieldName, ERROR_MESSAGES.POSITIVE);
        return false;
      }
    }
    return true;
  }

  /**
   * Валидация даты
   */
  date(value, fieldName, options = {}) {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        this.addError(fieldName, ERROR_MESSAGES.INVALID_DATE);
        return false;
      }
      
      if (options.future && date <= new Date()) {
        this.addError(fieldName, ERROR_MESSAGES.FUTURE_DATE);
        return false;
      }
      
      if (options.past && date >= new Date()) {
        this.addError(fieldName, ERROR_MESSAGES.PAST_DATE);
        return false;
      }
    }
    return true;
  }

  /**
   * Валидация статуса
   */
  status(value, fieldName, validStatuses) {
    if (value && !validStatuses.includes(value)) {
      this.addError(fieldName, ERROR_MESSAGES.VALID_STATUS(validStatuses));
      return false;
    }
    return true;
  }

  /**
   * Валидация роли
   */
  role(value, fieldName, validRoles) {
    if (value && !validRoles.includes(value)) {
      this.addError(fieldName, ERROR_MESSAGES.VALID_ROLE(validRoles));
      return false;
    }
    return true;
  }

  /**
   * Валидация файла
   */
  file(file, fieldName, allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx']) {
    if (file) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        this.addError(fieldName, validationI18n.getMessage('invalid_file_extension'));
        return false;
      }
      
      // Проверка размера файла (максимум 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.addError(fieldName, validationI18n.getMessage('file_size', { maxSize: `${maxSize / (1024 * 1024)}MB` }));
        return false;
      }
    }
    return true;
  }

  /**
   * Валидация пароля
   */
  password(value, fieldName) {
    if (value && !PATTERNS.PASSWORD.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('password_strength'));
      return false;
    }
    return true;
  }

  /**
   * Валидация совпадения паролей
   */
  passwordMatch(value, fieldName, passwordField) {
    if (value !== passwordField) {
      this.addError(fieldName, validationI18n.getMessage('password_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация почтового индекса
   */
  postalCode(value, fieldName) {
    if (value && !PATTERNS.POSTAL_CODE.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация паспорта
   */
  passport(value, fieldName) {
    if (value && !PATTERNS.PASSPORT.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация СНИЛС
   */
  snils(value, fieldName) {
    if (value && !PATTERNS.SNILS.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация IP адреса
   */
  ipAddress(value, fieldName) {
    if (value && !PATTERNS.IP_ADDRESS.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация MAC адреса
   */
  macAddress(value, fieldName) {
    if (value && !PATTERNS.MAC_ADDRESS.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация HEX цвета
   */
  hexColor(value, fieldName) {
    if (value && !PATTERNS.HEX_COLOR.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация Base64
   */
  base64(value, fieldName) {
    if (value && !PATTERNS.BASE64.test(value)) {
      this.addError(fieldName, validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация по регулярному выражению
   */
  regex(value, fieldName, pattern, message = null) {
    if (value && !pattern.test(value)) {
      this.addError(fieldName, message || validationI18n.getMessage('regex_match'));
      return false;
    }
    return true;
  }

  /**
   * Валидация уникальности значения
   */
  async unique(value, fieldName, checkFunction) {
    if (value) {
      try {
        const isUnique = await checkFunction(value);
        if (!isUnique) {
          this.addError(fieldName, validationI18n.getMessage('unique_value'));
          return false;
        }
      } catch (error) {
        console.error('Ошибка проверки уникальности:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Валидация размера массива
   */
  arraySize(value, fieldName, min, max) {
    if (Array.isArray(value)) {
      if (min && value.length < min) {
        this.addError(fieldName, validationI18n.getMessage('array_min', { min }));
        return false;
      }
      if (max && value.length > max) {
        this.addError(fieldName, validationI18n.getMessage('array_max', { max }));
        return false;
      }
    }
    return true;
  }

  /**
   * Валидация объекта
   */
  object(value, fieldName, schema) {
    if (value && typeof value === 'object') {
      const objectValidator = new Validator();
      for (const [key, rules] of Object.entries(schema)) {
        if (value[key] !== undefined) {
          this.validateField(value[key], key, rules, objectValidator);
        }
      }
      // Добавляем ошибки из вложенного валидатора
      for (const [key, errors] of objectValidator.errors) {
        this.addError(`${fieldName}.${key}`, errors);
      }
    }
    return true;
  }

  /**
   * Валидация массива
   */
  array(value, fieldName, itemSchema) {
    if (Array.isArray(value)) {
      const arrayValidator = new Validator();
      value.forEach((item, index) => {
        this.validateField(item, `${fieldName}[${index}]`, itemSchema, arrayValidator);
      });
      // Добавляем ошибки из вложенного валидатора
      for (const [key, errors] of arrayValidator.errors) {
        this.addError(key, errors);
      }
    }
    return true;
  }

  /**
   * Валидация поля по правилам
   */
  validateField(value, fieldName, rules, validator = this) {
    if (typeof rules === 'function') {
      rules(value, fieldName, validator);
    } else if (Array.isArray(rules)) {
      rules.forEach(rule => {
        if (typeof rule === 'function') {
          rule(value, fieldName, validator);
        } else if (typeof rule === 'object') {
          const { validator: ruleValidator, ...options } = rule;
          ruleValidator.call(validator, value, fieldName, ...Object.values(options));
        }
      });
    } else if (typeof rules === 'object') {
      Object.entries(rules).forEach(([ruleName, options]) => {
        if (typeof this[ruleName] === 'function') {
          this[ruleName].call(validator, value, fieldName, ...(Array.isArray(options) ? options : [options]));
        }
      });
    }
  }

  /**
   * Валидация формы
   */
  validateForm(data, schema) {
    this.clearErrors();
    
    for (const [fieldName, rules] of Object.entries(schema)) {
      this.validateField(data[fieldName], fieldName, rules);
    }

    // Выполняем кастомные валидаторы
    for (const [fieldName, { validator, message }] of this.customValidators) {
      if (data[fieldName] !== undefined) {
        const isValid = validator(data[fieldName], data);
        if (!isValid) {
          this.addError(fieldName, message);
        }
      }
    }

    return !this.hasErrors();
  }
}

/**
 * Схемы валидации для различных форм
 */
export const VALIDATION_SCHEMAS = {
  // Схема для создания отчета
  CREATE_REPORT: {
    title: [
      { required: true },
      { length: [3, 100] }
    ],
    description: [
      { length: [0, 1000] }
    ],
    template_id: [
      { required: true }
    ],
    filters: [
      { object: {
        start_date: [{ date: { past: true } }],
        end_date: [{ date: { past: true } }],
        category: [{ length: [0, 50] }]
      }}
    ]
  },

  // Схема для создания акта
  CREATE_ACT: {
    title: [
      { required: true },
      { length: [3, 100] }
    ],
    description: [
      { length: [0, 1000] }
    ],
    template_id: [
      { required: true }
    ],
    client_data: [
      { object: {
        name: [{ required: true }, { length: [2, 100] }],
        email: [{ email: true }],
        phone: [{ phone: true }],
        address: [{ length: [0, 200] }]
      }}
    ]
  },

  // Схема для создания документа
  CREATE_DOCUMENT: {
    template_id: [
      { required: true }
    ],
    client_data: [
      { object: {
        name: [{ required: true }, { length: [2, 100] }],
        email: [{ email: true }],
        phone: [{ phone: true }],
        address: [{ length: [0, 200] }],
        inn: [{ length: [10, 12] }],
        kpp: [{ length: [9, 9] }],
        ogrn: [{ length: [13, 15] }]
      }}
    ]
  },

  // Схема для обновления пользователя
  UPDATE_USER: {
    email: [
      { email: true }
    ],
    role: [
      { role: ['user', 'manager', 'admin', 'super_admin'] }
    ],
    company_name: [
      { length: [2, 100] }
    ]
  },

  // Схема для платежной карты
  PAYMENT_CARD: {
    card_number: [
      { required: true },
      { length: [16, 19] }
    ],
    expiry_date: [
      { required: true }
    ],
    cvv: [
      { required: true },
      { length: [3, 4] }
    ],
    cardholder_name: [
      { required: true },
      { length: [2, 100] }
    ]
  }
};

/**
 * Создание экземпляра валидатора с предустановленными схемами
 */
export const validator = new Validator();

/**
 * Валидация формы по схеме
 */
export function validateForm(data, schemaName) {
  const schema = VALIDATION_SCHEMAS[schemaName];
  if (!schema) {
    throw new Error(`Схема валидации "${schemaName}" не найдена`);
  }
  return validator.validateForm(data, schema);
}

/**
 * Валидация отдельного поля
 */
export function validateField(value, fieldName, rules) {
  const fieldValidator = new Validator();
  fieldValidator.validateField(value, fieldName, rules);
  return {
    isValid: !fieldValidator.hasErrors(),
    errors: fieldValidator.getFieldErrors(fieldName)
  };
}

export default validator; 