import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeadsListPage } from '@/pages/LeadsListPage';
import { LeadsKanbanPage } from '@/pages/LeadsKanbanPage';
import { InstanciasPage } from '@/pages/InstanciasPage';
import { UsuariosPage } from '@/pages/UsuariosPage';
import { AdminGlobalPage } from '@/pages/AdminGlobalPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

const INVALID_CONTA_VALUES = new Set(['', 'null', 'undefined']);

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem('gerencia_usuario');

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { superadmin?: boolean };
  } catch (error) {
    console.warn('Nao foi possivel interpretar os dados armazenados do usuario.', error);
    return null;
  }
};

const ProtectedLayout = () => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('gerencia_token') : null;
  const conta = typeof window !== 'undefined' ? localStorage.getItem('gerencia_conta') : null;
  const usuario = getStoredUser();
  const hasConta = conta !== null && !INVALID_CONTA_VALUES.has(conta);
  const isSuperAdmin = usuario?.superadmin === true;

  if (!token || (!hasConta && !isSuperAdmin)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/app/login" element={<Navigate to="/login" replace />} />
        <Route path="/app/signup" element={<Navigate to="/login" replace />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads/lista" element={<LeadsListPage />} />
          <Route path="/leads/kanban" element={<LeadsKanbanPage />} />
          <Route path="/instancias" element={<InstanciasPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/admin" element={<AdminGlobalPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
