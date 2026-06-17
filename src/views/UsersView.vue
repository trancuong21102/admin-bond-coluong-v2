<script setup>
import { ref, onMounted, computed } from 'vue';
import { Search, Shield, User as UserIcon, Calendar, Check, AlertCircle } from '@lucide/vue';
import api from '../utils/api';
import { useToast } from '../composables/useToast';

const toast = useToast();
const users = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const togglingId = ref(null); // Tracks which user's switch is currently updating

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const response = await api.get('/api/admin/users');
    users.value = response.data.data || response.data || [];
  } catch (error) {
    console.error(error);
    toast.error('Không thể tải danh sách người dùng');
  } finally {
    isLoading.value = false;
  }
};

const toggleTrusted = async (user) => {
  togglingId.value = `${user.id}-trusted`;
  try {
    const response = await api.patch(`/api/admin/users/${user.id}/toggle-trusted`);
    user.isTrusted = !user.isTrusted;
    toast.success(response.data?.message || 'Cập nhật quyền đăng ảnh thành công');
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.message || 'Không thể cập nhật quyền đăng ảnh';
    toast.error(msg);
  } finally {
    togglingId.value = null;
  }
};

const toggleCategoryTrusted = async (user) => {
  togglingId.value = `${user.id}-category`;
  try {
    const response = await api.patch(`/api/admin/users/${user.id}/toggle-category-trusted`);
    user.isCategoryTrusted = !user.isCategoryTrusted;
    toast.success(response.data?.message || 'Cập nhật quyền tạo danh mục thành công');
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.message || 'Không thể cập nhật quyền tạo danh mục';
    toast.error(msg);
  } finally {
    togglingId.value = null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Chưa rõ';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return users.value;
  return users.value.filter(user => 
    user.name?.toLowerCase().includes(query) || 
    user.email?.toLowerCase().includes(query) ||
    String(user.id).includes(query)
  );
});

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
      <div>
        <h1 class="page-title">Quản lý Thành viên</h1>
        <p class="page-subtitle">Xem danh sách người dùng và cấu hình quyền đăng tải tin cậy.</p>
      </div>
    </div>

    <!-- Filter/Search Bar -->
    <div class="filter-bar">
      <div class="filter-inputs">
        <div class="search-input-wrapper">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Tìm theo tên, email hoặc ID..."
            style="width: 320px;"
          />
        </div>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">
        Tổng số: <strong style="color: #fff;">{{ filteredUsers.length }}</strong> người dùng
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" style="display: flex; align-items: center; justify-content: center; min-height: 300px;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <span class="animate-spin" style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--accent); border-radius: 50%;"></span>
        <span style="color: var(--text-muted); font-size: 0.9rem;">Đang tải danh sách người dùng...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredUsers.length === 0" class="card" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
      <AlertCircle :size="48" style="margin-bottom: 1rem; color: var(--text-muted);" />
      <h3>Không tìm thấy thành viên nào</h3>
      <p style="font-size: 0.9rem; margin-top: 0.5rem;">Hãy thử từ khóa tìm kiếm khác hoặc kiểm tra lại.</p>
    </div>

    <!-- Table content -->
    <div v-else class="card" style="padding: 0; overflow: hidden;">
      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width: 80px;">ID</th>
              <th>Thành viên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trusted Upload</th>
              <th>Trusted Category</th>
              <th>Ngày tham gia</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <span style="font-family: monospace; font-weight: 600; color: var(--text-muted);">#{{ user.id }}</span>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <img 
                    :src="user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'" 
                    class="user-avatar-thumb" 
                  />
                  <span style="font-weight: 600; color: #fff;">{{ user.name }}</span>
                </div>
              </td>
              <td>
                <span style="color: var(--text-muted);">{{ user.email }}</span>
              </td>
              <td>
                <span 
                  v-if="user.role === 'ADMIN'" 
                  class="badge" 
                  style="background-color: var(--accent-glow); color: var(--accent-light); border: 1px solid rgba(99,102,241,0.25); display: inline-flex; align-items: center; gap: 4px;"
                >
                  <Shield :size="12" /> Admin
                </span>
                <span v-else class="badge" style="background-color: rgba(255,255,255,0.03); color: var(--text-muted); border: 1px solid var(--border-color);">
                  User
                </span>
              </td>
              <td>
                <!-- Toggle for Image Trusted Upload rights -->
                <div v-if="user.role !== 'ADMIN'" style="display: flex; align-items: center; gap: 0.5rem;">
                  <label class="switch">
                    <input
                      type="checkbox"
                      :checked="user.isTrusted"
                      @change="toggleTrusted(user)"
                      :disabled="togglingId === `${user.id}-trusted`"
                    />
                    <span class="slider"></span>
                  </label>
                  <span style="font-size: 0.8rem;" :style="{ color: user.isTrusted ? 'var(--success)' : 'var(--text-muted)' }">
                    {{ user.isTrusted ? 'Tin cậy' : 'Cần duyệt' }}
                  </span>
                </div>
                <span v-else style="font-size: 0.8rem; color: var(--success); font-weight: 600;">Miễn duyệt</span>
              </td>
              <td>
                <!-- Toggle for Category Trusted rights -->
                <div v-if="user.role !== 'ADMIN'" style="display: flex; align-items: center; gap: 0.5rem;">
                  <label class="switch">
                    <input
                      type="checkbox"
                      :checked="user.isCategoryTrusted"
                      @change="toggleCategoryTrusted(user)"
                      :disabled="togglingId === `${user.id}-category`"
                    />
                    <span class="slider"></span>
                  </label>
                  <span style="font-size: 0.8rem;" :style="{ color: user.isCategoryTrusted ? 'var(--success)' : 'var(--text-muted)' }">
                    {{ user.isCategoryTrusted ? 'Tin cậy' : 'Cần duyệt' }}
                  </span>
                </div>
                <span v-else style="font-size: 0.8rem; color: var(--success); font-weight: 600;">Miễn duyệt</span>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.85rem;">
                  <Calendar :size="14" />
                  <span>{{ formatDate(user.createdAt) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
