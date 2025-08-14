/**
 * Composable для валидации в реальном времени
 */

import { ref, computed, watch, nextTick } from 'vue';
import { validator, validateField } from '@/utils/validation';

export function useRealTimeValidation(options = {}) {
  const {
    debounceDelay = 300,
    validateOnBlur = true,
    validateOnChange = true,
    validateOnInput = false,
    showErrorsImmediately = false,
    customRules = {}
  } = options;

  // Состояние валидации
  const fieldErrors = ref(new Map());
  const fieldTouched = ref(new Map());
  const fieldValidating = ref(new Map());
  const debounceTimers = ref(new Map());

  // Методы валидации
  const validateFieldRealTime = async (fieldName, value, rules) => {
    try {
      fieldValidating.value.set(fieldName, true);
      
      // Добавляем кастомные правила
      const allRules = { ...rules, ...customRules[fieldName] };
      
      const { isValid, errors } = validateField(value, fieldName, allRules);
      
      if (!isValid) {
        fieldErrors.value.set(fieldName, errors);
      } else {
        fieldErrors.value.delete(fieldName);
      }
      
      return { isValid, errors };
    } finally {
      fieldValidating.value.set(fieldName, false);
    }
  };

  const debouncedValidation = (fieldName, value, rules) => {
    // Очищаем предыдущий таймер
    if (debounceTimers.value.has(fieldName)) {
      clearTimeout(debounceTimers.value.get(fieldName));
    }
    
    // Устанавливаем новый таймер
    const timer = setTimeout(() => {
      validateFieldRealTime(fieldName, value, rules);
      debounceTimers.value.delete(fieldName);
    }, debounceDelay);
    
    debounceTimers.value.set(fieldName, timer);
  };

  const validateOnEvent = (event, fieldName, value, rules) => {
    const eventType = event.type;
    
    if (eventType === 'blur' && validateOnBlur) {
      validateFieldRealTime(fieldName, value, rules);
    } else if (eventType === 'change' && validateOnChange) {
      validateFieldRealTime(fieldName, value, rules);
    } else if (eventType === 'input' && validateOnInput) {
      debouncedValidation(fieldName, value, rules);
    }
  };

  const markFieldAsTouched = (fieldName) => {
    fieldTouched.value.set(fieldName, true);
  };

  const clearFieldErrors = (fieldName) => {
    if (fieldName) {
      fieldErrors.value.delete(fieldName);
      fieldTouched.value.delete(fieldName);
    } else {
      fieldErrors.value.clear();
      fieldTouched.value.clear();
    }
  };

  const getFieldError = (fieldName) => {
    return fieldErrors.value.get(fieldName) || [];
  };

  const hasFieldError = (fieldName) => {
    return fieldErrors.value.has(fieldName) && fieldErrors.value.get(fieldName).length > 0;
  };

  const isFieldValidating = (fieldName) => {
    return fieldValidating.value.get(fieldName) || false;
  };

  const isFieldTouched = (fieldName) => {
    return fieldTouched.value.get(fieldName) || false;
  };

  const shouldShowFieldError = (fieldName) => {
    if (showErrorsImmediately) return hasFieldError(fieldName);
    return isFieldTouched(fieldName) && hasFieldError(fieldName);
  };

  const getFieldStatus = (fieldName) => {
    if (isFieldValidating(fieldName)) return 'validating';
    if (hasFieldError(fieldName)) return 'error';
    if (isFieldTouched(fieldName)) return 'valid';
    return 'idle';
  };

  // Создание валидатора для поля
  const createFieldValidator = (fieldName, rules) => {
    return {
      // Обработчики событий
      onBlur: (event) => validateOnEvent(event, fieldName, event.target.value, rules),
      onChange: (event) => validateOnEvent(event, fieldName, event.target.value, rules),
      onInput: (event) => validateOnEvent(event, fieldName, event.target.value, rules),
      
      // Состояние поля
      error: computed(() => getFieldError(fieldName)),
      hasError: computed(() => hasFieldError(fieldName)),
      isValidating: computed(() => isFieldValidating(fieldName)),
      isTouched: computed(() => isFieldTouched(fieldName)),
      shouldShowError: computed(() => shouldShowFieldError(fieldName)),
      status: computed(() => getFieldStatus(fieldName)),
      
      // Методы
      validate: (value) => validateFieldRealTime(fieldName, value, rules),
      markTouched: () => markFieldAsTouched(fieldName),
      clearError: () => clearFieldErrors(fieldName)
    };
  };

  // Валидация всей формы
  const validateForm = async (formData, schema) => {
    const result = await validator.validateForm(formData, schema);
    
    // Обновляем состояние ошибок
    if (!result) {
      const errors = validator.getErrors();
      Object.entries(errors).forEach(([fieldName, fieldErrors]) => {
        this.fieldErrors.value.set(fieldName, fieldErrors);
        this.fieldTouched.value.set(fieldName, true);
      });
    } else {
      this.fieldErrors.value.clear();
    }
    
    return result;
  };

  // Очистка всех таймеров при размонтировании
  const cleanup = () => {
    debounceTimers.value.forEach(timer => clearTimeout(timer));
    debounceTimers.value.clear();
  };

  return {
    // Состояние
    fieldErrors,
    fieldTouched,
    fieldValidating,
    
    // Методы
    validateFieldRealTime,
    validateOnEvent,
    markFieldAsTouched,
    clearFieldErrors,
    getFieldError,
    hasFieldError,
    isFieldValidating,
    isFieldTouched,
    shouldShowFieldError,
    getFieldStatus,
    createFieldValidator,
    validateForm,
    cleanup
  };
}

/**
 * Composable для валидации с асинхронными правилами
 */
export function useAsyncValidation(options = {}) {
  const {
    validateOnBlur = true,
    validateOnChange = true,
    showLoadingState = true
  } = options;

  const asyncFieldErrors = ref(new Map());
  const asyncFieldValidating = ref(new Map());
  const asyncFieldCache = ref(new Map());

  const validateAsyncField = async (fieldName, value, asyncRules) => {
    try {
      asyncFieldValidating.value.set(fieldName, true);
      
      // Проверяем кэш
      const cacheKey = `${fieldName}_${value}`;
      if (asyncFieldCache.value.has(cacheKey)) {
        const cachedResult = asyncFieldCache.value.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < 5 * 60 * 1000) { // 5 минут
          asyncFieldErrors.value.set(fieldName, cachedResult.errors);
          return cachedResult.isValid;
        }
      }
      
      // Выполняем асинхронную валидацию
      const results = await Promise.allSettled(
        Object.entries(asyncRules).map(async ([ruleName, ruleFunction]) => {
          try {
            const result = await ruleFunction(value);
            return { ruleName, isValid: result, error: null };
          } catch (error) {
            return { ruleName, isValid: false, error: error.message };
          }
        })
      );
      
      // Собираем ошибки
      const errors = results
        .filter(result => result.status === 'fulfilled' && !result.value.isValid)
        .map(result => result.value.error || `Validation failed for ${result.value.ruleName}`);
      
      const isValid = errors.length === 0;
      
      // Кэшируем результат
      asyncFieldCache.value.set(cacheKey, {
        isValid,
        errors,
        timestamp: Date.now()
      });
      
      asyncFieldErrors.value.set(fieldName, errors);
      return isValid;
    } finally {
      asyncFieldValidating.value.set(fieldName, false);
    }
  };

  const createAsyncFieldValidator = (fieldName, asyncRules) => {
    return {
      onBlur: (event) => {
        if (validateOnBlur) {
          validateAsyncField(fieldName, event.target.value, asyncRules);
        }
      },
      onChange: (event) => {
        if (validateOnChange) {
          validateAsyncField(fieldName, event.target.value, asyncRules);
        }
      },
      
      error: computed(() => asyncFieldErrors.value.get(fieldName) || []),
      hasError: computed(() => asyncFieldErrors.value.has(fieldName) && asyncFieldErrors.value.get(fieldName).length > 0),
      isValidating: computed(() => asyncFieldValidating.value.get(fieldName) || false),
      
      validate: (value) => validateAsyncField(fieldName, value, asyncRules),
      clearError: () => asyncFieldErrors.value.delete(fieldName)
    };
  };

  return {
    asyncFieldErrors,
    asyncFieldValidating,
    validateAsyncField,
    createAsyncFieldValidator
  };
}

export default useRealTimeValidation; 