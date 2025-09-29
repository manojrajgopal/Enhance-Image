import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Enhance from './components/Enhance';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Enhance />} />
      </Routes>
    </Router>
  );
}

export default App;
