/**
 * Сервис валидации для task-service
 * Обеспечивает валидацию данных на клиентской стороне
 */

import { getValidationConfig } from '../config/task-service';

class ValidationService {
  constructor() {
    this.config = getValidationConfig();
    this.customValidators = new Map();
    this.validationCache = new Map();
    
    this.init();
  }

  /**
   * Инициализация сервиса
   */
  init() {
    // Регистрируем встроенные валидаторы
    this.registerBuiltInValidators();
    
    console.log('ValidationService: инициализирован');
  }

  /**
   * Регистрирует встроенные валидаторы
   */
  registerBuiltInValidators() {
    // Валидатор для email
    this.registerValidator('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }, 'Некорректный формат email');
    
    // Валидатор для телефона
    this.registerValidator('phone', (value) => {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
    }, 'Некорректный формат телефона');
    
    // Валидатор для URL
    this.registerValidator('url', (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, 'Некорректный формат URL');
    
    // Валидатор для даты
    this.registerValidator('date', (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }, 'Некорректный формат даты');
    
    // Валидатор для будущей даты
    this.registerValidator('futureDate', (value) => {
      const date = new Date(value);
      const now = new Date();
      return date > now;
    }, 'Дата должна быть в будущем');
    
    // Валидатор для прошлой даты
    this.registerValidator('pastDate', (value) => {
      const date = new Date(value);
      const now = new Date();
      return date < now;
    }, 'Дата должна быть в прошлом');
    
    // Валидатор для числового диапазона
    this.registerValidator('range', (value, min, max) => {
      const num = Number(value);
      return !isNaN(num) && num >= min && num <= max;
    }, 'Значение должно быть в диапазоне');
    
    // Валидатор для минимальной длины
    this.registerValidator('minLength', (value, min) => {
      return String(value).length >= min;
    }, 'Минимальная длина не соблюдена');
    
    // Валидатор для максимальной длины
    this.registerValidator('maxLength', (value, max) => {
      return String(value).length <= max;
    }, 'Максимальная длина не соблюдена');
    
    // Валидатор для регулярного выражения
    this.registerValidator('pattern', (value, pattern) => {
      const regex = new RegExp(pattern);
      return regex.test(value);
    }, 'Значение не соответствует формату');
    
    // Валидатор для обязательного поля
    this.registerValidator('required', (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }, 'Поле обязательно для заполнения');
    
    // Валидатор для уникальности
    this.registerValidator('unique', (value, existingValues) => {
      if (!Array.isArray(existingValues)) return true;
      return !existingValues.includes(value);
    }, 'Значение должно быть уникальным');
    
    // Валидатор для подтверждения
    this.registerValidator('confirmed', (value, confirmValue) => {
      return value === confirmValue;
    }, 'Значения не совпадают');
    
    // Валидатор для размера файла
    this.registerValidator('fileSize', (file, maxSize) => {
      if (!file || !file.size) return true;
      return file.size <= maxSize;
    }, 'Размер файла превышает допустимый');
    
    // Валидатор для типа файла
    this.registerValidator('fileType', (file, allowedTypes) => {
      if (!file || !file.type) return true;
      if (Array.isArray(allowedTypes)) {
        return allowedTypes.includes(file.type);
      }
      return file.type === allowedTypes;
    }, 'Недопустимый тип файла');
  }

  /**
   * Регистрирует пользовательский валидатор
   */
  registerValidator(name, validator, message) {
    this.customValidators.set(name, { validator, message });
  }

  /**
   * Валидирует данные по схеме
   */
  validate(data, schema) {
    const errors = {};
    const warnings = {};
    
    try {
      // Проходим по всем полям схемы
      Object.keys(schema).forEach(fieldName => {
        const fieldSchema = schema[fieldName];
        const fieldValue = data[fieldName];
        
        // Валидируем поле
        const fieldValidation = this.validateField(fieldValue, fieldSchema, fieldName, data);
        
        if (fieldValidation.errors.length > 0) {
          errors[fieldName] = fieldValidation.errors;
        }
        
        if (fieldValidation.warnings.length > 0) {
          warnings[fieldName] = fieldValidation.warnings;
        }
      });
      
      // Проверяем кроссполевые валидации
      const crossFieldValidation = this.validateCrossFields(data, schema);
      Object.assign(errors, crossFieldValidation.errors);
      Object.assign(warnings, crossFieldValidation.warnings);
      
    } catch (error) {
      console.error('ValidationService: ошибка валидации:', error);
      errors._system = ['Ошибка валидации: ' + error.message];
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      data: this.sanitizeData(data, schema)
    };
  }

  /**
   * Валидирует отдельное поле
   */
  validateField(value, schema, fieldName, allData) {
    const errors = [];
    const warnings = [];
    
    // Проверяем обязательность
    if (schema.required && !this.runValidator('required', value)) {
      errors.push(schema.requiredMessage || 'Поле обязательно для заполнения');
      return { errors, warnings };
    }
    
    // Если поле не обязательное и значение пустое, пропускаем остальные проверки
    if (value === null || value === undefined || value === '') {
      return { errors, warnings };
    }
    
    // Проверяем тип
    if (schema.type && !this.validateType(value, schema.type)) {
      errors.push(`Ожидается тип: ${schema.type}`);
      return { errors, warnings };
    }
    
    // Проверяем минимальную длину
    if (schema.minLength !== undefined) {
      if (!this.runValidator('minLength', value, schema.minLength)) {
        errors.push(`Минимальная длина: ${schema.minLength} символов`);
      }
    }
    
    // Проверяем максимальную длину
    if (schema.maxLength !== undefined) {
      if (!this.runValidator('maxLength', value, schema.maxLength)) {
        errors.push(`Максимальная длина: ${schema.maxLength} символов`);
      }
    }
    
    // Проверяем числовые ограничения
    if (schema.min !== undefined || schema.max !== undefined) {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push('Значение должно быть числом');
      } else {
        if (schema.min !== undefined && num < schema.min) {
          errors.push(`Минимальное значение: ${schema.min}`);
        }
        if (schema.max !== undefined && num > schema.max) {
          errors.push(`Максимальное значение: ${schema.max}`);
        }
      }
    }
    
    // Проверяем регулярное выражение
    if (schema.pattern) {
      if (!this.runValidator('pattern', value, schema.pattern)) {
        errors.push(schema.patternMessage || 'Значение не соответствует формату');
      }
    }
    
    // Проверяем допустимые значения
    if (schema.allowedValues && !schema.allowedValues.includes(value)) {
      errors.push(`Допустимые значения: ${schema.allowedValues.join(', ')}`);
    }
    
    // Проверяем пользовательские валидаторы
    if (schema.validators) {
      schema.validators.forEach(validatorConfig => {
        const { name, params, message } = validatorConfig;
        if (!this.runValidator(name, value, params)) {
          errors.push(message || `Ошибка валидации: ${name}`);
        }
      });
    }
    
    // Проверяем условные валидации
    if (schema.conditional) {
      const conditionalValidation = this.validateConditional(value, schema.conditional, allData);
      errors.push(...conditionalValidation.errors);
      warnings.push(...conditionalValidation.warnings);
    }
    
    // Проверяем вложенные объекты
    if (schema.nested && typeof value === 'object' && value !== null) {
      const nestedValidation = this.validate(value, schema.nested);
      if (!nestedValidation.isValid) {
        Object.keys(nestedValidation.errors).forEach(nestedField => {
          errors.push(`${nestedField}: ${nestedValidation.errors[nestedField].join(', ')}`);
        });
      }
    }
    
    // Проверяем массивы
    if (schema.array && Array.isArray(value)) {
      const arrayValidation = this.validateArray(value, schema.array);
      if (!arrayValidation.isValid) {
        errors.push(`Ошибки в массиве: ${arrayValidation.errors.join(', ')}`);
      }
    }
    
    return { errors, warnings };
  }

  /**
   * Проверяет тип значения
   */
  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(new Date(value).getTime()));
      case 'email':
        return this.runValidator('email', value);
      case 'phone':
        return this.runValidator('phone', value);
      case 'url':
        return this.runValidator('url', value);
      default:
        return true;
    }
  }

  /**
   * Запускает валидатор
   */
  runValidator(name, value, params) {
    const validator = this.customValidators.get(name);
    if (!validator) {
      console.warn(`ValidationService: валидатор '${name}' не найден`);
      return true;
    }
    
    try {
      return validator.validator(value, params);
    } catch (error) {
      console.error(`ValidationService: ошибка в валидаторе '${name}':`, error);
      return false;
    }
  }

  /**
   * Валидирует условные правила
   */
  validateConditional(value, conditional, allData) {
    const errors = [];
    const warnings = [];
    
    if (conditional.if) {
      const conditionMet = this.evaluateCondition(conditional.if, allData);
      
      if (conditionMet) {
        if (conditional.then) {
          const thenValidation = this.validateField(value, conditional.then, '', allData);
          errors.push(...thenValidation.errors);
          warnings.push(...thenValidation.warnings);
        }
      } else if (conditional.else) {
        const elseValidation = this.validateField(value, conditional.else, '', allData);
        errors.push(...elseValidation.errors);
        warnings.push(...elseValidation.warnings);
      }
    }
    
    return { errors, warnings };
  }

  /**
   * Вычисляет условие
   */
  evaluateCondition(condition, data) {
    if (typeof condition === 'function') {
      return condition(data);
    }
    
    if (typeof condition === 'object') {
      const { field, operator, value } = condition;
      const fieldValue = this.getNestedValue(data, field);
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'greaterThan':
          return fieldValue > value;
        case 'lessThan':
          return fieldValue < value;
        case 'greaterThanOrEqual':
          return fieldValue >= value;
        case 'lessThanOrEqual':
          return fieldValue <= value;
        case 'contains':
          return String(fieldValue).includes(value);
        case 'notContains':
          return !String(fieldValue).includes(value);
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'notIn':
          return Array.isArray(value) && !value.includes(fieldValue);
        case 'exists':
          return fieldValue !== null && fieldValue !== undefined;
        case 'notExists':
          return fieldValue === null || fieldValue === undefined;
        default:
          return false;
      }
    }
    
    return false;
  }

  /**
   * Получает вложенное значение
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Валидирует массив
   */
  validateArray(array, schema) {
    const errors = [];
    
    if (!Array.isArray(array)) {
      errors.push('Значение должно быть массивом');
      return { isValid: false, errors };
    }
    
    // Проверяем минимальную длину массива
    if (schema.minLength !== undefined && array.length < schema.minLength) {
      errors.push(`Минимальное количество элементов: ${schema.minLength}`);
    }
    
    // Проверяем максимальную длину массива
    if (schema.maxLength !== undefined && array.length > schema.maxLength) {
      errors.push(`Максимальное количество элементов: ${schema.maxLength}`);
    }
    
    // Валидируем каждый элемент массива
    if (schema.itemSchema) {
      array.forEach((item, index) => {
        const itemValidation = this.validateField(item, schema.itemSchema, `[${index}]`, array);
        if (itemValidation.errors.length > 0) {
          errors.push(`Элемент [${index}]: ${itemValidation.errors.join(', ')}`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Валидирует кроссполевые правила
   */
  validateCrossFields(data, schema) {
    const errors = {};
    const warnings = {};
    
    if (schema.crossFieldValidations) {
      schema.crossFieldValidations.forEach(validation => {
        const { fields, validator, message } = validation;
        
        try {
          const fieldValues = fields.map(field => this.getNestedValue(data, field));
          const isValid = validator(...fieldValues);
          
          if (!isValid) {
            const mainField = fields[0];
            if (!errors[mainField]) {
              errors[mainField] = [];
            }
            errors[mainField].push(message);
          }
        } catch (error) {
          console.error('ValidationService: ошибка кроссполевой валидации:', error);
        }
      });
    }
    
    return { errors, warnings };
  }

  /**
   * Очищает данные согласно схеме
   */
  sanitizeData(data, schema) {
    const sanitized = {};
    
    Object.keys(schema).forEach(fieldName => {
      const fieldSchema = schema[fieldName];
      const fieldValue = data[fieldName];
      
      if (fieldValue !== undefined) {
        // Применяем трансформации
        let sanitizedValue = this.transformValue(fieldValue, fieldSchema);
        
        // Применяем фильтры
        if (fieldSchema.filters) {
          fieldSchema.filters.forEach(filter => {
            sanitizedValue = this.applyFilter(sanitizedValue, filter);
          });
        }
        
        sanitized[fieldName] = sanitizedValue;
      }
    });
    
    return sanitized;
  }

  /**
   * Трансформирует значение
   */
  transformValue(value, schema) {
    if (value === null || value === undefined) {
      return value;
    }
    
    // Трансформация типа
    if (schema.transform) {
      switch (schema.transform) {
        case 'trim':
          return typeof value === 'string' ? value.trim() : value;
        case 'toLowerCase':
          return typeof value === 'string' ? value.toLowerCase() : value;
        case 'toUpperCase':
          return typeof value === 'string' ? value.toUpperCase() : value;
        case 'toNumber':
          return Number(value);
        case 'toString':
          return String(value);
        case 'toBoolean':
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
          }
          return Boolean(value);
        case 'toDate':
          return new Date(value);
        default:
          return value;
      }
    }
    
    return value;
  }

  /**
   * Применяет фильтр
   */
  applyFilter(value, filter) {
    if (typeof filter === 'function') {
      return filter(value);
    }
    
    if (typeof filter === 'object') {
      const { type, params } = filter;
      
      switch (type) {
        case 'replace':
          const { search, replace } = params;
          return String(value).replace(new RegExp(search, 'g'), replace);
        case 'substring':
          const { start, end } = params;
          return String(value).substring(start, end);
        case 'round':
          return Math.round(Number(value));
        case 'floor':
          return Math.floor(Number(value));
        case 'ceil':
          return Math.ceil(Number(value));
        default:
          return value;
      }
    }
    
    return value;
  }

  /**
   * Валидирует задачу
   */
  validateTask(task) {
    return this.validate(task, this.config.tasks);
  }

  /**
   * Валидирует комментарий
   */
  validateComment(comment) {
    return this.validate(comment, this.config.comments);
  }

  /**
   * Валидирует встречу
   */
  validateMeeting(meeting) {
    return this.validate(meeting, this.config.meetings);
  }

  /**
   * Проверяет валидность данных
   */
  isValid(data, schema) {
    const validation = this.validate(data, schema);
    return validation.isValid;
  }

  /**
   * Получает только ошибки валидации
   */
  getErrors(data, schema) {
    const validation = this.validate(data, schema);
    return validation.errors;
  }

  /**
   * Получает только предупреждения валидации
   */
  getWarnings(data, schema) {
    const validation = this.validate(data, schema);
    return validation.warnings;
  }

  /**
   * Валидирует поле в реальном времени
   */
  validateFieldRealTime(value, fieldSchema, fieldName, allData) {
    return this.validateField(value, fieldSchema, fieldName, allData);
  }

  /**
   * Создает схему валидации для формы
   */
  createFormSchema(fields) {
    const schema = {};
    
    fields.forEach(field => {
      schema[field.name] = {
        required: field.required || false,
        type: field.type || 'string',
        minLength: field.minLength,
        maxLength: field.maxLength,
        min: field.min,
        max: field.max,
        pattern: field.pattern,
        allowedValues: field.allowedValues,
        validators: field.validators,
        transform: field.transform,
        filters: field.filters,
        requiredMessage: field.requiredMessage,
        patternMessage: field.patternMessage
      };
    });
    
    return schema;
  }

  /**
   * Получает статус сервиса
   */
  getStatus() {
    return {
      customValidatorsCount: this.customValidators.size,
      validationCacheSize: this.validationCache.size,
      config: this.config
    };
  }

  /**
   * Очищает кэш валидации
   */
  clearCache() {
    this.validationCache.clear();
    console.log('ValidationService: кэш валидации очищен');
  }

  /**
   * Очищает ресурсы
   */
  destroy() {
    this.customValidators.clear();
    this.validationCache.clear();
    console.log('ValidationService: сервис уничтожен');
  }
}

// Создаем и экспортируем единственный экземпляр
const validationService = new ValidationService();

export default validationService; 