import { useState } from 'react'
//import reactLogo from './assets/editor.svg'
//import viteLogo from '/editor.svg'
import './style.css'
import { Routes, BrowserRouter, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import EditorPage from './pages/EditorPage.jsx'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Test from './pages/Test.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function App() {


  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />}> </Route>
          <Route path='/editorpage/:roomId' element={<EditorPage />}></Route>
          <Route path='/test' element={<Test />}></Route>
          <Route path='/forgot-password' element={<ForgotPassword />}></Route>
          <Route path='/reset-password' element={<ResetPassword />}></Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={2000} />

      </BrowserRouter>
    </>
  )
}

export default App
