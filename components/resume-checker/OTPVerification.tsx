'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Lock, Check, AlertCircle } from 'lucide-react';

interface OTPVerificationProps {
  onVerified: (phoneNumber: string) => void;
  onCancel: () => void;
}

export default function OTPVerification({ onVerified, onCancel }: OTPVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');

  // Simulate OTP countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call to send OTP
      // In production, this would call your backend
      const generatedOTP = Math.random().toString().slice(2, 8);
      setVerificationCode(generatedOTP);
      
      // Log for demo (in production, SMS would be sent)
      console.log(`OTP sent to ${phoneNumber}: ${generatedOTP}`);
      
      setSuccess(`OTP sent to ${phoneNumber}`);
      setStep('otp');
      setTimer(60); // 60 seconds to verify
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp !== verificationCode) {
      setError('Invalid OTP. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate OTP verification
      setSuccess('✓ Phone verified successfully!');
      setTimeout(() => {
        onVerified(phoneNumber);
      }, 1000);
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verify Phone</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">
              Enter your phone number to verify and unlock job matching features
            </p>

            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">{success}</span>
              </div>
            )}

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">
              Enter the OTP sent to {phoneNumber}
            </p>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.slice(0, 6));
                  setError('');
                }}
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">{success}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                Change Number
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>

            {timer > 0 && (
              <p className="text-center text-sm text-gray-600">
                Resend OTP in {timer}s
              </p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          Your phone number is secure and only used for verification
        </p>
      </div>
    </motion.div>
  );
}
