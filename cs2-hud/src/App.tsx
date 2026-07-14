import { MotionConfig } from 'framer-motion';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { HUDProvider } from './contexts/HUDContext';
import { HUDPage } from './pages/HUD';

// Importing the tracker wires its GSI listeners up before the first frame.
import './services/statsTracker';

function MotionRoot() {
  const config = useConfig();
  return (
    <MotionConfig reducedMotion={config.theme.reduced_motion ? 'always' : 'never'}>
      <HUDPage />
    </MotionConfig>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <HUDProvider>
        <MotionRoot />
      </HUDProvider>
    </ConfigProvider>
  );
}
