import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import {Routes,Route} from "react-router-dom";

function App() {

  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
    </>
    
  )
}

export default App
