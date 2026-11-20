import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { DemoPage } from './pages/DemoPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="demo" element={<DemoPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
