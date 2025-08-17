<template>
  <div class="inventory-page">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-package-variant</v-icon>
              Управление товарами и склад
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                @click="showAddProductDialog = true"
                prepend-icon="mdi-plus"
              >
                Добавить товар
              </v-btn>
              <v-btn
                color="success"
                @click="showTransactionDialog = true"
                prepend-icon="mdi-swap-horizontal"
                class="ml-2"
              >
                Транзакция
              </v-btn>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>

      <!-- Статистика по складу -->
      <v-row>
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-primary">{{ totalProducts }}</div>
              <div class="text-subtitle-1">Всего товаров</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-success">{{ formatCurrency(totalStockValue) }}</div>
              <div class="text-subtitle-1">Стоимость склада</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-warning">{{ lowStockProducts }}</div>
              <div class="text-subtitle-1">Низкий остаток</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-error">{{ outOfStockProducts }}</div>
              <div class="text-subtitle-1">Нет в наличии</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Графики аналитики -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Оборачиваемость товаров</v-card-title>
            <v-card-text>
              <canvas ref="turnoverChart" width="400" height="300"></canvas>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Прогноз спроса</v-card-title>
            <v-card-text>
              <canvas ref="demandChart" width="400" height="300"></canvas>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Список товаров -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              Товары ({{ filteredProducts.length }})
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchQuery"
                    label="Поиск по названию или SKU"
                    prepend-icon="mdi-magnify"
                    clearable
                    @input="filterProducts"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="selectedCategory"
                    label="Категория"
                    :items="categories"
                    clearable
                    @update:model-value="filterProducts"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="stockFilter"
                    label="Фильтр по остаткам"
                    :items="stockFilters"
                    clearable
                    @update:model-value="filterProducts"
                  ></v-select>
                </v-col>
              </v-row>
              
              <v-data-table
                :headers="headers"
                :items="filteredProducts"
                :loading="loading"
                :items-per-page="10"
                class="elevation-1 mt-4"
              >
                <template v-slot:item.current_stock="{ item }">
                  <v-chip
                    :color="getStockColor(item.current_stock, item.reorder_point)"
                    size="small"
                  >
                    {{ item.current_stock }} {{ item.unit }}
                  </v-chip>
                </template>
                
                <template v-slot:item.purchase_price="{ item }">
                  {{ formatCurrency(item.purchase_price) }}
                </template>
                
                <template v-slot:item.selling_price="{ item }">
                  {{ formatCurrency(item.selling_price) }}
                </template>
                
                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    @click="viewProduct(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="editProduct(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-chart-line"
                    size="small"
                    variant="text"
                    @click="showForecastDialog(item)"
                    color="info"
                  ></v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Диалог добавления/редактирования товара -->
      <v-dialog v-model="showAddProductDialog" max-width="800px">
        <v-card>
          <v-card-title>
            {{ editingProduct ? 'Редактировать товар' : 'Добавить товар' }}
          </v-card-title>
          
          <v-card-text>
            <v-form ref="productForm" v-model="productValid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.name"
                    label="Название товара"
                    :rules="[rules.required]"
                    maxlength="200"
                    counter
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.sku"
                    label="SKU"
                    :rules="[rules.required]"
                    maxlength="50"
                    counter
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="productForm.category"
                    label="Категория"
                    :items="categories"
                    :rules="[rules.required]"
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.unit"
                    label="Единица измерения"
                    :rules="[rules.required]"
                    maxlength="20"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="productForm.description"
                    label="Описание"
                    rows="3"
                    maxlength="1000"
                    counter
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="productForm.purchase_price"
                    label="Цена закупки"
                    type="number"
                    :rules="[rules.required, rules.positive]"
                    prefix="₽"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="productForm.selling_price"
                    label="Цена продажи"
                    type="number"
                    :rules="[rules.required, rules.positive]"
                    prefix="₽"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="productForm.wholesale_price"
                    label="Оптовая цена"
                    type="number"
                    :rules="[rules.positive]"
                    prefix="₽"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="productForm.min_stock_level"
                    label="Минимальный остаток"
                    type="number"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="productForm.max_stock_level"
                    label="Максимальный остаток"
                    type="number"
                    :rules="[rules.positive]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="productForm.reorder_point"
                    label="Точка заказа"
                    type="number"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.lead_time"
                    label="Время поставки (дни)"
                    type="number"
                    :rules="[rules.required, rules.positive]"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.weight"
                    label="Вес (кг)"
                    type="number"
                    :rules="[rules.positive]"
                    step="0.1"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showAddProductDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="saveProduct"
              :loading="saving"
              :disabled="!productValid"
            >
              {{ editingProduct ? 'Сохранить' : 'Добавить' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Диалог транзакции -->
      <v-dialog v-model="showTransactionDialog" max-width="600px">
        <v-card>
          <v-card-title>Создать транзакцию</v-card-title>
          
          <v-card-text>
            <v-form ref="transactionForm" v-model="transactionValid">
              <v-select
                v-model="transactionForm.product_id"
                label="Товар"
                :items="products"
                item-title="name"
                item-value="id"
                :rules="[rules.required]"
              ></v-select>
              
              <v-select
                v-model="transactionForm.transaction_type"
                label="Тип транзакции"
                :items="transactionTypes"
                :rules="[rules.required]"
              ></v-select>
              
              <v-text-field
                v-model="transactionForm.quantity"
                label="Количество"
                type="number"
                :rules="[rules.required, rules.positive]"
              ></v-text-field>
              
              <v-text-field
                v-model="transactionForm.unit_price"
                label="Цена за единицу"
                type="number"
                :rules="[rules.required, rules.positive]"
                prefix="₽"
              ></v-text-field>
              
              <v-text-field
                v-model="transactionForm.location"
                label="Место хранения"
                maxlength="100"
              ></v-text-field>
              
              <v-textarea
                v-model="transactionForm.notes"
                label="Примечания"
                rows="3"
                maxlength="500"
                counter
              ></v-textarea>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showTransactionDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="createTransaction"
              :loading="creatingTransaction"
              :disabled="!transactionValid"
            >
              Создать
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Диалог прогнозирования спроса -->
      <v-dialog v-model="showForecastDialog" max-width="600px">
        <v-card>
          <v-card-title>Прогноз спроса для {{ selectedProduct?.name }}</v-card-title>
          
          <v-card-text>
            <v-form ref="forecastForm" v-model="forecastValid">
              <v-select
                v-model="forecastForm.forecast_period"
                label="Период прогноза"
                :items="forecastPeriods"
                :rules="[rules.required]"
              ></v-select>
              
              <v-text-field
                v-model="forecastForm.start_date"
                label="Дата начала"
                type="date"
                :rules="[rules.required]"
              ></v-text-field>
              
              <v-text-field
                v-model="forecastForm.end_date"
                label="Дата окончания"
                type="date"
                :rules="[rules.required]"
              ></v-text-field>
              
              <v-checkbox
                v-model="forecastForm.include_seasonality"
                label="Учитывать сезонность"
              ></v-checkbox>
              
              <v-checkbox
                v-model="forecastForm.include_trends"
                label="Учитывать тренды"
              ></v-checkbox>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showForecastDialog = false">Отмена</v-btn>
            <v-btn
              color="primary"
              @click="createForecast"
              :loading="creatingForecast"
              :disabled="!forecastValid"
            >
              Создать прогноз
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Диалог просмотра товара -->
      <v-dialog v-model="showViewDialog" max-width="800px">
        <v-card>
          <v-card-title>{{ selectedProduct?.name }}</v-card-title>
          <v-card-text v-if="selectedProduct">
            <v-row>
              <v-col cols="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-identifier</v-icon>
                    </template>
                    <v-list-item-title>SKU</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedProduct.sku }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-tag</v-icon>
                    </template>
                    <v-list-item-title>Категория</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedProduct.category }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-package-variant</v-icon>
                    </template>
                    <v-list-item-title>Остаток</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getStockColor(selectedProduct.current_stock, selectedProduct.reorder_point)"
                        size="small"
                      >
                        {{ selectedProduct.current_stock }} {{ selectedProduct.unit }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-currency-rub</v-icon>
                    </template>
                    <v-list-item-title>Цена закупки</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(selectedProduct.purchase_price) }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-currency-rub</v-icon>
                    </template>
                    <v-list-item-title>Цена продажи</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(selectedProduct.selling_price) }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-chart-line</v-icon>
                    </template>
                    <v-list-item-title>Среднемесячные продажи</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedProduct.average_monthly_sales || 0 }} {{ selectedProduct.unit }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showViewDialog = false">Закрыть</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { createProduct, createInventoryTransaction, createDemandForecast, getInventoryAnalytics } from '@/api/index.js';
import Chart from 'chart.js/auto';

export default {
  name: 'InventoryPage',
  
  data() {
    return {
      loading: false,
      saving: false,
      creatingTransaction: false,
      creatingForecast: false,
      products: [],
      filteredProducts: [],
      searchQuery: '',
      selectedCategory: null,
      stockFilter: null,
      showAddProductDialog: false,
      showTransactionDialog: false,
      showForecastDialog: false,
      showViewDialog: false,
      editingProduct: null,
      selectedProduct: null,
      productValid: false,
      transactionValid: false,
      forecastValid: false,
      
      productForm: {
        name: '',
        sku: '',
        category: '',
        description: '',
        purchase_price: 0,
        selling_price: 0,
        wholesale_price: 0,
        min_stock_level: 0,
        max_stock_level: 0,
        reorder_point: 0,
        unit: 'шт',
        weight: 0,
        lead_time: 0
      },
      
      transactionForm: {
        product_id: '',
        transaction_type: 'purchase',
        quantity: 0,
        unit_price: 0,
        location: 'main_warehouse',
        notes: ''
      },
      
      forecastForm: {
        forecast_period: 'monthly',
        start_date: '',
        end_date: '',
        include_seasonality: true,
        include_trends: true
      },
      
      categories: [
        'Электроника',
        'Одежда',
        'Продукты',
        'Строительные материалы',
        'Книги',
        'Спорттовары'
      ],
      
      transactionTypes: [
        { title: 'Закупка', value: 'purchase' },
        { title: 'Продажа', value: 'sale' },
        { title: 'Возврат', value: 'return' },
        { title: 'Корректировка', value: 'adjustment' },
        { title: 'Перемещение', value: 'transfer' }
      ],
      
      forecastPeriods: [
        { title: 'Месячный', value: 'monthly' },
        { title: 'Квартальный', value: 'quarterly' },
        { title: 'Годовой', value: 'yearly' }
      ],
      
      stockFilters: [
        { title: 'Все товары', value: 'all' },
        { title: 'Низкий остаток', value: 'low' },
        { title: 'Нет в наличии', value: 'out' },
        { title: 'Избыток', value: 'excess' }
      ],
      
      headers: [
        { title: 'Название', key: 'name', sortable: true },
        { title: 'SKU', key: 'sku', sortable: true },
        { title: 'Категория', key: 'category', sortable: true },
        { title: 'Остаток', key: 'current_stock', sortable: true },
        { title: 'Цена закупки', key: 'purchase_price', sortable: true },
        { title: 'Цена продажи', key: 'selling_price', sortable: true },
        { title: 'Действия', key: 'actions', sortable: false }
      ],
      
      rules: {
        required: v => !!v || 'Обязательное поле',
        positive: v => v >= 0 || 'Значение должно быть положительным'
      },
      
      turnoverChart: null,
      demandChart: null
    };
  },
  
  computed: {
    totalProducts() {
      return this.products.length;
    },
    
    totalStockValue() {
      return this.products.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
    },
    
    lowStockProducts() {
      return this.products.filter(p => p.current_stock <= p.reorder_point && p.current_stock > 0).length;
    },
    
    outOfStockProducts() {
      return this.products.filter(p => p.current_stock === 0).length;
    }
  },
  
  async mounted() {
    await this.loadProducts();
    this.initCharts();
  },
  
  methods: {
    async loadProducts() {
      this.loading = true;
      try {
        // В реальности здесь будет вызов API для получения списка товаров
        // Пока используем моковые данные
        this.products = [
          {
            id: '1',
            name: 'Ноутбук Dell XPS 13',
            sku: 'LAP-DELL-XPS13',
            category: 'Электроника',
            description: '13-дюймовый ноутбук премиум-класса',
            current_stock: 5,
            min_stock_level: 2,
            max_stock_level: 20,
            reorder_point: 3,
            purchase_price: 45000,
            selling_price: 65000,
            wholesale_price: 60000,
            unit: 'шт',
            weight: 1.2,
            lead_time: 14,
            average_monthly_sales: 8
          },
          {
            id: '2',
            name: 'Смартфон iPhone 15',
            sku: 'PHONE-IPHONE15',
            category: 'Электроника',
            description: 'Смартфон Apple iPhone 15',
            current_stock: 0,
            min_stock_level: 5,
            max_stock_level: 50,
            reorder_point: 5,
            purchase_price: 65000,
            selling_price: 85000,
            wholesale_price: 80000,
            unit: 'шт',
            weight: 0.2,
            lead_time: 21,
            average_monthly_sales: 15
          }
        ];
        this.filteredProducts = [...this.products];
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        this.$toast.error('Ошибка загрузки товаров');
      } finally {
        this.loading = false;
      }
    },
    
    async saveProduct() {
      if (!this.$refs.productForm.validate()) return;
      
      this.saving = true;
      try {
        let response;
        
        if (this.editingProduct) {
          // В реальности здесь будет updateProduct
          response = { status: 'success' };
        } else {
          response = await createProduct(this.productForm);
        }
        
        if (response.status === 'success') {
          await this.loadProducts();
          this.showAddProductDialog = false;
          this.resetProductForm();
          this.$toast.success(
            this.editingProduct ? 'Товар обновлен' : 'Товар добавлен'
          );
        }
      } catch (error) {
        console.error('Ошибка сохранения товара:', error);
        this.$toast.error('Ошибка сохранения товара');
      } finally {
        this.saving = false;
      }
    },
    
    async createTransaction() {
      if (!this.$refs.transactionForm.validate()) return;
      
      this.creatingTransaction = true;
      try {
        const response = await createInventoryTransaction(this.transactionForm);
        if (response.status === 'success') {
          await this.loadProducts();
          this.showTransactionDialog = false;
          this.resetTransactionForm();
          this.$toast.success('Транзакция создана');
        }
      } catch (error) {
        console.error('Ошибка создания транзакции:', error);
        this.$toast.error('Ошибка создания транзакции');
      } finally {
        this.creatingTransaction = false;
      }
    },
    
    async createForecast() {
      if (!this.$refs.forecastForm.validate()) return;
      
      this.creatingForecast = true;
      try {
        const response = await createDemandForecast({
          ...this.forecastForm,
          product_id: this.selectedProduct.id
        });
        
        if (response.status === 'success') {
          this.showForecastDialog = false;
          this.resetForecastForm();
          this.$toast.success('Прогноз спроса создан');
        }
      } catch (error) {
        console.error('Ошибка создания прогноза:', error);
        this.$toast.error('Ошибка создания прогноза');
      } finally {
        this.creatingForecast = false;
      }
    },
    
    editProduct(product) {
      this.editingProduct = product;
      this.productForm = { ...product };
      this.showAddProductDialog = true;
    },
    
    viewProduct(product) {
      this.selectedProduct = product;
      this.showViewDialog = true;
    },
    
    showForecastDialog(product) {
      this.selectedProduct = product;
      this.forecastForm.start_date = new Date().toISOString().substr(0, 10);
      this.forecastForm.end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10);
      this.showForecastDialog = true;
    },
    
    filterProducts() {
      let filtered = [...this.products];
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query)
        );
      }
      
      if (this.selectedCategory) {
        filtered = filtered.filter(product =>
          product.category === this.selectedCategory
        );
      }
      
      if (this.stockFilter) {
        switch (this.stockFilter) {
          case 'low':
            filtered = filtered.filter(product =>
              product.current_stock <= product.reorder_point && product.current_stock > 0
            );
            break;
          case 'out':
            filtered = filtered.filter(product => product.current_stock === 0);
            break;
          case 'excess':
            filtered = filtered.filter(product =>
              product.current_stock > product.max_stock_level
            );
            break;
        }
      }
      
      this.filteredProducts = filtered;
    },
    
    resetProductForm() {
      this.productForm = {
        name: '',
        sku: '',
        category: '',
        description: '',
        purchase_price: 0,
        selling_price: 0,
        wholesale_price: 0,
        min_stock_level: 0,
        max_stock_level: 0,
        reorder_point: 0,
        unit: 'шт',
        weight: 0,
        lead_time: 0
      };
      this.editingProduct = null;
      this.$refs.productForm.resetValidation();
    },
    
    resetTransactionForm() {
      this.transactionForm = {
        product_id: '',
        transaction_type: 'purchase',
        quantity: 0,
        unit_price: 0,
        location: 'main_warehouse',
        notes: ''
      };
      this.$refs.transactionForm.resetValidation();
    },
    
    resetForecastForm() {
      this.forecastForm = {
        forecast_period: 'monthly',
        start_date: '',
        end_date: '',
        include_seasonality: true,
        include_trends: true
      };
      this.$refs.forecastForm.resetValidation();
    },
    
    initCharts() {
      // График оборачиваемости
      const turnoverCtx = this.$refs.turnoverChart?.getContext('2d');
      if (turnoverCtx) {
        this.turnoverChart = new Chart(turnoverCtx, {
          type: 'bar',
          data: {
            labels: this.products.map(p => p.name.substring(0, 20)),
            datasets: [{
              label: 'Дни оборачиваемости',
              data: this.products.map(p => 
                p.average_monthly_sales > 0 ? Math.round((p.current_stock / p.average_monthly_sales) * 30) : 0
              ),
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
      
      // График прогноза спроса
      const demandCtx = this.$refs.demandChart?.getContext('2d');
      if (demandCtx) {
        this.demandChart = new Chart(demandCtx, {
          type: 'line',
          data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
            datasets: [{
              label: 'Фактические продажи',
              data: [12, 19, 15, 25, 22, 30],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }, {
              label: 'Прогноз',
              data: [null, null, null, 28, 32, 35],
              borderColor: 'rgb(255, 99, 132)',
              borderDash: [5, 5],
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    },
    
    getStockColor(stock, reorderPoint) {
      if (stock === 0) return 'error';
      if (stock <= reorderPoint) return 'warning';
      return 'success';
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(amount);
    }
  }
};
</script>

<style scoped>
.inventory-page {
  padding: 20px;
}

canvas {
  max-height: 300px;
}
</style> 