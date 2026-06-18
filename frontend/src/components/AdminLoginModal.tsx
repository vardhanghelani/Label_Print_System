import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  open: boolean;
  passwordSet: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<boolean>;
  onSetup: (password: string) => Promise<boolean>;
}

export function AdminLoginModal({
  open,
  passwordSet,
  onClose,
  onLogin,
  onSetup,
}: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const isSetup = !passwordSet;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSetup) {
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please try again.');
        setLoading(false);
        return;
      }
      const success = await onSetup(password);
      setLoading(false);
      if (success) {
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError('Could not set password. Please try again.');
      }
      return;
    }

    const valid = await onLogin(password);
    setLoading(false);
    if (valid) {
      setPassword('');
      onClose();
    } else {
      setError('Wrong password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-brand-100 p-3">
            {isSetup ? (
              <ShieldCheck className="h-6 w-6 text-brand-700" />
            ) : (
              <Lock className="h-6 w-6 text-brand-700" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isSetup ? 'Set Up Admin Password' : 'Admin Access'}
            </h2>
            <p className="text-slate-600">
              {isSetup
                ? 'Choose a password to protect shop settings'
                : 'Enter password to manage settings'}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">{isSetup ? 'Choose Password' : 'Password'}</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder={isSetup ? 'At least 4 characters' : 'Enter admin password'}
            />
          </div>
          {isSetup && (
            <div>
              <label className="label-text">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type password again"
              />
            </div>
          )}
          {error && <p className="text-base font-medium text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Please wait...' : isSetup ? 'Save Password' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
