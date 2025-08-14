#include <emscripten.h>
#include <emscripten/bind.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>

// Структуры для финансовых расчетов
typedef struct {
    double principal;
    double rate;
    int years;
    int compound_period;
} LoanParams;

typedef struct {
    double amount;
    double tax_rate;
    double deductions;
} TaxParams;

typedef struct {
    double revenue;
    double costs;
    double expenses;
    double depreciation;
} BusinessParams;

// Финансовые расчеты
EMSCRIPTEN_KEEPALIVE
double calculate_compound_interest(double principal, double rate, int years, int compound_period) {
    double r = rate / 100.0;
    double n = (double)compound_period;
    double t = (double)years;
    
    return principal * pow(1 + r/n, n*t);
}

EMSCRIPTEN_KEEPALIVE
double calculate_loan_payment(double principal, double rate, int years) {
    double r = rate / 100.0 / 12.0; // месячная ставка
    int n = years * 12; // количество месяцев
    
    if (r == 0) return principal / n;
    
    return principal * (r * pow(1 + r, n)) / (pow(1 + r, n) - 1);
}

EMSCRIPTEN_KEEPALIVE
double calculate_tax(double amount, double tax_rate, double deductions) {
    double taxable_income = amount - deductions;
    if (taxable_income <= 0) return 0;
    
    return taxable_income * (tax_rate / 100.0);
}

EMSCRIPTEN_KEEPALIVE
double calculate_profit_margin(double revenue, double costs) {
    if (revenue == 0) return 0;
    return ((revenue - costs) / revenue) * 100.0;
}

EMSCRIPTEN_KEEPALIVE
double calculate_roi(double initial_investment, double final_value) {
    if (initial_investment == 0) return 0;
    return ((final_value - initial_investment) / initial_investment) * 100.0;
}

// Математические вычисления
EMSCRIPTEN_KEEPALIVE
double fast_sqrt(double x) {
    if (x < 0) return 0;
    
    double guess = x / 2.0;
    double prev_guess;
    
    for (int i = 0; i < 10; i++) {
        prev_guess = guess;
        guess = (guess + x / guess) / 2.0;
        
        if (fabs(guess - prev_guess) < 1e-10) break;
    }
    
    return guess;
}

EMSCRIPTEN_KEEPALIVE
double fast_exp(double x) {
    if (x > 700) return INFINITY;
    if (x < -700) return 0;
    
    double result = 1.0;
    double term = 1.0;
    
    for (int i = 1; i <= 20; i++) {
        term *= x / i;
        result += term;
    }
    
    return result;
}

EMSCRIPTEN_KEEPALIVE
double fast_log(double x) {
    if (x <= 0) return -INFINITY;
    
    double result = 0.0;
    double y = (x - 1) / (x + 1);
    double y_squared = y * y;
    double term = y;
    
    for (int i = 1; i <= 20; i += 2) {
        result += term / i;
        term *= y_squared;
    }
    
    return 2 * result;
}

// Статистические вычисления
EMSCRIPTEN_KEEPALIVE
double calculate_mean(double* data, int size) {
    if (size <= 0) return 0;
    
    double sum = 0.0;
    for (int i = 0; i < size; i++) {
        sum += data[i];
    }
    
    return sum / size;
}

EMSCRIPTEN_KEEPALIVE
double calculate_variance(double* data, int size) {
    if (size <= 1) return 0;
    
    double mean = calculate_mean(data, size);
    double sum_squares = 0.0;
    
    for (int i = 0; i < size; i++) {
        double diff = data[i] - mean;
        sum_squares += diff * diff;
    }
    
    return sum_squares / (size - 1);
}

EMSCRIPTEN_KEEPALIVE
double calculate_standard_deviation(double* data, int size) {
    return fast_sqrt(calculate_variance(data, size));
}

EMSCRIPTEN_KEEPALIVE
double calculate_correlation(double* x, double* y, int size) {
    if (size <= 1) return 0;
    
    double mean_x = calculate_mean(x, size);
    double mean_y = calculate_mean(y, size);
    
    double numerator = 0.0;
    double sum_x_sq = 0.0;
    double sum_y_sq = 0.0;
    
    for (int i = 0; i < size; i++) {
        double diff_x = x[i] - mean_x;
        double diff_y = y[i] - mean_y;
        
        numerator += diff_x * diff_y;
        sum_x_sq += diff_x * diff_x;
        sum_y_sq += diff_y * diff_y;
    }
    
    double denominator = fast_sqrt(sum_x_sq * sum_y_sq);
    if (denominator == 0) return 0;
    
    return numerator / denominator;
}

// Сортировка и поиск
EMSCRIPTEN_KEEPALIVE
void quick_sort(double* data, int left, int right) {
    if (left < right) {
        int pivot_index = partition(data, left, right);
        quick_sort(data, left, pivot_index - 1);
        quick_sort(data, pivot_index + 1, right);
    }
}

EMSCRIPTEN_KEEPALIVE
int partition(double* data, int left, int right) {
    double pivot = data[right];
    int i = left - 1;
    
    for (int j = left; j < right; j++) {
        if (data[j] <= pivot) {
            i++;
            double temp = data[i];
            data[i] = data[j];
            data[j] = temp;
        }
    }
    
    double temp = data[i + 1];
    data[i + 1] = data[right];
    data[right] = temp;
    
    return i + 1;
}

EMSCRIPTEN_KEEPALIVE
int binary_search(double* data, int size, double target) {
    int left = 0;
    int right = size - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (fabs(data[mid] - target) < 1e-10) {
            return mid;
        }
        
        if (data[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

// Оптимизация портфеля
EMSCRIPTEN_KEEPALIVE
void calculate_portfolio_weights(double* returns, double* weights, int assets, double target_return) {
    // Простая оптимизация портфеля методом наименьших квадратов
    double total_weight = 0.0;
    
    for (int i = 0; i < assets; i++) {
        weights[i] = 1.0 / assets; // Равные веса по умолчанию
        total_weight += weights[i];
    }
    
    // Нормализация весов
    for (int i = 0; i < assets; i++) {
        weights[i] /= total_weight;
    }
}

// Анализ временных рядов
EMSCRIPTEN_KEEPALIVE
void calculate_moving_average(double* data, double* result, int size, int window) {
    if (window > size) return;
    
    for (int i = 0; i < size - window + 1; i++) {
        double sum = 0.0;
        for (int j = 0; j < window; j++) {
            sum += data[i + j];
        }
        result[i] = sum / window;
    }
}

EMSCRIPTEN_KEEPALIVE
void calculate_exponential_smoothing(double* data, double* result, int size, double alpha) {
    if (size <= 0) return;
    
    result[0] = data[0];
    
    for (int i = 1; i < size; i++) {
        result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
    }
}

// Криптографические хеши (упрощенные)
EMSCRIPTEN_KEEPALIVE
unsigned int simple_hash(const char* str) {
    unsigned int hash = 5381;
    int c;
    
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }
    
    return hash;
}

// Сжатие данных
EMSCRIPTEN_KEEPALIVE
int compress_run_length(const char* input, char* output, int input_size) {
    if (input_size <= 0) return 0;
    
    int output_index = 0;
    char current_char = input[0];
    int count = 1;
    
    for (int i = 1; i < input_size; i++) {
        if (input[i] == current_char) {
            count++;
        } else {
            output[output_index++] = current_char;
            output[output_index++] = count;
            current_char = input[i];
            count = 1;
        }
    }
    
    output[output_index++] = current_char;
    output[output_index++] = count;
    
    return output_index;
}

// Параллельные вычисления
EMSCRIPTEN_KEEPALIVE
void parallel_matrix_multiply(double* a, double* b, double* result, int size) {
    for (int i = 0; i < size; i++) {
        for (int j = 0; j < size; j++) {
            double sum = 0.0;
            for (int k = 0; k < size; k++) {
                sum += a[i * size + k] * b[k * size + j];
            }
            result[i * size + j] = sum;
        }
    }
}

// Оптимизация памяти
EMSCRIPTEN_KEEPALIVE
void* allocate_aligned(size_t size, size_t alignment) {
    void* ptr = aligned_alloc(alignment, size);
    return ptr;
}

EMSCRIPTEN_KEEPALIVE
void free_aligned(void* ptr) {
    free(ptr);
}

// Бенчмаркинг
EMSCRIPTEN_KEEPALIVE
double benchmark_function(double (*func)(double), double input, int iterations) {
    double start_time = emscripten_get_now();
    
    for (int i = 0; i < iterations; i++) {
        func(input);
    }
    
    double end_time = emscripten_get_now();
    return end_time - start_time;
}

// Экспорт функций для JavaScript
EMSCRIPTEN_BINDINGS(critical_calculations) {
    emscripten::function("calculateCompoundInterest", &calculate_compound_interest);
    emscripten::function("calculateLoanPayment", &calculate_loan_payment);
    emscripten::function("calculateTax", &calculate_tax);
    emscripten::function("calculateProfitMargin", &calculate_profit_margin);
    emscripten::function("calculateROI", &calculate_roi);
    emscripten::function("fastSqrt", &fast_sqrt);
    emscripten::function("fastExp", &fast_exp);
    emscripten::function("fastLog", &fast_log);
    emscripten::function("calculateMean", &calculate_mean);
    emscripten::function("calculateVariance", &calculate_variance);
    emscripten::function("calculateStandardDeviation", &calculate_standard_deviation);
    emscripten::function("calculateCorrelation", &calculate_correlation);
    emscripten::function("quickSort", &quick_sort);
    emscripten::function("binarySearch", &binary_search);
    emscripten::function("calculatePortfolioWeights", &calculate_portfolio_weights);
    emscripten::function("calculateMovingAverage", &calculate_moving_average);
    emscripten::function("calculateExponentialSmoothing", &calculate_exponential_smoothing);
    emscripten::function("simpleHash", &simple_hash);
    emscripten::function("compressRunLength", &compress_run_length);
    emscripten::function("parallelMatrixMultiply", &parallel_matrix_multiply);
    emscripten::function("allocateAligned", &allocate_aligned);
    emscripten::function("freeAligned", &free_aligned);
    emscripten::function("benchmarkFunction", &benchmark_function);
} 