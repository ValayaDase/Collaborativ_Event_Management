import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const resetPassword = async () => {
    if (!email || !password || !confirm) {
      return toast.error("All fields are required");
    }

    if (password !== confirm) {
      return toast.error("Passwords do not match");
    }

    const res = await axios.post("https://collaborativ-event-management-3.onrender.com/auth/reset-password", {
      email,
      newPassword: password,
    });

    if (res.data.success) {
      toast.success("Password updated successfully!");
      navigate("/");
    } else {
      toast.error(res.data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-pink-50 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-gray-500 mt-2">Create a new password</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button
              onClick={resetPassword}
              className="w-full bg-linear-to-r from-indigo-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transform transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Save New Password
            </button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Remember your password?{" "}
              <span
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                onClick={() => navigate("/")}
              >
                Sign in
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
