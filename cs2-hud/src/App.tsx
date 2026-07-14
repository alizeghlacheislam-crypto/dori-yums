import { ConfigProvider } from '@/contexts/ConfigContext';
import { GSIProvider } from '@/contexts/GSIContext';
import { HUDPage } from '@/pages/HUDPage';

const App = () => (
  <ConfigProvider>
    <GSIProvider>
      <HUDPage />
    </GSIProvider>
  </ConfigProvider>
);

export default App;
