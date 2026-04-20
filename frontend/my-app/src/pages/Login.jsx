import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoMailOutline, IoLockClosedOutline, IoArrowForward } from "react-icons/io5";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const login = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return alert("Please fill all fields");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/auth/login", form);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user._id);
        navigate("/dashboard");
      } else {
        alert(res.data.error);
      }
    } catch (err) {
      alert("Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
            EH
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm">Sign in to your EventHub workspace</p>
        </div>

        <form onSubmit={login} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-900 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IoMailOutline className="text-slate-400 text-lg" />
              </div>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-900 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IoLockClosedOutline className="text-slate-400 text-lg" />
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 font-medium rounded-lg hover:bg-slate-800 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : (
              <>Sign In <IoArrowForward /></>
            )}
          </button>
        </form>

        <p className="mt-8 text-sm text-center text-slate-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-black font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
