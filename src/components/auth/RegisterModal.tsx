import React, { useState } from 'react';
import { Sprout, User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterModalProps {
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [realName, setRealName] = useState('');
  const [nickname, setNickname] = useState('');
  const [studentId, setStudentId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [educationLevel, setEducationLevel] = useState('Undergraduate (3rd/Final Year)');
  const [mainGrowthGoal, setMainGrowthGoal] = useState('Improve confidence & public speaking');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const chosenNickname = nickname.trim() || realName.trim().split(' ')[0] || 'Friend';
      await register({
        name: realName.trim(),
        real_name: realName.trim(),
        nickname: chosenNickname,
        student_id: studentId.trim() || `GW-${Math.floor(1000 + Math.random() * 9000)}`,
        college_name: collegeName.trim() || 'College / University',
        email,
        password,
        confirmPassword,
        age: age ? parseInt(age, 10) : undefined,
        education_level: educationLevel,
        main_growth_goal: mainGrowthGoal,
        onboarding_completed: true,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const goalOptions = [
    'Improve confidence & public speaking',
    'Improve spoken & written English',
    'Become better at communication & group discussions',
    'Prepare for campus placements & interviews',
    'Manage academic stress & self-doubt',
    'Develop consistent daily growth habits',
    'General personal growth & self-reflection',
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-stone-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 mx-auto mb-3 flex items-center justify-center text-white shadow-md">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-stone-900 tracking-tight">Create Your Space</h2>
          <p className="text-xs text-stone-500 mt-1">Begin your private, empowering journey with GrowWise</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full / Real Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="e.g. Alexander Chen"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nickname / Call Name <span className="text-emerald-700 font-normal">(AI calls you this)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Student ID / Roll No.
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS-2024-819"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                College / Institution
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Apex Tech Institute"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@college.edu"
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Age</label>
              <input
                type="number"
                min="14"
                max="99"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="20"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Education Level</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              >
                <option value="High School">High School</option>
                <option value="Undergraduate (1st/2nd Year)">Undergrad (1st/2nd Year)</option>
                <option value="Undergraduate (3rd/Final Year)">Undergrad (3rd/Final Year)</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Young Professional">Young Professional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Primary Growth Goal</label>
            <select
              value={mainGrowthGoal}
              onChange={(e) => setMainGrowthGoal(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            >
              {goalOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
