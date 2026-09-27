import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState('STUDENT');
  const [error, setError] = useState('');

  const roles = [
    { key: 'STUDENT', label: 'Student' },
    { key: 'COMPANY', label: 'Recruiter' },
    { key: 'ADMIN', label: 'T&P Admin' },
  ];

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your university email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success && res.user) {
      const targetRole = res.user.role;
      if (targetRole === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (targetRole === 'COMPANY') {
        navigate('/company/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } else {
      setError(res.message || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: DCRUST Placement Portal Brand Info */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight block">DCRUST Murthal</span>
                <span className="text-[11px] text-indigo-300 font-semibold tracking-wider uppercase block">Training & Placement Cell</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Campus Placement & Eligibility Portal
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Official centralized portal for DCRUST placement drives, real-time eligibility evaluation, resume screening, and recruitment administration.
            </p>
          </div>

          <div className="mt-8 text-[11px] text-indigo-300/80">
            Deenbandhu Chhotu Ram University of Science and Technology, Murthal, Haryana.
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="border-b border-slate-200 mb-8">
            <div className="grid grid-cols-3">
              {roles.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleRoleChange(role.key)}
                  className={`relative px-2 pb-3 text-xs sm:text-sm font-medium transition-colors ${
                    activeRole === role.key
                      ? 'text-indigo-800 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  aria-pressed={activeRole === role.key}
                >
                  [ {role.label} ]
                  {activeRole === role.key && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-700" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign In
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your official university email to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rollnumber@dcrust.ac.in"
              leftIcon={Mail}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={Lock}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={isLoading}
                rightIcon={ArrowRight}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Trouble logging in? Contact the T&P Cell helpdesk at <span className="font-semibold text-slate-700">tpo@dcrust.ac.in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
