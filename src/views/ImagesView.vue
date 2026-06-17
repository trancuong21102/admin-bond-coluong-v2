<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Upload, 
  Search, 
  Check, 
  X as XIcon, 
  Trash2, 
  Eye, 
  EyeOff, 
  Filter,
  Image as ImageIcon,
  Clock,
  User,
  Calendar,
  AlertCircle
} from '@lucide/vue';
import api from '../utils/api';
import { useToast } from '../composables/useToast';
import ImageModal from '../components/ImageModal.vue';
import RejectionModal from '../components/RejectionModal.vue';

const toast = useToast();
const route = useRoute();

const images = ref([]);
const categories = ref([]);
const isLoading = ref(true);
const totalImages = ref(0);

// Filters
const statusFilter = ref('PENDING'); // PENDING, APPROVED, REJECTED (Admin view defaults to PENDING)
const searchQuery = ref('');
const categoryFilter = ref('');
const currentPage = ref(1);
const limitPerPage = ref(12);

// Modals
const isUploadModalOpen = ref(false);
const isRejectionModalOpen = ref(false);
const imageIdToReject = ref(null);

// Loading trackers
const processingId = ref(null);

const fetchCategories = async () => {
  try {
    const response = await api.get('/api/admin/categories');
    categories.value = response.data.data || response.data || [];
  } catch (error) {
    console.error(error);
  }
};

const fetchImages = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: limitPerPage.value
    };

    if (statusFilter.value && statusFilter.value !== 'ALL') {
      params.status = statusFilter.value;
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }
    if (categoryFilter.value) {
      params.categoryId = categoryFilter.value;
    }

    const response = await api.get('/api/admin/images', { params });
    const imgData = response.data.data || response.data;
    images.value = imgData?.images || [];
    totalImages.value = imgData?.pagination?.totalItems || 0;
  } catch (error) {
    console.error(error);
    toast.error('Không thể tải danh sách hình ảnh');
  } finally {
    isLoading.value = false;
  }
};

// Refetch images when filters or page changes
watch([statusFilter, categoryFilter, currentPage], () => {
  fetchImages();
});

// For search input, let's watch with debounce or search on button click. 
// A simple watch on searchQuery is fine, let's reset page to 1.
watch(searchQuery, () => {
  currentPage.value = 1;
  fetchImages();
});

onMounted(() => {
  if (route.query.status) {
    statusFilter.value = route.query.status.toUpperCase();
  }
  fetchCategories();
  fetchImages();
});

// API interactions
const handleApprove = async (id) => {
  processingId.value = `${id}-approve`;
  try {
    const response = await api.patch(`/api/admin/images/${id}/approve`);
    // Remove from PENDING list or update status locally
    if (statusFilter.value === 'PENDING') {
      images.value = images.value.filter(img => img.id !== id);
      totalImages.value = Math.max(0, totalImages.value - 1);
    } else {
      const idx = images.value.findIndex(img => img.id === id);
      if (idx !== -1) {
        images.value[idx].status = 'APPROVED';
        images.value[idx].rejectReason = null;
      }
    }
    toast.success(response.data?.message || 'Phê duyệt hình ảnh thành công');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Không thể phê duyệt hình ảnh');
  } finally {
    processingId.value = null;
  }
};

const openRejectionModal = (id) => {
  imageIdToReject.value = id;
  isRejectionModalOpen.value = true;
};

const handleReject = async (reason) => {
  const id = imageIdToReject.value;
  isRejectionModalOpen.value = false;
  processingId.value = `${id}-reject`;
  try {
    const response = await api.patch(`/api/admin/images/${id}/reject`, {
      rejectReason: reason
    });
    
    if (statusFilter.value === 'PENDING') {
      images.value = images.value.filter(img => img.id !== id);
      totalImages.value = Math.max(0, totalImages.value - 1);
    } else {
      const idx = images.value.findIndex(img => img.id === id);
      if (idx !== -1) {
        images.value[idx].status = 'REJECTED';
        images.value[idx].rejectReason = reason;
      }
    }
    toast.success(response.data?.message || 'Đã từ chối duyệt ảnh');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Không thể thực hiện từ chối duyệt');
  } finally {
    processingId.value = null;
    imageIdToReject.value = null;
  }
};

const handleTogglePublic = async (img) => {
  const id = img.id;
  processingId.value = `${id}-public`;
  try {
    const response = await api.patch(`/api/admin/images/${id}/toggle-public`);
    img.isPublic = !img.isPublic;
    toast.success(response.data?.message || 'Đã thay đổi trạng thái công khai');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Không thể thay đổi trạng thái công khai');
  } finally {
    processingId.value = null;
  }
};

const handleDelete = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn hình ảnh này?')) {
    return;
  }
  processingId.value = `${id}-delete`;
  try {
    const response = await api.delete(`/api/admin/images/${id}`);
    images.value = images.value.filter(img => img.id !== id);
    totalImages.value = Math.max(0, totalImages.value - 1);
    toast.success(response.data?.message || 'Xóa ảnh thành công');
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Không thể xóa hình ảnh');
  } finally {
    processingId.value = null;
  }
};

const handleUploadSubmit = async (formData) => {
  isUploadModalOpen.value = false;
  isLoading.value = true;
  try {
    const response = await api.post('/api/admin/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    toast.success(response.data?.message || 'Upload ảnh thành công (Đã tự động duyệt)');
    // Reset filters to show approved/all and fetch
    statusFilter.value = 'APPROVED';
    categoryFilter.value = '';
    searchQuery.value = '';
    currentPage.value = 1;
    await fetchImages();
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || 'Upload ảnh thất bại. Vui lòng kiểm tra lại');
    isLoading.value = false;
  }
};

const getCategoryName = (catId) => {
  const cat = categories.value.find(c => c.id === catId);
  return cat ? cat.name : 'Danh mục #' + catId;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const totalPages = computed(() => {
  return Math.ceil(totalImages.value / limitPerPage.value) || 1;
});
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
      <div>
        <h1 class="page-title">Quản lý Hình ảnh</h1>
        <p class="page-subtitle">Xem xét, kiểm duyệt ảnh từ người dùng hoặc đăng ảnh trực tiếp.</p>
      </div>
      
      <button class="btn btn-primary" @click="isUploadModalOpen = true">
        <Upload :size="18" /> Đăng ảnh mới
      </button>
    </div>

    <!-- Filter control bar -->
    <div class="filter-bar">
      <!-- Status Tabs -->
      <div style="display: flex; gap: 0.5rem;">
        <button 
          v-for="status in ['ALL', 'PENDING', 'APPROVED', 'REJECTED']"
          :key="status"
          class="btn btn-sm"
          :class="statusFilter === status ? 'btn-primary' : 'btn-secondary'"
          @click="statusFilter = status; currentPage = 1;"
        >
          {{ 
            status === 'ALL' ? 'Tất cả' :
            status === 'PENDING' ? 'Chờ duyệt' :
            status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'
          }}
        </button>
      </div>
      
      <!-- Search & Category Filters -->
      <div class="filter-inputs">
        <select v-model="categoryFilter" class="form-control" style="width: 180px; padding: 0.55rem;">
          <option value="">Tất cả danh mục</option>
          <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">
            {{ cat.name }}
          </option>
        </select>
        
        <div class="search-input-wrapper">
          <Search class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Tìm theo tiêu đề, mô tả..."
            style="width: 250px; padding: 0.55rem 1rem 0.55rem 2.5rem;"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" style="display: flex; align-items: center; justify-content: center; min-height: 300px;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <span class="animate-spin" style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--accent); border-radius: 50%;"></span>
        <span style="color: var(--text-muted); font-size: 0.9rem;">Đang tải hình ảnh...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="images.length === 0" class="card" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
      <ImageIcon :size="48" style="margin-bottom: 1rem; color: var(--text-muted);" />
      <h3>Không tìm thấy hình ảnh nào</h3>
      <p style="font-size: 0.9rem; margin-top: 0.5rem;">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
    </div>

    <!-- Images Grid List -->
    <div v-else>
      <div class="image-grid">
        <div v-for="img in images" :key="img.id" class="card image-card">
          <!-- Thumbnail Image Preview -->
          <div class="image-card-preview">
            <img :src="img.url || img.imageUrl" alt="Preview" />
            <div class="image-card-badges">
              <span class="badge" style="background-color: var(--bg-base); border-color: var(--border-color); color: #fff;">
                #{{ img.id }}
              </span>
              <span 
                class="badge"
                :class="
                  img.status === 'APPROVED' ? 'badge-approved' :
                  img.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'
                "
              >
                {{ 
                  img.status === 'APPROVED' ? 'Đã duyệt' :
                  img.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'
                }}
              </span>
            </div>
          </div>
          
          <!-- Image Details -->
          <div class="image-card-info">
            <h3 class="image-card-title" :title="img.title">{{ img.title }}</h3>
            
            <div class="image-card-meta">
              <span style="display: flex; align-items: center; gap: 4px;">
                <Filter :size="12" /> {{ getCategoryName(img.categoryId) }}
              </span>
              <span style="display: flex; align-items: center; gap: 4px;">
                <User :size="12" /> Bởi: {{ img.user?.name || img.uploadedBy?.name || 'User #' + img.uploadedById }}
              </span>
              <span style="display: flex; align-items: center; gap: 4px;">
                <Calendar :size="12" /> Đăng: {{ formatDate(img.createdAt) }}
              </span>
            </div>
            
            <p class="image-card-desc" :title="img.description">
              {{ img.description || 'Không có mô tả chi tiết.' }}
            </p>
            
            <div v-if="img.status === 'REJECTED' && img.rejectReason" style="margin-bottom: 0.75rem; padding: 0.5rem; background-color: var(--danger-glow); border: 1px dashed rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--danger);">
              <strong>Lý do từ chối:</strong> {{ img.rejectReason }}
            </div>
            
            <!-- Actions Block -->
            <div class="image-card-actions">
              <!-- Public status switch -->
              <div style="display: flex; align-items: center; gap: 0.25rem; margin-right: auto;">
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="img.isPublic"
                    @change="handleTogglePublic(img)"
                    :disabled="processingId === `${img.id}-public`"
                  />
                  <span class="slider"></span>
                </label>
                <span style="font-size: 0.75rem; color: var(--text-muted);">
                  {{ img.isPublic ? 'Public' : 'Ẩn' }}
                </span>
              </div>
              
              <!-- Checkmark approve / cancel actions for PENDING images -->
              <template v-if="img.status === 'PENDING'">
                <button 
                  class="btn btn-success btn-sm"
                  @click="handleApprove(img.id)"
                  :disabled="processingId !== null"
                  title="Phê duyệt"
                >
                  <Check :size="14" /> Duyệt
                </button>
                <button 
                  class="btn btn-danger btn-sm"
                  @click="openRejectionModal(img.id)"
                  :disabled="processingId !== null"
                  title="Từ chối"
                >
                  <XIcon :size="14" />
                </button>
              </template>
              
              <!-- Delete action -->
              <button 
                v-if="img.status !== 'PENDING'"
                class="btn btn-danger btn-sm"
                style="background-color: transparent; border-color: rgba(239, 68, 68, 0.25); color: var(--danger);"
                onmouseover="this.style.backgroundColor='var(--danger)'; this.style.color='#fff'"
                onmouseout="this.style.backgroundColor='transparent'; this.style.color='var(--danger)'"
                @click="handleDelete(img.id)"
                :disabled="processingId !== null"
                title="Xóa"
              >
                <Trash2 :size="14" /> Xóa
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination controls -->
      <div v-if="totalPages > 1" class="pagination">
        <div class="pagination-info">
          Hiển thị trang <strong style="color: #fff;">{{ currentPage }}</strong> / {{ totalPages }} (Tổng {{ totalImages }} ảnh)
        </div>
        <div class="pagination-buttons">
          <button 
            class="btn btn-secondary btn-sm" 
            :disabled="currentPage === 1"
            @click="currentPage = Math.max(1, currentPage - 1)"
          >
            Trang trước
          </button>
          <button 
            class="btn btn-secondary btn-sm" 
            :disabled="currentPage === totalPages"
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ImageModal
      :is-open="isUploadModalOpen"
      :categories="categories"
      @close="isUploadModalOpen = false"
      @submit="handleUploadSubmit"
    />

    <RejectionModal
      :is-open="isRejectionModalOpen"
      title="Từ chối duyệt ảnh"
      @close="isRejectionModalOpen = false"
      @submit="handleReject"
    />
  </div>
</template>
