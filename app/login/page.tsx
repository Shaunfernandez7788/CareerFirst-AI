"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👁️ Toggle State
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 👇 HARDCODED CREDENTIALS
    const VALID_USERNAME = "admin";
    const VALID_PASSWORD = "password123";

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem("isLoggedIn", "true");
      router.push("/"); 
    } else {
      alert("Invalid credentials. Try admin / password123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center tracking-tight">
          CareerFirst <span className="text-blue-600">AI</span>
        </h1>
        <p className="text-slate-500 text-center mb-8 font-medium">Please sign in to continue</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Username Field */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>

          {/* Password Field with Toggle */}
          <div className="relative">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"} // 👁️ Dynamic Type
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {/* Eye Toggle Button */}
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-6 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <span title="Hide Password">🔒</span>
                ) : (
                  <span title="Show Password">👁️</span>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="bg-blue-600 text-white w-full py-4 rounded-2xl font-bold mt-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
          >
            Sign In 🚀
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-8">
          Secure Access • Professional Career Coaching
        </p>
      </div>
    </div>
  );
}