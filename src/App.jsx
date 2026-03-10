import React from 'react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { CharacterGrid } from './components/Canvas/CharacterGrid';
import './styles/global.css';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <CharacterGrid />
      </main>
      <Footer />
    </div>
  );
}

export default App;
