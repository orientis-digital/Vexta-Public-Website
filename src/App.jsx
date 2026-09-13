import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DocsPage from './pages/DocsPage';
import DownloadsPage from './pages/DownloadsPage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Error404Page from './pages/Error404Page';
import Error500Page from './pages/Error500Page';
import PrivacyNotice from './components/PrivacyNotice';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col text-gray-200 antialiased overflow-x-hidden selection:bg-[#22C55E] selection:text-black grid-bg relative">
          {/* Background Ambient Cyber Glows */}
          <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-[#22C55E]/4 rounded-full blur-[150px] pointer-events-none z-[-1] animate-[pulse_8s_ease-in-out_infinite]"></div>
          <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#39FF14]/3 rounded-full blur-[140px] pointer-events-none z-[-1]"></div>

          {/* Navigation Bar */}
          <Navbar />

          {/* Main Content Area */}
          <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-20 z-10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/500" element={<Error500Page />} />
              <Route path="*" element={<Error404Page />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
          <PrivacyNotice />
        </div>
      </Router>
    </AppProvider>
  );
}
