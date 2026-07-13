import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NyxoraHero } from './pages/NyxoraHero';
import { SteamAnalysisHome } from './pages/SteamAnalysisHome';
import { GameDetail } from './pages/GameDetail';
import { EnterpriseHub } from './pages/EnterpriseHub';
import { GestureLayout } from './components/GestureLayout';

function App() {
  return (
    <Router>
      <GestureLayout>
        <Routes>
          {/* Main Landing: Nyxora Spotlight Hero Page */}
          <Route path="/" element={<NyxoraHero />} />
          <Route path="/nyxora" element={<NyxoraHero />} />
          
          {/* Steam Sentiment Analysis Platform */}
          <Route path="/sentiment" element={<SteamAnalysisHome />} />
          
          {/* Programmatic Game Detail Page */}
          <Route path="/game/analysis/:slug" element={<GameDetail />} />
          
          {/* B2B SaaS Portal */}
          <Route path="/enterprise" element={<EnterpriseHub />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GestureLayout>
    </Router>
  );
}

export default App;
