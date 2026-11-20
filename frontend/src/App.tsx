import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './layouts/AppLayout';
import { DemoPage } from './pages/DemoPage';
import { HomePage } from './pages/HomePage';
import { PlaygroundPage } from './playground/PlaygroundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="playground" element={<PlaygroundPage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
