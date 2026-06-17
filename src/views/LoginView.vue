<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ShieldAlert, KeyRound, Mail, Loader2 } from '@lucide/vue';
import api from '../utils/api';
import { useToast } from '../composables/useToast';

const router = useRouter();
const toast = useToast();

const email = ref('admin@example.com');
const password = ref('Admin@123');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!email.value.trim() || !password.value.trim()) {
    toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
    return;
  }

  isLoading.value = true;
  try {
    const response = await api.post('/api/auth/login', {
      email: email.value.trim(),
      password: password.value.trim()
    });

    const { token, user } = response.data.data || response.data;
    
    // Check role from user object
    if (user.role !== 'ADMIN') {
      toast.error('Tài khoản của bạn không có quyền truy cập trang quản trị');
      isLoading.value = false;
      return;
    }

    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));

    toast.success('Đăng nhập thành công! Chào mừng trở lại');
    router.push('/admin/dashboard');
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng kiểm tra lại thông tin';
    toast.error(msg);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="card login-card">
      <div class="login-logo">
        <div 
          style="
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            box-shadow: 0 8px 20px var(--accent-glow);
          "
        >
          <ShieldAlert :size="32" />
        </div>
      </div>
      
      <h1 class="login-title">Hệ Thống Admin</h1>
      <p class="login-subtitle">Pinterest Mini Management Dashboard</p>
      
      <form @submit.prevent="handleLogin" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label class="form-label">Email quản trị</label>
          <div class="search-input-wrapper">
            <Mail class="search-icon" />
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="nhap@example.com"
              required
              :disabled="isLoading"
            />
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label">Mật khẩu</label>
          <div class="search-input-wrapper">
            <KeyRound class="search-icon" />
            <input
              v-model="password"
              type="password"
              class="form-control"
              placeholder="••••••••"
              required
              :disabled="isLoading"
            />
          </div>
        </div>
        
        <button
          type="submit"
          class="btn btn-primary"
          style="width: 100%; padding: 0.85rem; font-size: 1rem;"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="animate-spin" :size="18" style="animation: spin 1s linear infinite;" />
          <span v-else>Đăng Nhập</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
