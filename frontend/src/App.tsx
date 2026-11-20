import { Navigate, Route, Routes } from 'react-router';
import { LearningPathDemo } from './demo/LearningPathDemo';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="demo" element={<LearningPathDemo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
