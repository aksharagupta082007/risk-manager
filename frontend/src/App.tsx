import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CommandCenter } from './pages/CommandCenter';
import { HighRiskQueue } from './pages/HighRiskQueue';
import { PolicyStudio } from './pages/PolicyStudio';
import { DuplicateIntent } from './pages/DuplicateIntent';
import { Reports } from './pages/Reports';
import { OverrideLog } from './pages/OverrideLog';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/queue" element={<HighRiskQueue />} />
          <Route path="/policy" element={<PolicyStudio />} />
          <Route path="/duplicates" element={<DuplicateIntent />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/overrides" element={<OverrideLog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
