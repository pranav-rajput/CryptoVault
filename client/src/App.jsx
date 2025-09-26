import React from 'react';
import { Route, Routes } from 'react-router-dom'
import './App.css'
import IndexPage from './Pages/IndexPage'
import LoginPage from './Pages/LoginPage'
import Layout from './Layout'
import RegisterPage from './Pages/RegisterPage'
import axios from 'axios';
import { UserContextProvider } from './UserContext'
import { useEffect } from 'react'

axios.defaults.baseURL = "http://127.0.0.1:4000";
axios.defaults.withCredentials = true;

function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path='/' element={<Layout/>}>
          <Route index element={<IndexPage />}/>
          <Route path='/login' element={<LoginPage />}/>
          <Route path='/register' element={<RegisterPage/>}/>
        </Route>
      </Routes>
    </UserContextProvider>
  )
}

export default App
