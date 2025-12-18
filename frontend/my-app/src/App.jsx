import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";


import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  return (
    <>
    <ToastContainer />
    <BrowserRouter>
      <Routes>

        {/* Default route → Login */}
        <Route path="/" element={<Login />} />

        {/* Signup */}
        <Route path="/signup" element={<Signup />} />

        {/*Forgot Password*/}
        <Route path="/forgot" element={<ForgotPassword />} />

        {/* Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Event Page */}
        <Route path="/event/:id" element={<EventPage />} />

      </Routes>
    </BrowserRouter>
    </>
  );
}
