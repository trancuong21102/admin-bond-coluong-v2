<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Users as UsersIcon, 
  Folder as FolderIcon, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle,
  TrendingUp,
  ArrowRight
} from '@lucide/vue';
import api from '../utils/api';
import { useToast } from '../composables/useToast';

const router = useRouter();
const toast = useToast();

const isLoading = ref(true);
const stats = ref({
  totalUsers: 0,
  totalCategories: 0,
  pendingCategories: 0,
  totalImages: 0,
  pendingImages: 0
});

const pendingCategoriesList = ref([]);
const pendingImagesList = ref([]);

const fetchDashboardData = async () => {
  isLoading.value = true;
  try {
    // 1. Fetch Users
    const usersRes = await api.get('/api/admin/users');
    const usersList = usersRes.data.data || usersRes.data || [];
    stats.value.totalUsers = usersList.length || 0;

    // 2. Fetch Categories
    const categoriesRes = await api.get('/api/admin/categories');
    const categories = categoriesRes.data.data || categoriesRes.data || [];
    stats.value.totalCategories = categories.length;
    stats.value.pendingCategories = categories.filter(c => c.status === 'PENDING').length;
    pendingCategoriesList.value = categories.filter(c => c.status === 'PENDING').slice(0, 5);

    // 3. Fetch Pending Images
    const pendingImagesRes = await api.get('/api/admin/images?status=PENDING&limit=100');
    const pendingImagesData = pendingImagesRes.data.data || pendingImagesRes.data || {};
    const pendingImages = pendingImagesData.images || [];
    stats.value.pendingImages = pendingImages.length;
    pendingImagesList.value = pendingImages.slice(0, 5);

    // 4. Fetch All Approved Images to estimate total
    const approvedImagesRes = await api.get('/api/admin/images?status=APPROVED&limit=1');
    const approvedImagesData = approvedImagesRes.data.data || approvedImagesRes.data || {};
    const totalApproved = approvedImagesData.pagination?.totalItems || 0;
    stats.value.totalImages = totalApproved + stats.value.pendingImages;

  } catch (error) {
    console.error(error);
    toast.error('Không thể tải dữ liệu thống kê từ server');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div>
    <h1 class="page-title">Hệ thống tổng quan</h1>
    <p class="page-subtitle">Thống kê nhanh các chỉ số và yêu cầu cần phê duyệt.</p>

    <!-- Loading State -->
    <div v-if="isLoading" style="display: flex; align-items: center; justify-content: center; min-height: 250px;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <span class="animate-spin" style="width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--accent); border-radius: 50%;"></span>
        <span style="color: var(--text-muted); font-size: 0.9rem;">Đang tải dữ liệu tổng quan...</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div v-else>
      <div class="stats-grid">
        <!-- Users Card -->
        <div class="card stat-card" @click="router.push('/admin/users')" style="cursor: pointer;">
          <div class="stat-icon">
            <UsersIcon :size="24" />
          </div>
          <div class="stat-info">
            <h4>Thành viên</h4>
            <div class="stat-value">{{ stats.totalUsers }}</div>
          </div>
        </div>

        <!-- Categories Card -->
        <div class="card stat-card" @click="router.push('/admin/categories')" style="cursor: pointer;">
          <div class="stat-icon">
            <FolderIcon :size="24" />
          </div>
          <div class="stat-info">
            <h4>Danh mục</h4>
            <div class="stat-value">{{ stats.totalCategories }}</div>
          </div>
        </div>

        <!-- Pending Categories Card -->
        <div class="card stat-card" @click="router.push('/admin/categories?status=PENDING')" style="cursor: pointer;">
          <div class="stat-icon pending">
            <Clock :size="24" />
          </div>
          <div class="stat-info">
            <h4>Category chờ duyệt</h4>
            <div class="stat-value">{{ stats.pendingCategories }}</div>
          </div>
        </div>

        <!-- Images Card -->
        <div class="card stat-card" @click="router.push('/admin/images')" style="cursor: pointer;">
          <div class="stat-icon success">
            <ImageIcon :size="24" />
          </div>
          <div class="stat-info">
            <h4>Hình ảnh hệ thống</h4>
            <div class="stat-value">{{ stats.totalImages }}</div>
          </div>
        </div>

        <!-- Pending Images Card -->
        <div class="card stat-card" @click="router.push('/admin/images?status=PENDING')" style="cursor: pointer;">
          <div class="stat-icon pending">
            <Clock :size="24" />
          </div>
          <div class="stat-info">
            <h4>Ảnh chờ phê duyệt</h4>
            <div class="stat-value">{{ stats.pendingImages }}</div>
          </div>
        </div>
      </div>

      <!-- Action items splits -->
      <div class="dashboard-queues">
        <!-- Pending Categories Queue -->
        <div class="card">
          <div class="queue-card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <FolderIcon style="color: var(--warning)" :size="20" />
              <h3 style="font-size: 1.15rem; color: #fff;">Danh mục chờ duyệt mới nhất</h3>
            </div>
            <router-link to="/admin/categories" style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; color: var(--accent-light); font-weight: 600;">
              <span>Tất cả</span>
              <ArrowRight :size="14" />
            </router-link>
          </div>

          <div v-if="pendingCategoriesList.length === 0" style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
            Không có danh mục nào cần duyệt.
          </div>
          
          <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div 
              v-for="cat in pendingCategoriesList" 
              :key="cat.id"
              class="queue-item"
            >
              <div class="queue-item-main">
                <img :src="cat.coverImage" class="table-thumb" style="width: 44px; height: 44px; border-radius: var(--radius-sm);" />
                <div>
                  <span style="font-weight: 600; font-size: 0.95rem; color: #fff; display: block;">{{ cat.name }}</span>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">Tạo bởi User #{{ cat.userId || 'Ẩn danh' }}</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" @click="router.push('/admin/categories')">Xem chi tiết</button>
            </div>
          </div>
        </div>

        <!-- Pending Images Queue -->
        <div class="card">
          <div class="queue-card-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <ImageIcon style="color: var(--warning)" :size="20" />
              <h3 style="font-size: 1.15rem; color: #fff;">Ảnh chờ phê duyệt mới nhất</h3>
            </div>
            <router-link to="/admin/images" style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; color: var(--accent-light); font-weight: 600;">
              <span>Tất cả</span>
              <ArrowRight :size="14" />
            </router-link>
          </div>

          <div v-if="pendingImagesList.length === 0" style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
            Không có hình ảnh nào cần phê duyệt.
          </div>
          
          <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div 
              v-for="img in pendingImagesList" 
              :key="img.id"
              class="queue-item"
            >
              <div class="queue-item-main">
                <img :src="img.url" class="table-thumb" style="width: 44px; height: 44px; border-radius: var(--radius-sm);" />
                <div>
                  <span style="font-weight: 600; font-size: 0.95rem; color: #fff; display: block;">{{ img.title }}</span>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">Bởi: {{ img.user?.name || 'User #' + img.userId }}</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" @click="router.push('/admin/images')">Xem chi tiết</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
