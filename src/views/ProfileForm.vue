<template>
  <v-container class="profile-container">
    <v-row>
      <v-col>
        <!-- Уведомления -->
        <v-snackbar
          v-model="snackbar.show"
          :timeout="snackbar.timeout"
          :color="snackbar.color"
          top
          right
          elevation="24"
        >
          <div class="snackbar-content">
            <v-icon left>{{ snackbar.icon }}</v-icon>
            <div>
              <div class="snackbar-title">{{ snackbar.title }}</div>
              <div class="snackbar-message">{{ snackbar.message }}</div>
            </div>
          </div>
          <template v-slot:action="{ attrs }">
            <v-btn icon v-bind="attrs" @click="snackbar.show = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-snackbar>

        <h1 class="page-title">Профиль</h1>

        <v-btn
          color="error"
          outlined
          class="logout-btn"
          @click="confirmLogout"
          :loading="logoutLoading"
        >
          <v-icon left>mdi-logout</v-icon> Выйти
        </v-btn>

        <v-card class="profile-card" elevation="4">
          <v-form ref="form" v-model="valid" @submit.prevent="confirmSave">
            <v-row>
              <!-- Аватар и основная информация -->
              <v-col cols="12" md="4" class="avatar-col">
                <div class="avatar-wrapper">
                  <v-avatar size="150" class="profile-avatar">
                    <v-img
                      :src="profile.avatar || require('@/assets/logo.png')"
                      alt="Аватар профиля"
                    ></v-img>
                  </v-avatar>
                </div>

                <div class="user-meta">
                  <h3 class="user-name">{{ profile.name || 'Без имени' }}</h3>
                  <v-chip small class="role-chip">{{ formatRole(profile.role) }}</v-chip>
                  <v-chip small color="grey lighten-2" class="mt-2">ID: {{ profile.user_id }}</v-chip>
                </div>
              </v-col>

              <!-- Форма редактирования -->
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="profile.email"
                  label="Email"
                  outlined
                  dense
                  persistent-hint
                  :disabled="!isEditing"
                  :rules="emailRules"
                  :error-messages="fieldErrors.email"
                  @input="clearFieldError('email')"
                  class="input-field"
                />

                <v-text-field
                  v-model="profile.name"
                  label="Имя"
                  outlined
                  dense
                  :disabled="!isEditing"
                  :rules="nameRules"
                  :error-messages="fieldErrors.name"
                  @input="clearFieldError('name')"
                  class="input-field"
                />

                <v-text-field
                  v-model="profile.company_name"
                  label="Название компании"
                  outlined
                  dense
                  :disabled="!isEditing || !isCompanyAdmin"
                  :error-messages="fieldErrors.company_name"
                  @input="clearFieldError('company_name')"
                  class="input-field"
                />

                <v-text-field
                  v-model="profile.inn"
                  label="ИНН компании"
                  outlined
                  dense
                  :disabled="!isEditing || !isCompanyAdmin"
                  :rules="innRules"
                  :error-messages="fieldErrors.inn"
                  @input="clearFieldError('inn')"
                  class="input-field"
                  hint="10 или 12 цифр"
                  persistent-hint
                />

                <v-text-field
                  v-model="profile.phone"
                  label="Телефон"
                  outlined
                  dense
                  :disabled="!isEditing"
                  :rules="phoneRules"
                  :error-messages="fieldErrors.phone"
                  @input="clearFieldError('phone')"
                  class="input-field"
                />

                <v-menu
                  v-if="isEditing"
                  ref="dobMenu"
                  v-model="dobMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="profile.date_of_birth"
                      label="Дата рождения"
                      prepend-icon="mdi-calendar"
                      readonly
                      outlined
                      dense
                      v-bind="attrs"
                      v-on="on"
                      class="input-field"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="profile.date_of_birth"
                    no-title
                    scrollable
                    :max="new Date().toISOString().substr(0, 10)"
                    @input="dobMenu = false"
                  ></v-date-picker>
                </v-menu>

                <!-- Секция подписки -->
                <v-divider class="my-4"></v-divider>
                <h3 class="section-title">Статус подписки</h3>
                <v-alert
                  :type="subscriptionAlertType"
                  class="mb-4"
                  outlined
                >
                  {{ subscriptionMessage }}
                </v-alert>
                <v-progress-linear
                  v-if="profile.subscription_status === 'trial' && profile.trial_end"
                  :value="trialProgress"
                  color="primary"
                  class="mb-4"
                  height="8"
                  rounded
                />

                <!-- Информация о карте -->
                <v-card
                  v-if="profile.attachedCard"
                  flat
                  class="card-info mb-4"
                  outlined
                >
                  <v-card-text>
                    <div class="card-details">
                      <v-icon left>mdi-credit-card</v-icon>
                      <span>Карта: {{ profile.attachedCard.brand }} **** {{ profile.attachedCard.last4 }}</span>
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      color="error"
                      text
                      @click="confirmDetachCard"
                    >
                      Открепить карту
                    </v-btn>
                  </v-card-actions>
                </v-card>

                <div class="subscription-buttons">
                  <v-btn
                    v-if="!profile.attachedCard"
                    color="primary"
                    outlined
                    class="action-btn"
                    @click="showAttachCardDialog = true"
                  >
                    <v-icon left>mdi-credit-card-plus</v-icon> Прикрепить карту
                  </v-btn>
                  <v-btn
                    color="primary"
                    outlined
                    class="action-btn"
                    @click="showPaymentDialog = true"
                    v-if="profile.subscription_status === 'expired' || profile.subscription_status === 'trial'"
                  >
                    <v-icon left>mdi-credit-card</v-icon> Оформить подписку
                  </v-btn>
                  <v-btn
                    color="primary"
                    outlined
                    class="action-btn"
                    :to="{ name: 'Subscription' }"
                    v-else
                  >
                    <v-icon left>mdi-cog</v-icon> Управление подпиской
                  </v-btn>
                </div>

                <div class="button-group">
                  <v-btn
                    v-if="!isEditing"
                    color="primary"
                    outlined
                    class="action-btn"
                    @click="startEditing"
                    :disabled="!profile.editable"
                  >
                    <v-icon left>mdi-pencil</v-icon> Редактировать
                  </v-btn>

                  <template v-else>
                    <v-btn
                      type="submit"
                      color="primary"
                      class="action-btn"
                      :loading="loading"
                      :disabled="!valid"
                    >
                      <v-icon left>mdi-content-save</v-icon> Сохранить
                    </v-btn>
                    <v-btn
                      color="error"
                      outlined
                      class="action-btn"
                      @click="cancelEditing"
                      :disabled="loading"
                    >
                      <v-icon left>mdi-close</v-icon> Отмена
                    </v-btn>
                  </template>

                  <v-btn
                    v-if="isCompanyAdmin"
                    color="error"
                    outlined
                    class="action-btn"
                    @click="showDeleteDialog = true"
                    :loading="deleteLoading"
                  >
                    <v-icon left>mdi-delete</v-icon> Удалить компанию
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card>

        <!-- Диалог подтверждения сохранения -->
        <v-dialog v-model="showConfirmDialog" max-width="450" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Подтверждение изменений
            </v-card-title>
            <v-card-text class="dialog-text">
              Вы уверены, что хотите сохранить изменения в профиле?
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn text color="grey" @click="showConfirmDialog = false">
                Отменить
              </v-btn>
              <v-btn color="primary" @click="saveProfile" :loading="loading">
                Подтвердить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог подтверждения выхода -->
        <v-dialog v-model="showLogoutDialog" max-width="450" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Подтверждение выхода
            </v-card-title>
            <v-card-text class="dialog-text">
              Вы уверены, что хотите выйти из профиля?
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn text color="grey" @click="showLogoutDialog = false">
                Отменить
              </v-btn>
              <v-btn color="error" @click="logout" :loading="logoutLoading">
                Выйти
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог удаления компании -->
        <v-dialog v-model="showDeleteDialog" max-width="450" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Удаление компании
            </v-card-title>
            <v-card-text class="dialog-text">
              <v-alert
                type="error"
                outlined
                prominent
                class="mb-4"
              >
                Внимание! Это действие удалит компанию и всех её пользователей. Отменить это действие будет невозможно.
              </v-alert>
              <v-text-field
                v-model="deleteConfirmation"
                label="Введите название компании для подтверждения"
                outlined
                dense
              />
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn text color="grey" @click="showDeleteDialog = false">
                Отменить
              </v-btn>
              <v-btn
                color="error"
                @click="deleteCompany"
                :loading="deleteLoading"
                :disabled="deleteConfirmation !== profile.company_name"
              >
                Удалить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог прикрепления карты -->
        <v-dialog v-model="showAttachCardDialog" max-width="500" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              <v-icon left>mdi-credit-card-plus</v-icon>
              Прикрепить карту
            </v-card-title>
            <v-card-text class="dialog-text">
              <v-form ref="attachCardForm" v-model="attachCardValid">
                <v-text-field
                  v-model="paymentData.cardNumber"
                  label="Номер карты"
                  outlined
                  dense
                  :rules="cardNumberRules"
                  :error-messages="paymentErrors.cardNumber"
                  @input="clearPaymentError('cardNumber')"
                  class="input-field"
                />
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="paymentData.expiry"
                      label="Срок действия (MM/YY)"
                      outlined
                      dense
                      :rules="expiryRules"
                      :error-messages="paymentErrors.expiry"
                      @input="clearPaymentError('expiry')"
                      class="input-field"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="paymentData.cvc"
                      label="CVC"
                      outlined
                      dense
                      :rules="cvcRules"
                      :error-messages="paymentErrors.cvc"
                      @input="clearPaymentError('cvc')"
                      class="input-field"
                    />
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn text color="grey" @click="cancelAttachCard" :disabled="attachCardLoading">
                Отменить
              </v-btn>
              <v-btn
                color="primary"
                @click="attachCard"
                :loading="attachCardLoading"
                :disabled="!attachCardValid"
              >
                Прикрепить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог подтверждения открепления карты -->
        <v-dialog v-model="showDetachCardDialog" max-width="450" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              Подтверждение открепления
            </v-card-title>
            <v-card-text class="dialog-text">
              Вы уверены, что хотите открепить карту {{ profile.attachedCard?.brand }} **** {{ profile.attachedCard?.last4 }}?
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn text color="grey" @click="showDetachCardDialog = false">
                Отменить
              </v-btn>
              <v-btn
                color="error"
                @click="detachCard"
                :loading="detachCardLoading"
              >
                Открепить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Диалог оплаты -->
        <v-dialog v-model="showPaymentDialog" max-width="500" persistent>
          <v-card class="dialog-card">
            <v-card-title class="dialog-title">
              <v-icon left>mdi-credit-card</v-icon>
              Оформление подписки
            </v-card-title>
            <v-card-text class="dialog-text">
              <v-form ref="paymentForm" v-model="paymentValid">
                <v-text-field
                  v-if="!profile.attachedCard"
                  v-model="paymentData.cardNumber"
                  label="Номер карты"
                  outlined
                  dense
                  :rules="cardNumberRules"
                  :error-messages="paymentErrors.cardNumber"
                  @input="clearPaymentError('cardNumber')"
                  class="input-field"
                />
                <v-row v-if="!profile.attachedCard">
                  <v-col cols="6">
                    <v-text-field
                      v-model="paymentData.expiry"
                      label="Срок действия (MM/YY)"
                      outlined
                      dense
                      :rules="expiryRules"
                      :error-messages="paymentErrors.expiry"
                      @input="clearPaymentError('expiry')"
                      class="input-field"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="paymentData.cvc"
                      label="CVC"
                      outlined
                      dense
                      :rules="cvcRules"
                      :error-messages="paymentErrors.cvc"
                      @input="clearPaymentError('cvc')"
                      class="input-field"
                    />
                  </v-col>
                </v-row>
                <v-card
                  v-if="profile.attachedCard"
                  flat
                  class="card-info mb-4"
                  outlined
                >
                  <v-card-text>
                    <div class="card-details">
                      <v-icon left>mdi-credit-card</v-icon>
                      <span>Карта: {{ profile.attachedCard.brand }} **** {{ profile.attachedCard.last4 }}</span>
                    </div>
                  </v-card-text>
                </v-card>
                <v-select
                  v-model="paymentData.plan"
                  :items="subscriptionPlans"
                  item-text="name"
                  item-value="id"
                  label="План подписки"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Выберите план']"
                  class="input-field"
                />
              </v-form>
            </v-card-text>
            <v-card-actions class="dialog-actions">
              <v-spacer />
              <v-btn text color="grey" @click="cancelPayment" :disabled="paymentLoading">
                Отменить
              </v-btn>
              <v-btn
                color="primary"
                @click="submitPayment"
                :loading="paymentLoading"
                :disabled="!paymentValid"
              >
                Оплатить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getProfile, updateProfile, deleteCompany, logoutUser, initiatePayment, attachCard, detachCard } from '@/api';

export default {
  name: 'ProfileForm',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const valid = ref(false);
    const loading = ref(false);
    const logoutLoading = ref(false);
    const deleteLoading = ref(false);
    const paymentLoading = ref(false);
    const attachCardLoading = ref(false);
    const detachCardLoading = ref(false);
    const isEditing = ref(false);
    const dobMenu = ref(false);
    const showConfirmDialog = ref(false);
    const showLogoutDialog = ref(false);
    const showDeleteDialog = ref(false);
    const showPaymentDialog = ref(false);
    const showAttachCardDialog = ref(false);
    const showDetachCardDialog = ref(false);
    const deleteConfirmation = ref('');
    const fieldErrors = ref({});
    const paymentErrors = ref({});
    const paymentValid = ref(false);
    const attachCardValid = ref(false);
    const form = ref(null);
    const paymentForm = ref(null);
    const attachCardForm = ref(null);

    const profile = ref({
      user_id: '',
      name: '',
      email: '',
      role: '',
      company_name: '',
      company_id: '',
      inn: '',
      phone: '',
      date_of_birth: '',
      avatar: '',
      editable: false,
      subscription_status: '',
      trial_end: '',
      created_at: '',
      attachedCard: null, // { card_id, last4, brand }
    });

    const originalProfile = ref({});

    const paymentData = ref({
      cardNumber: '',
      expiry: '',
      cvc: '',
      plan: '',
    });

    const subscriptionPlans = ref([
      { id: 'basic', name: 'Базовый (500 руб/мес)' },
      { id: 'pro', name: 'Профессиональный (1000 руб/мес)' },
    ]);

    const snackbar = ref({
      show: false,
      title: '',
      message: '',
      color: 'info',
      icon: '',
      timeout: 5000,
    });

    const emailRules = [
      (v) => !!v || 'Email обязателен',
      (v) => /.+@.+\..+/.test(v) || 'Неверный формат email',
    ];

    const nameRules = [
      (v) => !!v || 'Имя обязательно',
      (v) => v.length >= 2 || 'Минимум 2 символа',
    ];

    const innRules = [
      (v) => !v || /^\d{10}$|^\d{12}$/.test(v) || 'ИНН должен содержать 10 или 12 цифр',
    ];

    const phoneRules = [
      (v) => !v || /^\+?[0-9\s\-()]{10,17}$/.test(v) || 'Неверный формат телефона',
    ];

    const cardNumberRules = [
      (v) => !!v || 'Номер карты обязателен',
      (v) => /^\d{16}$/.test(v) || 'Номер карты должен содержать 16 цифр',
    ];

    const expiryRules = [
      (v) => !!v || 'Срок действия обязателен',
      (v) => /^\d{2}\/\d{2}$/.test(v) || 'Формат MM/YY',
      (v) => {
        const [month, year] = v.split('/');
        const now = new Date();
        const expiryDate = new Date(`20${year}`, month - 1);
        return expiryDate > now || 'Карта истекла';
      },
    ];

    const cvcRules = [
      (v) => !!v || 'CVC обязателен',
      (v) => /^\d{3}$/.test(v) || 'CVC должен содержать 3 цифры',
    ];

    const isCompanyAdmin = computed(() => profile.value.role === 'admin');

    const subscriptionAlertType = computed(() => {
      const status = profile.value.subscription_status;
      if (status === 'active') return 'success';
      if (status === 'expired') return 'warning';
      if (status === 'trial') return 'info';
      return 'info';
    });

    const subscriptionMessage = computed(() => {
      const status = profile.value.subscription_status;
      const trialEnd = profile.value.trial_end;
      if (status === 'active') {
        return 'Ваша подписка активна.';
      } else if (status === 'expired') {
        return 'Ваш пробный период истек. Оформите подписку для продолжения.';
      } else if (status === 'trial' && trialEnd) {
        const endDate = new Date(trialEnd).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        return `Ваш пробный период активен до ${endDate}.`;
      }
      return 'Информация о подписке недоступна.';
    });

    const trialProgress = computed(() => {
      const start = new Date(profile.value.created_at || Date.now());
      const end = new Date(profile.value.trial_end);
      const total = end - start;
      const remaining = end - Date.now();
      return Math.max(0, Math.min(100, (remaining / total) * 100));
    });

    const loadProfile = async () => {
      try {
        await authStore.fetchProfile();
        profile.value = {
          ...authStore.user,
          attachedCard: authStore.user.attachedCard || null,
        };
        originalProfile.value = { ...profile.value };
      } catch (error) {
        showError('Ошибка загрузки', 'Не удалось загрузить профиль', error);
      }
    };

    const startEditing = () => {
      isEditing.value = true;
    };

    const cancelEditing = () => {
      profile.value = { ...originalProfile.value };
      isEditing.value = false;
      fieldErrors.value = {};
      form.value?.resetValidation();
    };

    const confirmSave = () => {
      if (form.value.validate()) {
        showConfirmDialog.value = true;
      }
    };

    const saveProfile = async () => {
      loading.value = true;
      try {
        await authStore.updateProfile({
          email: profile.value.email,
          name: profile.value.name,
          company_name: profile.value.company_name,
          inn: profile.value.inn,
          phone: profile.value.phone,
          date_of_birth: profile.value.date_of_birth,
        });
        originalProfile.value = { ...profile.value };
        isEditing.value = false;
        showSuccess('Успешно', 'Профиль обновлён');
        await loadProfile();
      } catch (error) {
        handleProfileError(error);
      } finally {
        loading.value = false;
        showConfirmDialog.value = false;
      }
    };

    const confirmLogout = () => {
      showLogoutDialog.value = true;
    };

    const logout = async () => {
      logoutLoading.value = true;
      try {
        await authStore.logout();
        router.push('/login');
      } catch (error) {
        showError('Ошибка', 'Не удалось выйти из профиля', error);
      } finally {
        logoutLoading.value = false;
        showLogoutDialog.value = false;
      }
    };

    const deleteCompany = async () => {
      if (deleteConfirmation.value !== profile.value.company_name) return;
      deleteLoading.value = true;
      try {
        await deleteCompany(profile.value.company_id);
        showSuccess('Успешно', 'Компания удалена');
        router.push('/login');
      } catch (error) {
        showError('Ошибка', 'Не удалось удалить компанию', error);
      } finally {
        deleteLoading.value = false;
        showDeleteDialog.value = false;
        deleteConfirmation.value = '';
      }
    };

    const attachCard = async () => {
      if (!attachCardForm.value.validate()) return;
      attachCardLoading.value = true;
      try {
        const response = await attachCard({
          card_number: paymentData.value.cardNumber.replace(/\s/g, ''),
          expiry: paymentData.value.expiry,
          cvc: paymentData.value.cvc,
        });
        profile.value.attachedCard = {
          card_id: response.card_id,
          last4: response.last4,
          brand: response.brand,
        };
        showSuccess('Успех', 'Карта успешно прикреплена');
        showAttachCardDialog.value = false;
        attachCardForm.value.reset();
      } catch (error) {
        handleCardError(error, 'Ошибка прикрепления карты', 'Не удалось прикрепить карту');
      } finally {
        attachCardLoading.value = false;
      }
    };

    const confirmDetachCard = () => {
      showDetachCardDialog.value = true;
    };

    const detachCard = async () => {
      detachCardLoading.value = true;
      try {
        await detachCard(profile.value.attachedCard.card_id);
        profile.value.attachedCard = null;
        showSuccess('Успех', 'Карта успешно откреплена');
        showDetachCardDialog.value = false;
      } catch (error) {
        handleCardError(error, 'Ошибка открепления карты', 'Не удалось открепить карту');
      } finally {
        detachCardLoading.value = false;
      }
    };

    const submitPayment = async () => {
      if (!paymentForm.value.validate()) return;
      paymentLoading.value = true;
      try {
        const paymentPayload = {
          plan: paymentData.value.plan,
        };
        if (!profile.value.attachedCard) {
          paymentPayload.card_number = paymentData.value.cardNumber.replace(/\s/g, '');
          paymentPayload.expiry = paymentData.value.expiry;
          paymentPayload.cvc = paymentData.value.cvc;
        } else {
          paymentPayload.card_id = profile.value.attachedCard.card_id;
        }
        const response = await initiatePayment(paymentPayload);
        showSuccess('Успех', 'Оплата успешно проведена');
        await loadProfile();
        showPaymentDialog.value = false;
        paymentForm.value.reset();
      } catch (error) {
        handlePaymentError(error);
      } finally {
        paymentLoading.value = false;
      }
    };

    const cancelPayment = () => {
      showPaymentDialog.value = false;
      paymentForm.value.reset();
      paymentErrors.value = {};
    };

    const cancelAttachCard = () => {
      showAttachCardDialog.value = false;
      attachCardForm.value.reset();
      paymentErrors.value = {};
    };

    const formatRole = (role) => {
      const roles = {
        admin: 'Администратор',
        manager: 'Менеджер',
        user: 'Пользователь',
      };
      return roles[role] || role;
    };

    const handleProfileError = (error) => {
      if (error.response && error.response.status === 422) {
        fieldErrors.value = error.response.data.errors || {};
        showError('Ошибка валидации', 'Проверьте правильность введённых данных');
      } else {
        showError('Ошибка', 'Не удалось сохранить профиль', error);
      }
    };

    const handlePaymentError = (error) => {
      if (error.response && error.response.status === 422) {
        paymentErrors.value = error.response.data.errors || {};
        showError('Ошибка оплаты', 'Проверьте данные карты');
      } else if (error.response && error.response.status === 402) {
        showError('Ошибка оплаты', 'Недостаточно средств или карта отклонена');
      } else {
        showError('Ошибка', 'Не удалось обработать платеж', error);
      }
    };

    const handleCardError = (error, title, defaultMessage) => {
      if (error.response && error.response.status === 422) {
        paymentErrors.value = error.response.data.errors || {};
        showError(title, 'Проверьте данные карты');
      } else if (error.response && error.response.status === 402) {
        showError(title, 'Карта отклонена');
      } else {
        showError(title, error.response?.data?.message || defaultMessage, error);
      }
    };

    const clearFieldError = (field) => {
      if (fieldErrors.value[field]) {
        delete fieldErrors.value[field];
      }
    };

    const clearPaymentError = (field) => {
      if (paymentErrors.value[field]) {
        delete paymentErrors.value[field];
      }
    };

    const showSuccess = (title, message) => {
      snackbar.value = {
        show: true,
        title,
        message,
        color: 'success',
        icon: 'mdi-check-circle',
        timeout: 4000,
      };
    };

    const showError = (title, message, error = null) => {
      console.error(title, error);
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      snackbar.value = {
        show: true,
        title,
        message,
        color: 'error',
        icon: 'mdi-alert-circle',
        timeout: 6000,
      };
    };

    loadProfile();

    return {
      valid,
      loading,
      logoutLoading,
      deleteLoading,
      paymentLoading,
      attachCardLoading,
      detachCardLoading,
      isEditing,
      dobMenu,
      profile,
      originalProfile,
      paymentData,
      subscriptionPlans,
      showConfirmDialog,
      showLogoutDialog,
      showDeleteDialog,
      showPaymentDialog,
      showAttachCardDialog,
      showDetachCardDialog,
      deleteConfirmation,
      fieldErrors,
      paymentErrors,
      paymentValid,
      attachCardValid,
      snackbar,
      emailRules,
      nameRules,
      innRules,
      phoneRules,
      cardNumberRules,
      expiryRules,
      cvcRules,
      isCompanyAdmin,
      subscriptionAlertType,
      subscriptionMessage,
      trialProgress,
      loadProfile,
      startEditing,
      cancelEditing,
      confirmSave,
      saveProfile,
      confirmLogout,
      logout,
      deleteCompany,
      attachCard,
      confirmDetachCard,
      detachCard,
      submitPayment,
      cancelPayment,
      cancelAttachCard,
      formatRole,
      handleProfileError,
      handlePaymentError,
      handleCardError,
      clearFieldError,
      clearPaymentError,
      showSuccess,
      showError,
      form,
      paymentForm,
      attachCardForm,
    };
  },
};
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  padding: 24px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1976d2;
  text-align: center;
}

.logout-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  font-weight: 500;
}

.profile-card {
  border-radius: 12px;
  padding: 24px;
}

.avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.profile-avatar {
  border: 3px solid #1976d2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-meta {
  text-align: center;
  margin-bottom: 20px;
}

.user-name {
  font-size: 1.4rem;
  margin-bottom: 8px;
}

.role-chip {
  margin-bottom: 8px;
  font-weight: 500;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.input-field {
  margin-bottom: 16px;
}

.card-info {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.card-details {
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: #263238;
}

.subscription-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.action-btn {
  flex: 1;
  min-width: 150px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.dialog-card {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-title {
  font-weight: 600;
  color: #1976d2;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.dialog-text {
  padding: 16px;
  font-size: 1rem;
}

.dialog-actions {
  padding: 16px;
  border-top: 1px solid #eee;
}

.snackbar-content {
  display: flex;
  align-items: center;
}

.snackbar-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.snackbar-message {
  font-size: 0.9rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .profile-container {
    padding: 16px;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .profile-card {
    padding: 16px;
  }

  .logout-btn {
    position: relative;
    top: auto;
    right: auto;
    margin-bottom: 16px;
  }

  .subscription-buttons,
  .button-group {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 1.4rem;
  }

  .user-name {
    font-size: 1.2rem;
  }

  .section-title {
    font-size: 1.1rem;
  }
}
</style>