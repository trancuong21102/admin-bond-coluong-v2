<script setup>
import { useToast } from '../composables/useToast';
import { CheckCircle, AlertCircle, X } from '@lucide/vue';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', toast.type === 'error' ? 'toast-error' : 'toast-success']"
    >
      <CheckCircle v-if="toast.type === 'success'" style="color: var(--success); flex-shrink: 0;" :size="20" />
      <AlertCircle v-else style="color: var(--danger); flex-shrink: 0;" :size="20" />
      
      <span style="flex-grow: 1;">{{ toast.message }}</span>
      
      <button class="modal-close" @click="removeToast(toast.id)" style="padding: 0; margin-left: 0.5rem;">
        <X :size="16" />
      </button>
    </div>
  </div>
</template>
