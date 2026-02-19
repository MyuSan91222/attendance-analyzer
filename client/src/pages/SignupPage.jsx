import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api';

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await authApi.signup({ email: data.email, password: data.password });
      if (res.data.requiresVerification) {
        toast.success('Check your email for a verification link!');
        if (res.data.token) {
          toast('Dev mode: token = ' + res.data.token, { icon: '🔑' });
        }
        navigate('/login');
      } else {
        toast.success('Account created! Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #5a8fa3 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-ink-950 font-bold text-sm" style={{ fontFamily: 'Syne' }}>A</span>
            </div>
            <span className="text-ink-100 font-bold text-lg" style={{ fontFamily: 'Syne' }}>AttendanceAnalyzer</span>
          </div>
          <p className="text-ink-500 text-sm">Create your account</p>
        </div>

        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className={`input ${errors.email ? 'border-danger' : ''}`}
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
                })} />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-danger' : ''}`}
                  placeholder="Min. 8 characters"
                  {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'}
                className={`input ${errors.confirmPassword ? 'border-danger' : ''}`}
                placeholder="Repeat password"
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: v => v === password || 'Passwords do not match'
                })} />
              {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-ink-700 border-t-ink-950 rounded-full animate-spin" />
              ) : (
                <><UserPlus size={15} />Create Account</>
              )}
            </button>
          </form>

          <div className="border-t border-ink-800 pt-4 text-center">
            <p className="text-ink-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
