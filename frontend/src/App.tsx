import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { DemoPage } from './pages/DemoPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PlaygroundPage } from './playground/PlaygroundPage';

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
        </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
