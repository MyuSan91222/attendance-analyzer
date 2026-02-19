import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');

  // Load saved credentials when Remember Me checkbox is toggled
  useEffect(() => {
    if (rememberMe) {
      const saved = localStorage.getItem('loginCredentials');
      if (saved) {
        try {
          const { email, password } = JSON.parse(saved);
          setValue('email', email);
          setValue('password', password);
        } catch (err) {
          console.error('Failed to parse saved credentials');
        }
      }
    } else {
      // Clear fields if unchecked
      const saved = localStorage.getItem('loginCredentials');
      if (!saved) {
        setValue('email', '');
        setValue('password', '');
      }
    }
  }, [rememberMe, setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      
      // Save credentials only if user checked "Remember me"
      if (data.rememberMe) {
        localStorage.setItem('loginCredentials', JSON.stringify({
          email: data.email,
          password: data.password
        }));
      } else {
        // Clear saved credentials if user unchecked "Remember me"
        localStorage.removeItem('loginCredentials');
      }
      
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #5a8fa3 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-ink-950 font-bold text-sm" style={{ fontFamily: 'Syne' }}>A</span>
            </div>
            <span className="text-ink-100 font-bold text-lg" style={{ fontFamily: 'Syne' }}>AttendanceAnalyzer</span>
          </div>
          <p className="text-ink-500 text-sm">Sign in to your account</p>
        </div>

        <div className="card p-6 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-danger' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-danger' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password required' })}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" {...register('rememberMe')}
                  className="w-4 h-4 rounded accent-accent bg-ink-800 border-ink-600 cursor-pointer" />
                <span className="text-ink-400 text-sm group-hover:text-ink-300 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-ink-500 hover:text-accent transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-ink-700 border-t-ink-950 rounded-full animate-spin" />
              ) : (
                <><LogIn size={15} />Sign in</>
              )}
            </button>
          </form>

          <div className="border-t border-ink-800 pt-4 text-center">
            <p className="text-ink-500 text-sm">
              No account?{' '}
              <Link to="/signup" className="text-accent hover:text-accent-hover transition-colors font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
