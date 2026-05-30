import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCredentials, clearCredentials, setLoading } from '../features/auth/authSlice';
import { setPermissions } from '../features/auth/permissionsSlice';
import { useGetMeQuery } from '../api/authApi';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Spinner } from '../components/common/Spinner';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const SalesPage = lazy(() => import('../pages/SalesPage'));
const StockPage = lazy(() => import('../pages/StockPage'));
const BranchesPage = lazy(() => import('../pages/BranchesPage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const RolesPage = lazy(() => import('../pages/RolesPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export default function AppRoutes() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useGetMeQuery();

  useEffect(() => {
    if (data?.data) {
      dispatch(setCredentials(data.data));
      dispatch(setPermissions(data.data.permissions));
    } else if (!isLoading) {
      dispatch(clearCredentials());
    }
  }, [data, isLoading, isError, dispatch]);

  useEffect(() => {
    dispatch(setLoading(isLoading));
  }, [isLoading, dispatch]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/products"
              element={<ProtectedRoute requiredPermission="viewProducts" />}
            >
              <Route index element={<ProductsPage />} />
            </Route>

            <Route
              path="/sales"
              element={<ProtectedRoute requiredPermission="viewSales" />}
            >
              <Route index element={<SalesPage />} />
            </Route>

            <Route
              path="/stock"
              element={<ProtectedRoute requiredPermission="viewStock" />}
            >
              <Route index element={<StockPage />} />
            </Route>

            <Route
              path="/branches"
              element={<ProtectedRoute requiredPermission="viewBranches" />}
            >
              <Route index element={<BranchesPage />} />
            </Route>

            <Route
              path="/users"
              element={<ProtectedRoute requiredPermission="viewUsers" />}
            >
              <Route index element={<UsersPage />} />
            </Route>

            <Route
              path="/roles"
              element={<ProtectedRoute requiredPermission="manageRoles" />}
            >
              <Route index element={<RolesPage />} />
            </Route>

            <Route
              path="/reports"
              element={<ProtectedRoute requiredPermission="viewReports" />}
            >
              <Route index element={<ReportsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
