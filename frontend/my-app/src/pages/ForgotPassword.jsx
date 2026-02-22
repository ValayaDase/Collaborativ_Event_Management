// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdEmail } from 'react-icons/md';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    
    // TODO: Add API call for password reset
    setTimeout(() => {
      toast.success('Password reset link sent to your email! ');
      setLoading(false);
      setEmail('');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password? </h1>
          <p className="text-gray-600">Enter your email to reset password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus: ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}