import { createRouter, createWebHistory } from 'vue-router';
import AdminLayout from '../components/AdminLayout.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import UsersView from '../views/UsersView.vue';
import CategoriesView from '../views/CategoriesView.vue';
import ImagesView from '../views/ImagesView.vue';

const routes = [
  {
    path: '/',
    redirect: '/admin'
  },
  {
    path: '/admin/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView
      },
      {
        path: 'users',
        name: 'Users',
        component: UsersView
      },
      {
        path: 'categories',
        name: 'Categories',
        component: CategoriesView
      },
      {
        path: 'images',
        name: 'Images',
        component: ImagesView
      }
    ]
  },
  // Catch-all route to redirect back to admin
  {
    path: '/:pathMatch(.*)*',
    redirect: '/admin'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Route guards for auth
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token');
  const userString = localStorage.getItem('admin_user');
  let isAdmin = false;

  if (userString) {
    try {
      const user = JSON.parse(userString);
      isAdmin = user.role === 'ADMIN';
    } catch (e) {
      isAdmin = false;
    }
  }

  // If page requires auth and token/admin is missing, go to login
  if (to.meta.requiresAuth && (!token || !isAdmin)) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    next({ name: 'Login' });
  } 
  // If page is guestOnly and token exists, go to dashboard
  else if (to.meta.guestOnly && token && isAdmin) {
    next({ name: 'Dashboard' });
  } 
  else {
    next();
  }
});

export default router;
