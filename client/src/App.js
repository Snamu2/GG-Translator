import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dictionary from './components/Dictionary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dictionary" element={<Dictionary />} />
        {/* 다른 라우트들... 예:
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        */}
      </Routes>
    </Router>
  );
}

export default App;