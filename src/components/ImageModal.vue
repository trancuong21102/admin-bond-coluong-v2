<script setup>
import { ref, watch } from 'vue';
import { X, Upload } from '@lucide/vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'submit']);

const title = ref('');
const description = ref('');
const categoryId = ref('');
const isPublic = ref('true');
const imageFile = ref(null);
const imagePreview = ref('');
const fileInput = ref(null);
const errors = ref({});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    title.value = '';
    description.value = '';
    // Select first category by default if available
    categoryId.value = props.categories.length > 0 ? String(props.categories[0].id) : '';
    isPublic.value = 'true';
    imageFile.value = null;
    imagePreview.value = '';
    errors.value = {};
  }
});

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.value.imageFile = 'Kích thước ảnh không vượt quá 5MB';
      return;
    }
    errors.value.imageFile = null;
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.value = event.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const validate = () => {
  const errs = {};
  if (!title.value.trim()) {
    errs.title = 'Tiêu đề ảnh là bắt buộc';
  }
  if (!categoryId.value) {
    errs.categoryId = 'Vui lòng chọn danh mục';
  }
  if (!imageFile.value) {
    errs.imageFile = 'File ảnh là bắt buộc';
  }
  errors.value = errs;
  return Object.keys(errs).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;

  const formData = new FormData();
  formData.append('title', title.value.trim());
  formData.append('description', description.value.trim());
  formData.append('categoryId', categoryId.value);
  formData.append('isPublic', isPublic.value);
  formData.append('image', imageFile.value);

  emit('submit', formData);
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Upload hình ảnh mới</h3>
        <button class="modal-close" @click="handleClose">
          <X :size="20" />
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Tiêu đề ảnh <span style="color: var(--danger)">*</span></label>
          <input
            v-model="title"
            type="text"
            class="form-control"
            placeholder="Nhập tiêu đề ảnh (ví dụ: Ảnh núi tuyết)"
          />
          <span v-if="errors.title" style="color: var(--danger); font-size: 0.8rem; display: block; margin-top: 0.25rem;">
            {{ errors.title }}
          </span>
        </div>
        
        <div class="form-group">
          <label class="form-label">Mô tả chi tiết</label>
          <textarea
            v-model="description"
            class="form-control"
            placeholder="Mô tả ngắn gọn về bức ảnh..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Thuộc danh mục <span style="color: var(--danger)">*</span></label>
          <select v-model="categoryId" class="form-control">
            <option value="" disabled>Chọn danh mục...</option>
            <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">
              {{ cat.name }}
            </option>
          </select>
          <span v-if="errors.categoryId" style="color: var(--danger); font-size: 0.8rem; display: block; margin-top: 0.25rem;">
            {{ errors.categoryId }}
          </span>
        </div>
        
        <div class="form-group">
          <label class="form-label">Chế độ hiển thị</label>
          <select v-model="isPublic" class="form-control">
            <option value="true">Công khai (Public)</option>
            <option value="false">Ẩn (Private)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Chọn hình ảnh <span style="color: var(--danger)">*</span></label>
          
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none;"
            @change="handleFileChange"
          />
          
          <div
            class="image-upload-area"
            @click="triggerFileInput"
            style="
              border: 2px dashed var(--border-color);
              border-radius: var(--radius-md);
              padding: 2rem;
              text-align: center;
              cursor: pointer;
              background: rgba(9, 13, 22, 0.4);
              transition: var(--transition-smooth);
            "
            onmouseover="this.style.borderColor='var(--accent)'"
            onmouseout="this.style.borderColor='var(--border-color)'"
          >
            <div v-if="imagePreview" class="preview-container" style="position: relative; aspect-ratio: 16/10; width: 100%; max-height: 200px; border-radius: var(--radius-sm); overflow: hidden;">
              <img :src="imagePreview" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                <span style="color: #fff; font-weight: 600; font-size: 0.9rem;">Thay đổi ảnh</span>
              </div>
            </div>
            
            <div v-else style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: var(--text-muted)">
              <Upload :size="32" />
              <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main)">Kéo thả hoặc nhấp để chọn file ảnh</span>
              <span style="font-size: 0.75rem;">Hỗ trợ định dạng JPG, JPEG, PNG, WEBP tối đa 5MB</span>
            </div>
          </div>
          
          <span v-if="errors.imageFile" style="color: var(--danger); font-size: 0.8rem; display: block; margin-top: 0.25rem;">
            {{ errors.imageFile }}
          </span>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">Hủy</button>
        <button class="btn btn-primary" @click="handleSubmit">Upload ảnh</button>
      </div>
    </div>
  </div>
</template>
