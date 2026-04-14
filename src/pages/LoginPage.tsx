import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageShell } from '../components/Layout/PageShell';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { isLoggedIn, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (isLoggedIn) {
    navigate('/map', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await signInWithEmail(email, password);
      if (err) {
        setError(err.message);
        setLoading(false);
      } else {
        navigate('/map', { replace: true });
      }
    } else {
      const { error: err } = await signUpWithEmail(email, password);
      if (err) {
        setError(err.message);
      } else {
        setSignupSuccess(true);
      }
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-sm mx-auto px-4 py-16">
        <h1 className="font-display text-2xl font-bold text-[var(--sg-navy)] text-center mb-8">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>

        {signupSuccess ? (
          <div className="text-center">
            <p className="text-sm text-green-600 mb-4">Check your email to confirm your account, then log in.</p>
            <button
              onClick={() => { setMode('login'); setSignupSuccess(false); setError(null); }}
              className="text-[var(--sg-crimson)] font-medium cursor-pointer text-sm"
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={signInWithGoogle}
              className="w-full py-3 rounded-xl border border-[var(--sg-border)] bg-white text-[var(--sg-navy)] font-medium text-sm hover:bg-[var(--sg-offwhite)] transition-colors cursor-pointer mb-6"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[var(--sg-border)]" />
              <span className="text-xs text-[var(--sg-navy)]/40">or</span>
              <div className="flex-1 h-px bg-[var(--sg-border)]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--sg-border)] bg-white text-sm text-[var(--sg-navy)] placeholder:text-[var(--sg-navy)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sg-thames)]/30"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-[var(--sg-border)] bg-white text-sm text-[var(--sg-navy)] placeholder:text-[var(--sg-navy)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sg-thames)]/30"
              />

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[var(--sg-crimson)] hover:bg-[var(--sg-crimson-hover)] text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Sign up'}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--sg-navy)]/60 mt-6">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); setError(null); }} className="text-[var(--sg-crimson)] font-medium cursor-pointer">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => { setMode('login'); setError(null); }} className="text-[var(--sg-crimson)] font-medium cursor-pointer">
                    Log in
                  </button>
                </>
              )}
            </p>

            <div className="mt-4 text-center">
              <Link to="/" className="text-xs text-[var(--sg-navy)]/40 hover:text-[var(--sg-crimson)] transition-colors">
                Back to home
              </Link>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
