import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './router';
import './styles/telegram-theme.css';

function App() {
  return (
    <Router>
      <div className="App">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
