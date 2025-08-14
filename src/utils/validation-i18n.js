/**
 * i18n конфигурация для валидации
 */

export const VALIDATION_MESSAGES = {
  ru: {
    required: 'Это поле обязательно для заполнения',
    invalid_email: 'Введите корректный email адрес',
    invalid_phone: 'Введите корректный номер телефона',
    invalid_inn: 'ИНН должен содержать 10 или 12 цифр',
    invalid_kpp: 'КПП должен содержать 9 цифр',
    invalid_ogrn: 'ОГРН должен содержать 13 или 15 цифр',
    invalid_bank_account: 'Номер счета должен содержать 20 цифр',
    invalid_bik: 'БИК должен содержать 9 цифр',
    invalid_card_number: 'Номер карты должен содержать 16 цифр',
    invalid_cvv: 'CVV должен содержать 3-4 цифры',
    invalid_expiry_date: 'Введите дату в формате ММ/ГГ',
    invalid_date: 'Введите дату в формате ГГГГ-ММ-ДД',
    invalid_time: 'Введите время в формате ЧЧ:ММ',
    invalid_uuid: 'Некорректный UUID',
    invalid_url: 'Введите корректный URL',
    invalid_file_extension: 'Неподдерживаемый тип файла',
    min_length: 'Минимальная длина: {min} символов',
    max_length: 'Максимальная длина: {max} символов',
    min_value: 'Минимальное значение: {min}',
    max_value: 'Максимальное значение: {max}',
    range: 'Значение должно быть от {min} до {max}',
    positive: 'Значение должно быть положительным',
    integer: 'Значение должно быть целым числом',
    decimal: 'Значение должно быть числом с десятичными знаками',
    future_date: 'Дата должна быть в будущем',
    past_date: 'Дата должна быть в прошлом',
    valid_status: 'Статус должен быть одним из: {validStatuses}',
    valid_role: 'Роль должна быть одной из: {validRoles}',
    unique_value: 'Значение должно быть уникальным',
    password_strength: 'Пароль должен содержать минимум 8 символов, включая буквы, цифры и специальные символы',
    password_match: 'Пароли не совпадают',
    file_size: 'Размер файла не должен превышать {maxSize}',
    file_type: 'Поддерживаются только файлы типа: {types}',
    array_min: 'Минимальное количество элементов: {min}',
    array_max: 'Максимальное количество элементов: {max}',
    object_required: 'Объект обязателен',
    regex_match: 'Значение не соответствует требуемому формату',
    custom_error: '{message}'
  },
  en: {
    required: 'This field is required',
    invalid_email: 'Please enter a valid email address',
    invalid_phone: 'Please enter a valid phone number',
    invalid_inn: 'INN must contain 10 or 12 digits',
    invalid_kpp: 'KPP must contain 9 digits',
    invalid_ogrn: 'OGRN must contain 13 or 15 digits',
    invalid_bank_account: 'Bank account number must contain 20 digits',
    invalid_bik: 'BIK must contain 9 digits',
    invalid_card_number: 'Card number must contain 16 digits',
    invalid_cvv: 'CVV must contain 3-4 digits',
    invalid_expiry_date: 'Please enter date in MM/YY format',
    invalid_date: 'Please enter date in YYYY-MM-DD format',
    invalid_time: 'Please enter time in HH:MM format',
    invalid_uuid: 'Invalid UUID',
    invalid_url: 'Please enter a valid URL',
    invalid_file_extension: 'Unsupported file type',
    min_length: 'Minimum length: {min} characters',
    max_length: 'Maximum length: {max} characters',
    min_value: 'Minimum value: {min}',
    max_value: 'Maximum value: {max}',
    range: 'Value must be between {min} and {max}',
    positive: 'Value must be positive',
    integer: 'Value must be an integer',
    decimal: 'Value must be a decimal number',
    future_date: 'Date must be in the future',
    past_date: 'Date must be in the past',
    valid_status: 'Status must be one of: {validStatuses}',
    valid_role: 'Role must be one of: {validRoles}',
    unique_value: 'Value must be unique',
    password_strength: 'Password must contain at least 8 characters including letters, numbers and special characters',
    password_match: 'Passwords do not match',
    file_size: 'File size must not exceed {maxSize}',
    file_type: 'Only files of type are supported: {types}',
    array_min: 'Minimum number of elements: {min}',
    array_max: 'Maximum number of elements: {max}',
    object_required: 'Object is required',
    regex_match: 'Value does not match required format',
    custom_error: '{message}'
  }
};

/**
 * Класс для интернационализации сообщений валидации
 */
export class ValidationI18n {
  constructor(locale = 'ru') {
    this.locale = locale;
    this.messages = VALIDATION_MESSAGES[locale] || VALIDATION_MESSAGES.ru;
  }

  /**
   * Изменить локаль
   */
  setLocale(locale) {
    this.locale = locale;
    this.messages = VALIDATION_MESSAGES[locale] || VALIDATION_MESSAGES.ru;
  }

  /**
   * Получить сообщение по ключу
   */
  getMessage(key, params = {}) {
    let message = this.messages[key] || key;
    
    // Заменяем параметры в сообщении
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(new RegExp(`{${param}}`, 'g'), value);
    });
    
    return message;
  }

  /**
   * Получить все сообщения для текущей локали
   */
  getAllMessages() {
    return { ...this.messages };
  }

  /**
   * Добавить кастомные сообщения
   */
  addCustomMessages(customMessages) {
    this.messages = { ...this.messages, ...customMessages };
  }
}

// Экспортируем экземпляр по умолчанию
export const validationI18n = new ValidationI18n();

export default validationI18n; 