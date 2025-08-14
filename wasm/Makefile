# Makefile для компиляции WebAssembly модуля
# Требует установленный Emscripten SDK

# Переменные
EMCC = emcc
EMCC_FLAGS = -O3 -s WASM=1 -s EXPORTED_FUNCTIONS="['_calculate_compound_interest', '_calculate_loan_payment', '_calculate_tax', '_calculate_profit_margin', '_calculate_roi', '_fast_sqrt', '_fast_exp', '_fast_log', '_calculate_mean', '_calculate_variance', '_calculate_standard_deviation', '_calculate_correlation', '_quick_sort', '_binary_search', '_calculate_portfolio_weights', '_calculate_moving_average', '_calculate_exponential_smoothing', '_simple_hash', '_compress_run_length', '_parallel_matrix_multiply', '_allocate_aligned', '_free_aligned', '_benchmark_function']" -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']" -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=16777216 -s MAXIMUM_MEMORY=67108864 -s EXPORT_ES6=1 -s MODULARIZE=1 -s USE_ES6_IMPORT_META=0

# Цели
.PHONY: all clean wasm js html

all: wasm js

# Компиляция WebAssembly
wasm: critical-calculations.wasm

critical-calculations.wasm: critical-calculations.c
	$(EMCC) $(EMCC_FLAGS) -o critical-calculations.js critical-calculations.c

# Генерация JavaScript обертки
js: critical-calculations.js

# Генерация HTML страницы для тестирования
html: critical-calculations.html

critical-calculations.html: critical-calculations.c
	$(EMCC) $(EMCC_FLAGS) -o critical-calculations.html critical-calculations.c

# Очистка
clean:
	rm -f *.wasm *.js *.html *.o

# Установка зависимостей (Ubuntu/Debian)
install-deps:
	sudo apt-get update
	sudo apt-get install -y build-essential cmake python3

# Установка Emscripten
install-emscripten:
	git clone https://github.com/emscripten-core/emsdk.git
	cd emsdk
	./emsdk install latest
	./emsdk activate latest
	source ./emsdk_env.sh

# Тестирование
test: wasm
	node -e "const wasm = require('./critical-calculations.js'); wasm().then(module => { console.log('WASM module loaded successfully'); console.log('Functions:', Object.keys(module)); });"

# Бенчмарк
benchmark: wasm
	node benchmark.js

# Оптимизация для продакшена
production: critical-calculations.c
	$(EMCC) -O3 -s WASM=1 -s EXPORTED_FUNCTIONS="['_calculate_compound_interest', '_calculate_loan_payment', '_calculate_tax', '_calculate_profit_margin', '_calculate_roi', '_fast_sqrt', '_fast_exp', '_fast_log', '_calculate_mean', '_calculate_variance', '_calculate_standard_deviation', '_calculate_correlation', '_quick_sort', '_binary_search', '_calculate_portfolio_weights', '_calculate_moving_average', '_calculate_exponential_smoothing', '_simple_hash', '_compress_run_length', '_parallel_matrix_multiply', '_allocate_aligned', '_free_aligned', '_benchmark_function']" -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']" -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=16777216 -s MAXIMUM_MEMORY=67108864 -s EXPORT_ES6=1 -s MODULARIZE=1 -s USE_ES6_IMPORT_META=0 -s ENVIRONMENT='web' -s SINGLE_FILE=1 -o critical-calculations.min.js critical-calculations.c

# Отладочная версия
debug: critical-calculations.c
	$(EMCC) -g -O0 -s WASM=1 -s EXPORTED_FUNCTIONS="['_calculate_compound_interest', '_calculate_loan_payment', '_calculate_tax', '_calculate_profit_margin', '_calculate_roi', '_fast_sqrt', '_fast_exp', '_fast_log', '_calculate_mean', '_calculate_variance', '_calculate_standard_deviation', '_calculate_correlation', '_quick_sort', '_binary_search', '_calculate_portfolio_weights', '_calculate_moving_average', '_calculate_exponential_smoothing', '_simple_hash', '_compress_run_length', '_parallel_matrix_multiply', '_allocate_aligned', '_free_aligned', '_benchmark_function']" -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']" -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=16777216 -s MAXIMUM_MEMORY=67108864 -s EXPORT_ES6=1 -s MODULARIZE=1 -s USE_ES6_IMPORT_META=0 -s ASSERTIONS=1 -s SAFE_HEAP=1 -o critical-calculations.debug.js critical-calculations.c

# Создание TypeScript определений
types: critical-calculations.d.ts

critical-calculations.d.ts:
	echo "export interface WASMModule {" > critical-calculations.d.ts
	echo "  calculateCompoundInterest(principal: number, rate: number, years: number, compoundPeriod: number): number;" >> critical-calculations.d.ts
	echo "  calculateLoanPayment(principal: number, rate: number, years: number): number;" >> critical-calculations.d.ts
	echo "  calculateTax(amount: number, taxRate: number, deductions: number): number;" >> critical-calculations.d.ts
	echo "  calculateProfitMargin(revenue: number, costs: number): number;" >> critical-calculations.d.ts
	echo "  calculateROI(initialInvestment: number, finalValue: number): number;" >> critical-calculations.d.ts
	echo "  fastSqrt(x: number): number;" >> critical-calculations.d.ts
	echo "  fastExp(x: number): number;" >> critical-calculations.d.ts
	echo "  fastLog(x: number): number;" >> critical-calculations.d.ts
	echo "  calculateMean(data: number[], size: number): number;" >> critical-calculations.d.ts
	echo "  calculateVariance(data: number[], size: number): number;" >> critical-calculations.d.ts
	echo "  calculateStandardDeviation(data: number[], size: number): number;" >> critical-calculations.d.ts
	echo "  calculateCorrelation(x: number[], y: number[], size: number): number;" >> critical-calculations.d.ts
	echo "  quickSort(data: number[], left: number, right: number): void;" >> critical-calculations.d.ts
	echo "  binarySearch(data: number[], size: number, target: number): number;" >> critical-calculations.d.ts
	echo "  calculatePortfolioWeights(returns: number[], weights: number[], assets: number, targetReturn: number): void;" >> critical-calculations.d.ts
	echo "  calculateMovingAverage(data: number[], result: number[], size: number, window: number): void;" >> critical-calculations.d.ts
	echo "  calculateExponentialSmoothing(data: number[], result: number[], size: number, alpha: number): void;" >> critical-calculations.d.ts
	echo "  simpleHash(str: string): number;" >> critical-calculations.d.ts
	echo "  compressRunLength(input: string, output: string, inputSize: number): number;" >> critical-calculations.d.ts
	echo "  parallelMatrixMultiply(a: number[], b: number[], result: number[], size: number): void;" >> critical-calculations.d.ts
	echo "  allocateAligned(size: number, alignment: number): number;" >> critical-calculations.d.ts
	echo "  freeAligned(ptr: number): void;" >> critical-calculations.d.ts
	echo "  benchmarkFunction(func: Function, input: number, iterations: number): number;" >> critical-calculations.d.ts
	echo "}" >> critical-calculations.d.ts
	echo "" >> critical-calculations.d.ts
	echo "export default function(): Promise<WASMModule>;" >> critical-calculations.d.ts

# Проверка размера файлов
size: wasm
	@echo "WASM file size:"
	@ls -lh *.wasm
	@echo "JS file size:"
	@ls -lh *.js

# Проверка валидности WASM
validate: wasm
	@echo "Validating WASM file..."
	@wasm-validate *.wasm || echo "WASM validation failed"

# Создание архива
package: wasm js types
	tar -czf wasm-calculations.tar.gz *.wasm *.js *.d.ts Makefile README.md

# Помощь
help:
	@echo "Доступные команды:"
	@echo "  all          - Компилирует WASM и JS файлы"
	@echo "  wasm         - Компилирует только WASM файл"
	@echo "  js           - Генерирует JavaScript обертку"
	@echo "  html         - Создает HTML страницу для тестирования"
	@echo "  production   - Оптимизированная версия для продакшена"
	@echo "  debug        - Отладочная версия"
	@echo "  types        - Генерирует TypeScript определения"
	@echo "  test         - Тестирует скомпилированный модуль"
	@echo "  benchmark    - Запускает бенчмарк"
	@echo "  size         - Показывает размер файлов"
	@echo "  validate     - Проверяет валидность WASM"
	@echo "  package      - Создает архив с файлами"
	@echo "  clean        - Удаляет скомпилированные файлы"
	@echo "  install-deps - Устанавливает системные зависимости"
	@echo "  install-emscripten - Устанавливает Emscripten SDK"
	@echo "  help         - Показывает эту справку" 