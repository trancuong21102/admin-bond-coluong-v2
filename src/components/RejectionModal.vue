<script setup>
import { ref } from 'vue';
import { X } from '@lucide/vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Từ chối yêu cầu'
  }
});

const emit = defineEmits(['close', 'submit']);

const reason = ref('');
const error = ref('');

const handleSubmit = () => {
  if (!reason.value.trim()) {
    error.value = 'Vui lòng nhập lý do từ chối';
    return;
  }
  error.value = '';
  emit('submit', reason.value);
  reason.value = '';
};

const handleClose = () => {
  reason.value = '';
  error.value = '';
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="handleClose">
          <X :size="20" />
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Lý do từ chối <span style="color: var(--danger)">*</span></label>
          <textarea
            v-model="reason"
            class="form-control"
            placeholder="Ví dụ: Ảnh không rõ nét hoặc không đúng chủ đề danh mục..."
            rows="4"
          ></textarea>
          <span v-if="error" style="color: var(--danger); font-size: 0.8rem; display: block; margin-top: 0.5rem;">
            {{ error }}
          </span>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">Hủy</button>
        <button class="btn btn-danger" @click="handleSubmit">Xác nhận từ chối</button>
      </div>
    </div>
  </div>
</template>
