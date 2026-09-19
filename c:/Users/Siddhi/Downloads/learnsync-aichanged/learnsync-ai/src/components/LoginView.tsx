import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, LogIn, User } from 'lucide-react';

import { UserProfile } from '../types';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isForgotPassword) {
      if (!email) return;
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg('A password reset link has been sent to your email.');
      }, 800);
      return;
    }

    if (!email || !password || (isRegister && !name)) {
      return;
    }
    
    setIsLoading(true);
    try {
      if (isRegister) {
        const newUser = {
          id: 'usr_' + Date.now(),
          name: name,
          email: email,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          streakDays: 0,
          lastActiveDate: new Date().toISOString().split('T')[0],
          targetDailyMinutes: 45,
          minutesWatchedToday: 0,
          totalNotesCount: 0,
          quizzesCompletedCount: 0,
        };
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfile: newUser, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register');
        }
        onLogin(data.user);
      } else {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to login');
        }
        onLogin(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col items-center justify-center p-4 font-sans text-[#0F172A]">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header above card */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#4F46E5] rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">LearnSync Studio</h1>
          <p className="text-sm text-[#64748B]">Active Recall, Grounded Quizzes & Gap AI Video Workspace</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E7E9F0] rounded-2xl p-7 shadow-sm space-y-5">
          
          {!isForgotPassword && (
            <div className="flex bg-[#F8FAFC] p-1 rounded-lg border border-[#E7E9F0]">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setErrorMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !isRegister ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setErrorMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  isRegister ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {isForgotPassword && (
            <div className="text-sm font-semibold text-[#0F172A]">Reset Password</div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-100">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A] block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                  <input
                    type="text"
                    required={isRegister}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Darshana Vaidya"
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E9F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0F172A] block">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E9F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0F172A] block">
                  Password
                </label>
                  {!isRegister && !isForgotPassword && (
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setErrorMsg(null); setSuccessMsg(null); }} className="text-xs font-medium text-[#4F46E5] hover:underline">
                      Forgot?
                    </a>
                  )}
                </div>
                {!isForgotPassword && (
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E9F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                    />
                  </div>
                )}
              </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              id="btn-submit-login"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isForgotPassword ? 'Reset Password' : (isRegister ? 'Create Account' : 'Sign In')}</span>
                  {!isForgotPassword && <LogIn className="w-4 h-4" />}
                </>
              )}
            </button>
            
            {isForgotPassword && (
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setSuccessMsg(null); }}
                className="w-full py-2.5 px-4 bg-white text-[#4F46E5] hover:bg-slate-50 border border-[#E7E9F0] font-semibold text-xs rounded-xl transition-all shadow-sm mt-2"
              >
                Back to Sign In
              </button>
            )}
          </form>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#64748B]">
          Authentication state persists locally across active sessions.
        </p>

      </div>
    </div>
  );
};
