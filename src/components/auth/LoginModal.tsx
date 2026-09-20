import React, { useState } from 'react';
import { Sprout, Mail, Lock, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await quickDemoLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to start demo session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-stone-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 mx-auto mb-3 flex items-center justify-center text-white shadow-md">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-stone-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-stone-500 mt-1">Grow with confidence. Learn with purpose.</p>
        </div>

        {/* Demo Account Quick Access Card */}
        <div className="mb-6 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-200 text-emerald-900 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-emerald-950">Quick Student Demo</p>
              <p className="text-[11px] text-emerald-800">Preloaded as Alex (3rd Year College)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemo}
            disabled={isLoading}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            Explore
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-700">Password</label>
              <button
                type="button"
                onClick={onSwitchToForgot}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
