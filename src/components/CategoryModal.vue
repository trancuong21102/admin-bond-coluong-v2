<script setup>
import { ref, watch } from 'vue';
import { X, Upload } from '@lucide/vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  category: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'submit']);

const name = ref('');
const description = ref('');
const isPublic = ref('true');
const coverImage = ref(null);
const imagePreview = ref('');
const fileInput = ref(null);
const errors = ref({});

watch(() => props.category, (newVal) => {
  if (newVal) {
    name.value = newVal.name || '';
    description.value = newVal.description || '';
    isPublic.value = newVal.isPublic !== undefined ? String(newVal.isPublic) : 'true';
    coverImage.value = null;
    imagePreview.value = newVal.coverImage || '';
  } else {
    name.value = '';
    description.value = '';
    isPublic.value = 'true';
    coverImage.value = null;
    imagePreview.value = '';
  }
  errors.value = {};
}, { immediate: true });

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.value.coverImage = 'Kích thước ảnh không vượt quá 5MB';
      return;
    }
    errors.value.coverImage = null;
    coverImage.value = file;
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
  if (!name.value.trim()) {
    errs.name = 'Tên danh mục là bắt buộc';
  }
  if (!props.category && !coverImage.value) {
    errs.coverImage = 'Ảnh bìa là bắt buộc khi tạo mới';
  }
  errors.value = errs;
  return Object.keys(errs).length === 0;
};

const handleSubmit = () => {
  if (!validate()) return;

  const formData = new FormData();
  formData.append('name', name.value.trim());
  formData.append('description', description.value.trim());
  formData.append('isPublic', isPublic.value);
  if (coverImage.value) {
    formData.append('coverImage', coverImage.value);
  }

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
        <h3 class="modal-title">{{ category ? 'Cập nhật danh mục' : 'Thêm mới danh mục' }}</h3>
        <button class="modal-close" @click="handleClose">
          <X :size="20" />
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Tên danh mục <span style="color: var(--danger)">*</span></label>
          <input
            v-model="name"
            type="text"
            class="form-control"
            placeholder="Nhập tên danh mục (ví dụ: Thiên nhiên)"
          />
          <span v-if="errors.name" style="color: var(--danger); font-size: 0.8rem; display: block; margin-top: 0.25rem;">
            {{ errors.name }}
          </span>
        </div>
        
        <div class="form-group">
          <label class="form-label">Mô tả danh mục</label>
          <textarea
            v-model="description"
            class="form-control"
            placeholder="Mô tả ngắn gọn về danh mục..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Trạng thái công khai</label>
          <select v-model="isPublic" class="form-control">
            <option value="true">Công khai (Public)</option>
            <option value="false">Riêng tư / Ẩn (Private)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Ảnh bìa danh mục <span v-if="!category" style="color: var(--danger)">*</span></label>
          
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
            <div v-if="imagePreview" class="preview-container" style="position: relative; aspect-ratio: 16/9; width: 100%; max-height: 200px; border-radius: var(--radius-sm); overflow: hidden;">
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
          
          <span v-if="errors.coverImage" style="color: var(--danger); font-size: 0.8rem; display: block; margin-top: 0.25rem;">
            {{ errors.coverImage }}
          </span>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">Hủy</button>
        <button class="btn btn-primary" @click="handleSubmit">
          {{ category ? 'Lưu thay đổi' : 'Tạo mới' }}
        </button>
      </div>
    </div>
  </div>
</template>
