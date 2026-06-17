<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  FolderPlus, 
  Search, 
  Check, 
  X as XIcon, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Folder,
  Calendar,
  AlertCircle
} from '@lucide/vue';
import api from '../utils/api';
import { useToast } from '../composables/useToast';
import CategoryModal from '../components/CategoryModal.vue';
import RejectionModal from '../components/RejectionModal.vue';

const toast = useToast();
const route = useRoute();

const categories = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const statusFilter = ref('ALL'); // ALL, PENDING, APPROVED, REJECTED

// Modal controllers
const isCategoryModalOpen = ref(false);
const selectedCategoryForEdit = ref(null);

const isRejectionModalOpen = ref(false);
const categoryIdToReject = ref(null);

// Action trackers (disable actions while processing)
const processingId = ref(null);

const fetchCategories = async () => {
  isLoading.value = true;
  try {
    const response = await api.get('/api/admin/categories');
    categories.value = response.data.data || response.data || [];
  } catch (error) {
    console.error(error);
    toast.error('Không thể tải danh sách danh mục');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Sync status filter from route query if available
  if (route.query.status) {
    statusFilter.value = route.query.status.toUpperCase();
  }
  fetchCategories();
});

// Computed list based on search and status tabs
const filteredCategories = computed(() => {
  let list = categories.value;
  
  if (statusFilter.value !== 'ALL') {
    list = list.filter(cat => cat.status === statusFilter.value);
  }

  const query = searchQuery.value.toLowerCase().trim();
  if (query) {
    list = list.filter(cat => 
      cat.name?.toLowerCase().includes(query) || 
      cat.slug?.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    );
  }

  return list;
});

// API interactions
const handleApprove = async (id) => {
  processingId.value = `${id}-approve`;
  try {
    const response = await api.patch(`/api/admin/categories/${id}/approve`);
    // Update local state
    const index = categories.value.findIndex(cat => cat.id === id);
    if (index !== -1) {
      categories.value[index].status = 'APPROVED';
      categories.value[index].rejectReason = null;
    }
    toast.success(response.data?.message || 'Đã phê duyệt danh mục thành công');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt danh mục');
  } finally {
    processingId.value = null;
  }
};

const openRejectionModal = (id) => {
  categoryIdToReject.value = id;
  isRejectionModalOpen.value = true;
};

const handleReject = async (reason) => {
  const id = categoryIdToReject.value;
  isRejectionModalOpen.value = false;
  processingId.value = `${id}-reject`;
  try {
    const response = await api.patch(`/api/admin/categories/${id}/reject`, {
      rejectReason: reason
    });
    // Update local state
    const index = categories.value.findIndex(cat => cat.id === id);
    if (index !== -1) {
      categories.value[index].status = 'REJECTED';
      categories.value[index].rejectReason = reason;
    }
    toast.success(response.data?.message || 'Đã từ chối danh mục');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối danh mục');
  } finally {
    processingId.value = null;
    categoryIdToReject.value = null;
  }
};

const handleTogglePublic = async (cat) => {
  const id = cat.id;
  processingId.value = `${id}-public`;
  try {
    const response = await api.patch(`/api/admin/categories/${id}/toggle-public`);
    cat.isPublic = !cat.isPublic;
    toast.success(response.data?.message || 'Cập nhật trạng thái hiển thị thành công');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái hiển thị');
  } finally {
    processingId.value = null;
  }
};

const handleDelete = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa danh mục này? Các ảnh thuộc danh mục này cũng có thể bị ảnh hưởng.')) {
    return;
  }

  processingId.value = `${id}-delete`;
  try {
    const response = await api.delete(`/api/admin/categories/${id}`);
    categories.value = categories.value.filter(cat => cat.id !== id);
    toast.success(response.data?.message || 'Đã xóa danh mục thành công');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa danh mục');
  } finally {
    processingId.value = null;
  }
};

// Open create form
const openCreateModal = () => {
  selectedCategoryForEdit.value = null;
  isCategoryModalOpen.value = true;
};

// Open edit form
const openEditModal = (cat) => {
  selectedCategoryForEdit.value = cat;
  isCategoryModalOpen.value = true;
};

const handleCategorySubmit = async (formData) => {
  isCategoryModalOpen.value = false;
  const isEditing = !!selectedCategoryForEdit.value;
  const id = isEditing ? selectedCategoryForEdit.value.id : null;
  
  isLoading.value = true;
  try {
    if (isEditing) {
      const response = await api.put(`/api/admin/categories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data?.message || 'Đã cập nhật danh mục thành công');
    } else {
      const response = await api.post('/api/admin/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data?.message || 'Đã thêm danh mục mới thành công');
    }
    await fetchCategories();
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Lỗi khi lưu danh mục. Vui lòng kiểm tra lại');
    isLoading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Danh mục</h1>
        <p class="page-subtitle">Quản trị các danh mục hình ảnh (phê duyệt yêu cầu từ người dùng và tạo danh mục hệ thống).</p>
      </div>
      
      <button class="btn btn-primary" @click="openCreateModal">
        <FolderPlus :size="18" /> Thêm danh mục
      </button>
    </div>

    <!-- Filter/Tabs Bar -->
    <div class="filter-bar">
      <div class="status-tabs">
        <button 
          v-for="status in ['ALL', 'PENDING', 'APPROVED', 'REJECTED']"
          :key="status"
          class="btn btn-sm"
          :class="statusFilter === status ? 'btn-primary' : 'btn-secondary'"
          @click="statusFilter = status"
        >
          {{ 
            status === 'ALL' ? 'Tất cả' :
            status === 'PENDING' ? 'Chờ duyệt' :
            status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'
          }}
        </button>
      </div>
      
      <div class="filter-inputs">
        <div class="search-input-wrapper">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Tìm danh mục..."
            style="width: 250px;"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" style="display: flex; align-items: center; justify-content: center; min-height: 300px;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <span class="animate-spin" style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--accent); border-radius: 50%;"></span>
        <span style="color: var(--text-muted); font-size: 0.9rem;">Đang tải danh mục...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCategories.length === 0" class="card" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
      <Folder :size="48" style="margin-bottom: 1rem; color: var(--text-muted);" />
      <h3>Không tìm thấy danh mục nào</h3>
      <p style="font-size: 0.9rem; margin-top: 0.5rem;">Hãy thử đổi tab trạng thái hoặc từ khóa tìm kiếm.</p>
    </div>

    <!-- Categories Table -->
    <div v-else class="card" style="padding: 0; overflow: hidden;">
      <div class="table-wrapper">
        <table class="admin-table responsive-card-table">
          <thead>
            <tr>
              <th style="width: 70px;">ID</th>
              <th style="width: 100px;">Ảnh bìa</th>
              <th>Tên / Slug</th>
              <th>Mô tả</th>
              <th>Hiển thị</th>
              <th>Trạng thái</th>
              <th>Người tạo</th>
              <th>Ngày tạo</th>
              <th style="text-align: right; width: 220px;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in filteredCategories" :key="cat.id">
              <td data-label="ID">
                <span style="font-family: monospace; font-weight: 600; color: var(--text-muted);">#{{ cat.id }}</span>
              </td>
              <td data-label="Ảnh bìa">
                <img 
                  :src="cat.coverImage || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=150&h=100&q=80'" 
                  class="table-thumb" 
                />
              </td>
              <td data-label="Tên / Slug">
                <strong style="color: #fff; display: block; font-size: 0.95rem;">{{ cat.name }}</strong>
                <span style="font-family: monospace; font-size: 0.75rem; color: var(--accent-light);">{{ cat.slug }}</span>
              </td>
              <td data-label="Mô tả">
                <span 
                  v-if="cat.description" 
                  style="font-size: 0.85rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 200px;"
                  :title="cat.description"
                >
                  {{ cat.description }}
                </span>
                <span v-else style="color: var(--text-dark); font-style: italic; font-size: 0.8rem;">Không có</span>
              </td>
              <td data-label="Hiển thị">
                <!-- Toggle public switch -->
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <label class="switch">
                    <input
                      type="checkbox"
                      :checked="cat.isPublic"
                      @change="handleTogglePublic(cat)"
                      :disabled="processingId === `${cat.id}-public`"
                    />
                    <span class="slider"></span>
                  </label>
                  <span style="font-size: 0.75rem;">
                    <Eye v-if="cat.isPublic" :size="14" style="color: var(--success)" />
                    <EyeOff v-else :size="14" style="color: var(--text-muted)" />
                  </span>
                </div>
              </td>
              <td data-label="Trạng thái">
                <span v-if="cat.status === 'APPROVED'" class="badge badge-approved">Đã duyệt</span>
                <span v-else-if="cat.status === 'PENDING'" class="badge badge-pending">Chờ duyệt</span>
                <span v-else class="badge badge-rejected" :title="'Lý do: ' + cat.rejectReason">Từ chối</span>
                
                <span 
                  v-if="cat.status === 'REJECTED' && cat.rejectReason" 
                  style="display: block; font-size: 0.75rem; color: var(--danger); margin-top: 0.25rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                  :title="cat.rejectReason"
                >
                  Lý do: {{ cat.rejectReason }}
                </span>
              </td>
              <td data-label="Người tạo">
                <span style="font-size: 0.85rem;">
                  {{ cat.createdBy?.name || 'User #' + cat.createdById }}
                </span>
              </td>
              <td data-label="Ngày tạo">
                <span style="color: var(--text-muted); font-size: 0.85rem;">{{ formatDate(cat.createdAt) }}</span>
              </td>
              <td data-label="Hành động" class="responsive-actions" style="text-align: right;">
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                  <!-- Pending approval actions -->
                  <template v-if="cat.status === 'PENDING'">
                    <button
                      class="btn btn-success btn-sm"
                      @click="handleApprove(cat.id)"
                      :disabled="processingId !== null"
                      title="Phê duyệt"
                    >
                      <Check :size="14" />
                    </button>
                    <button
                      class="btn btn-danger btn-sm"
                      @click="openRejectionModal(cat.id)"
                      :disabled="processingId !== null"
                      title="Từ chối"
                    >
                      <XIcon :size="14" />
                    </button>
                  </template>
                  
                  <!-- Common edit and delete actions -->
                  <button
                    class="btn btn-secondary btn-sm"
                    @click="openEditModal(cat)"
                    :disabled="processingId !== null"
                    title="Chỉnh sửa"
                  >
                    <Edit3 :size="14" />
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    style="background-color: transparent; border-color: rgba(239, 68, 68, 0.2); color: var(--danger);"
                    onmouseover="this.style.backgroundColor='var(--danger)'; this.style.color='#fff'"
                    onmouseout="this.style.backgroundColor='transparent'; this.style.color='var(--danger)'"
                    @click="handleDelete(cat.id)"
                    :disabled="processingId !== null"
                    title="Xóa"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Subform Modals -->
    <CategoryModal
      :is-open="isCategoryModalOpen"
      :category="selectedCategoryForEdit"
      @close="isCategoryModalOpen = false"
      @submit="handleCategorySubmit"
    />
    
    <RejectionModal
      :is-open="isRejectionModalOpen"
      title="Từ chối duyệt danh mục"
      @close="isRejectionModalOpen = false"
      @submit="handleReject"
    />
  </div>
</template>
