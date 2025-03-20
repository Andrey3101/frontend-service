<template>
  <v-container class="documents-container">
    <v-row>
      <v-col cols="12">
        <h1 class="page-title">Документы</h1>
        <v-btn color="primary" class="upload-btn" @click="uploadDialog = true">
          <v-icon left>mdi-upload</v-icon>
          Загрузить документ
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="documents"
          :loading="loading"
          class="documents-table"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn icon @click="downloadDocument(item)" aria-label="Скачать документ">
              <v-icon>mdi-download</v-icon>
            </v-btn>
            <v-btn icon color="red" @click="deleteDocument(item)" aria-label="Удалить документ">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog v-model="uploadDialog" max-width="500">
      <v-card class="upload-card">
        <v-card-title>Загрузка документа</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="newDocument"
            label="Выберите файл"
            accept=".pdf,.docx,.xlsx"
            prepend-icon="mdi-paperclip"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="uploadDialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="uploadFile">Загрузить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      uploadDialog: false,
      newDocument: null,
      headers: [
        { text: 'Название', value: 'name' },
        { text: 'Дата', value: 'date' },
        { text: 'Размер', value: 'size' },
        { text: 'Действия', value: 'actions', sortable: false },
      ],
      documents: [
        { name: 'Договор.pdf', date: '2025-03-20', size: '1.2 MB' },
        { name: 'Отчет.xlsx', date: '2025-03-19', size: '500 KB' },
      ],
    };
  },
  methods: {
    async uploadFile() {
      if (!this.newDocument) return;
      this.loading = true;
      // Логика загрузки файла
      setTimeout(() => {
        this.documents.push({
          name: this.newDocument.name,
          date: new Date().toISOString().slice(0, 10),
          size: `${(this.newDocument.size / 1024).toFixed(1)} KB`,
        });
        this.uploadDialog = false;
        this.newDocument = null;
        this.loading = false;
      }, 1000);
    },
    downloadDocument(item) {
      console.log('Скачивание:', item.name);
    },
    deleteDocument(item) {
      this.documents = this.documents.filter(doc => doc.name !== item.name);
    },
  },
};
</script>

<style scoped>
.documents-container {
  padding: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.upload-btn {
  margin-bottom: 16px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.documents-table {
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.upload-card {
  padding: 16px;
}

.upload-card .v-card-title {
  font-size: 20px;
  font-weight: 500;
  color: #1976d2;
}

.upload-card .v-btn {
  text-transform: none;
}
</style>