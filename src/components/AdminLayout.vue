<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  LayoutDashboard, 
  Users, 
  Folder, 
  Image as ImageIcon, 
  LogOut, 
  Menu, 
  X,
  ShieldAlert
} from '@lucide/vue';
import { useToast } from '../composables/useToast';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const isSidebarOpen = ref(false);
const adminUser = ref({ name: 'Administrator', email: 'admin@example.com' });

onMounted(() => {
  const userString = localStorage.getItem('admin_user');
  if (userString) {
    try {
      adminUser.value = JSON.parse(userString);
    } catch (e) {
      console.error(e);
    }
  }
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleLogout = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  toast.success('Đăng xuất thành công');
  router.push('/admin/login');
};

const isActive = (path) => {
  return route.path === path;
};
</script>

<template>
  <div class="admin-container">
    <!-- Sidebar Navigation -->
    <aside 
      class="sidebar"
      :class="{ open: isSidebarOpen }"
      style="
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        width: var(--sidebar-width);
        background-color: var(--bg-surface);
        border-right: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        z-index: 900;
        transition: var(--transition-smooth);
      "
    >
      <!-- Sidebar Brand / Logo -->
      <div 
        class="sidebar-logo" 
        style="
          height: var(--header-height);
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          border-bottom: 1px solid var(--border-color);
          gap: 0.75rem;
        "
      >
        <div 
          style="
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
          "
        >
          <ShieldAlert :size="20" />
        </div>
        <div>
          <h2 style="font-size: 1.15rem; color: #fff; font-family: var(--font-display); line-height: 1;">Pinterest Mini</h2>
          <span style="font-size: 0.75rem; color: var(--accent-light); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Admin Portal</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav style="padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1;">
        <router-link 
          to="/admin/dashboard" 
          :class="['nav-item', { active: isActive('/admin/dashboard') }]"
          @click="isSidebarOpen = false"
        >
          <LayoutDashboard :size="18" />
          <span>Tổng quan</span>
        </router-link>
        
        <router-link 
          to="/admin/users" 
          :class="['nav-item', { active: isActive('/admin/users') }]"
          @click="isSidebarOpen = false"
        >
          <Users :size="18" />
          <span>Quản lý User</span>
        </router-link>
        
        <router-link 
          to="/admin/categories" 
          :class="['nav-item', { active: isActive('/admin/categories') }]"
          @click="isSidebarOpen = false"
        >
          <Folder :size="18" />
          <span>Quản lý Category</span>
        </router-link>
        
        <router-link 
          to="/admin/images" 
          :class="['nav-item', { active: isActive('/admin/images') }]"
          @click="isSidebarOpen = false"
        >
          <ImageIcon :size="18" />
          <span>Quản lý Image</span>
        </router-link>
      </nav>

      <!-- Logout Button Section -->
      <div style="padding: 1rem; border-top: 1px solid var(--border-color)">
        <button 
          @click="handleLogout"
          class="nav-item logout-btn"
          style="width: 100%; border: none; background: none; cursor: pointer; text-align: left;"
        >
          <LogOut :size="18" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Overlay when sidebar open on mobile -->
    <div 
      v-if="isSidebarOpen" 
      class="sidebar-overlay"
      @click="toggleSidebar"
      style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(9, 13, 22, 0.6);
        z-index: 850;
      "
    ></div>

    <!-- Main Content Shell -->
    <div class="main-content">
      <!-- Header Bar -->
      <header 
        style="
          height: var(--header-height);
          background-color: var(--bg-surface);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 800;
        "
      >
        <!-- Mobile Toggle Button -->
        <button 
          @click="toggleSidebar"
          class="sidebar-toggle-btn"
          style="
            background: none;
            border: none;
            color: var(--text-main);
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
          "
        >
          <Menu v-if="!isSidebarOpen" :size="20" />
          <X v-else :size="20" />
        </button>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--text-muted); font-size: 0.9rem;">Hệ thống quản trị Pinterest Mini</span>
        </div>

        <!-- Admin Account Profile Widget -->
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="text-align: right; display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 0.9rem; color: #fff;">{{ adminUser.name }}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">{{ adminUser.email }}</span>
          </div>
          
          <img 
            :src="adminUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'" 
            class="user-avatar-thumb"
            style="width: 40px; height: 40px; border: 2px solid var(--accent);" 
          />
        </div>
      </header>

      <!-- View Wrapper -->
      <main class="page-body">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.95rem;
  transition: var(--transition-smooth);
}

.nav-item:hover {
  color: var(--text-main);
  background-color: var(--bg-surface-hover);
}

.nav-item.active {
  color: #fff;
  background-color: var(--bg-surface-active);
}

.logout-btn:hover {
  color: var(--danger);
  background-color: var(--danger-glow);
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 991px) {
  .sidebar-toggle-btn {
    display: flex !important;
  }
}
</style>
