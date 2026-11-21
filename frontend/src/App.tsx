import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { DemoPage } from './pages/DemoPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PlaygroundPage } from './playground/PlaygroundPage';
import { SandboxPage } from './sandbox/SandboxPage';
import { ScenarioPage } from './scenarios/ScenarioPage';
import { ScenariosPage } from './scenarios/ScenariosPage';
import { AuthenticatedJourneyLayout } from './journey/AuthenticatedJourneyLayout';
import { RoadmapPage } from './roadmap/RoadmapPage';
import { RoadmapSetupPage } from './roadmap/RoadmapSetupPage';
import { ToolsPage } from './tools/ToolsPage';
import { ToolPageShell } from './tools/ToolPageShell';
import { GoalPlannerPage } from './tools/GoalPlannerPage';
import { EmergencyBufferPage } from './tools/EmergencyBufferPage';

export function App() {
  return (
    <Routes>
      <Route element={<AuthenticatedJourneyLayout />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<><HomePage /><LoginPage /></>} />
          <Route element={<RequireAuth />}>
            <Route path="learning" element={<DemoPage />} />
            <Route path="demo" element={<Navigate to="/learning" replace />} />
            <Route path="scenarios" element={<ScenariosPage />} />
            <Route path="scenarios/:scenarioId" element={<ScenarioPage />} />
            <Route path="scenarios/:scenarioId/play" element={<SandboxPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="roadmap/setup" element={<RoadmapSetupPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/goal-planner" element={<GoalPlannerPage />} />
            <Route path="tools/emergency-buffer" element={<EmergencyBufferPage />} />
            <Route path="tools/fee-impact" element={<ToolPageShell tool="fee-impact" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
