import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('Aditya Sonone');
  const [businessName, setBusinessName] = useState('Vertex Manufacturing Pvt Ltd');
  const [businessType, setBusinessType] = useState<'SUPPLIER' | 'BUYER'>('SUPPLIER');
  const [email, setEmail] = useState('aditya@vertexmfg.in');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);

    try {
      const newUser = await register({
        name,
        email,
        password,
        role: businessType,
        businessName,
        phone,
      });

      const redirectPath = newUser.role === 'BUYER' ? '/buyer/dashboard' : '/dashboard';
      navigate(redirectPath);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md my-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0a0a0a] text-white font-bold text-lg mb-3 shadow-xs">
            SF
          </div>
          <h2 className="text-2xl font-bold font-display text-[#0a0a0a]">Register Business Account</h2>
          <p className="text-xs text-[#737373] mt-1">Start forecasting cash flow & financing invoices</p>
        </div>

        <Card className="p-8 shadow-popover">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#d32f2f]/10 border border-[#d32f2f]/30 flex items-center space-x-2 text-xs text-[#d32f2f]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />

            <Input label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />

            <Select
              label="Business Type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as 'SUPPLIER' | 'BUYER')}
              options={[
                { value: 'SUPPLIER', label: 'Small & Medium Enterprise (SME Supplier)' },
                { value: 'BUYER', label: 'Corporate Buyer' },
              ]}
            />

            <Input label="Work Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="accent" className="w-full mt-4" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-xs text-[#737373] mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-[#ea580c] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
