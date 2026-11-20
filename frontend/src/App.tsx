import { CoachPanelPreview } from './demo/CoachPanelPreview';
import { LearningPathDemo } from './demo/LearningPathDemo';

export function App() {
  return (
    <>
      <LearningPathDemo />
      {/* Temporary: lets us try the AI coach until it is placed in the lesson screens */}
      <CoachPanelPreview />
    </>
  );
}

export default App;
