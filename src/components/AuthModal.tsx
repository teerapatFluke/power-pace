'use client';

import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Sheet from './Sheet';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (userEmail: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('ยังไม่ได้ตั้งค่าเชื่อมต่อกับ Supabase');
      return;
    }

    setLoading(true);

    try {
      // 1. ตรวจสอบ Whitelist ในตาราง allowed_emails
      const { data: allowed, error: wlError } = await supabase
        .from('allowed_emails')
        .select('email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (wlError) {
        console.warn('Whitelist query warning:', wlError);
      }

      if (!allowed) {
        setLoading(false);
        setError('ขออภัย อีเมลนี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อขอรับสิทธิ์');
        return;
      }

      // 2. ถ้าผ่าน Whitelist ให้ทำ Authentication
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้สร้างรหัสผ่าน');
          } else {
            setError(authError.message);
          }
          setLoading(false);
          return;
        }

        setSuccessMsg('เข้าสู่ระบบสำเร็จ!');
        setTimeout(() => {
          setLoading(false);
          onClose();
          if (onAuthSuccess) onAuthSuccess(cleanEmail);
        }, 600);
      } else {
        // Sign Up
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (authError) {
          if (authError.message.includes('User already registered')) {
            setError('อีเมลนี้เคยลงทะเบียนไว้แล้ว กรุณาเลือกแท็บ "เข้าสู่ระบบ"');
          } else {
            setError(authError.message);
          }
          setLoading(false);
          return;
        }

        if (signUpData?.session) {
          setSuccessMsg('สร้างบัญชีและเข้าสู่ระบบสำเร็จ!');
          setTimeout(() => {
            setLoading(false);
            onClose();
            if (onAuthSuccess) onAuthSuccess(cleanEmail);
          }, 600);
        } else {
          setSuccessMsg('ลงทะเบียนสำเร็จ! หากระบบตั้งค่าให้ยืนยันอีเมล กรุณาตรวจเช็คกล่องข้อความ');
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setLoading(false);
    }
  };

  return (
    <Sheet
      title={mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างรหัสผ่านครั้งแรก'}
      description="ระบบเฉพาะผู้ใช้งานที่ได้รับสิทธิ์ในระบบ (Whitelist)"
      onClose={onClose}
      size="md"
    >
      <div className="px-5 py-4 space-y-4">
        {/* Tab switch */}
        <div className="flex bg-well p-1 rounded-md">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${
              mode === 'login'
                ? 'bg-paper text-ink shadow-xs'
                : 'text-mute hover:text-ink'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${
              mode === 'signup'
                ? 'bg-paper text-ink shadow-xs'
                : 'text-mute hover:text-ink'
            }`}
          >
            ลงทะเบียนครั้งแรก
          </button>
        </div>

        {/* Error message alert */}
        {error && (
          <div className="p-3 rounded-md bg-plate-red/10 border border-plate-red/20 text-plate-red text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Success message alert */}
        {successMsg && (
          <div className="p-3 rounded-md bg-plate-green/10 border border-plate-green/20 text-plate-green text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email input */}
          <div>
            <label className="text-xs font-semibold text-mute block mb-1">
              อีเมลของคุณ (ที่ได้รับสิทธิ์)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-paper border border-rule rounded-md text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="text-xs font-semibold text-mute block mb-1">
              {mode === 'login' ? 'รหัสผ่าน' : 'ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-paper border border-rule rounded-md text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password input (only in signup mode) */}
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-mute block mb-1">
                ยืนยันรหัสผ่านอีกครั้ง
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-paper border border-rule rounded-md text-ink text-sm placeholder:text-faint focus:outline-none focus:border-plate-blue"
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-md bg-plate-blue hover:bg-plate-blue-dark text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin mr-1">⏳</span>
            ) : mode === 'login' ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading
              ? 'กำลังตรวจสอบ...'
              : mode === 'login'
              ? 'เข้าสู่ระบบ'
              : 'ยืนยันและสร้างบัญชี'}
          </button>
        </form>

        <p className="text-[11px] text-faint text-center leading-relaxed pt-1">
          ระบบจะตรวจจับอีเมลใน Whitelist ทันที บัญชีที่ไม่มีในระบบจะไม่สามารถเข้าใช้งานได้
        </p>
      </div>
    </Sheet>
  );
}
