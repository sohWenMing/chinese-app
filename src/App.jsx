import React from 'react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { Canvas } from './components/Canvas/Canvas';
import './styles/global.css';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Canvas />
      </main>
      <Footer />
    </div>
  );
}

export default App;
