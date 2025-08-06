import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import Home from './pages/DashboardPage'
import {Routes,Route} from "react-router-dom";
import DashboardPage from './pages/DashboardPage';
import EmployeePage from './pages/EmployeePage';
import Layout from './components/Layout';

function App() {

  return (
    <>
    
    <Routes>
      <Route path="/" element={<Layout activePage="dashboard"><DashboardPage /></Layout>} />
      <Route path="/employees" element={<Layout activePage="employees"><EmployeePage /></Layout>} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
    </>
    
  )
}

export default App
