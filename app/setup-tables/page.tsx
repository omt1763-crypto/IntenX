'use client'

import { useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'

export default function TablesSetup() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const jobApplicantsSQL = `CREATE TABLE IF NOT EXISTS public.job_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  position_applied VARCHAR(255),
  status VARCHAR(50) DEFAULT 'invited',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applicants_job_id ON public.job_applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applicants_email ON public.job_applicants(email);
CREATE INDEX IF NOT EXISTS idx_job_applicants_status ON public.job_applicants(status);

ALTER TABLE public.job_applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert applicants" ON public.job_applicants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Recruiters can view applicants" ON public.job_applicants
  FOR SELECT
  USING (job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()));

CREATE POLICY "Update applicant status" ON public.job_applicants
  FOR UPDATE
  USING (true)
  WITH CHECK (true);`

  const interviewsSQL = `CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  applicant_id UUID,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  title VARCHAR(255),
  position VARCHAR(255),
  company VARCHAR(255),
  client VARCHAR(255),
  duration INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  skills JSONB DEFAULT '[]'::jsonb,
  conversation JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON public.interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON public.interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON public.interviews(created_at DESC);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interviews" ON public.interviews
  FOR SELECT
  USING (user_id = auth.uid() OR job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()));

CREATE POLICY "Users can insert own interviews" ON public.interviews
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Recruiters can update their job interviews" ON public.interviews
  FOR UPDATE
  USING (job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()))
  WITH CHECK (job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()));`

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#007a78] mb-2">Database Tables Setup</h1>
        <p className="text-slate-600 mb-8">Copy and run these SQL scripts in your Supabase dashboard</p>

        <div className="space-y-8">
          {/* Table 1: job_applicants */}
          <div className="bg-white border border-[#11cd68]/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#007a78]">Table 1: job_applicants</h2>
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <p className="text-sm text-slate-600 mb-4">Stores candidate information when they apply for jobs</p>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200 overflow-x-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                {jobApplicantsSQL.substring(0, 200)}...
              </pre>
            </div>

            <button
              onClick={() => copyToClipboard(jobApplicantsSQL, 'job_applicants')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Copy size={18} />
              {copied === 'job_applicants' ? 'Copied!' : 'Copy SQL'}
            </button>
          </div>

          {/* Table 2: interviews */}
          <div className="bg-white border border-[#11cd68]/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#007a78]">Table 2: interviews</h2>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">⚠️ Run This Now</span>
            </div>
            <p className="text-sm text-slate-600 mb-4">Stores completed interview data with conversation transcripts</p>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200 overflow-x-auto">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                {interviewsSQL.substring(0, 200)}...
              </pre>
            </div>

            <button
              onClick={() => copyToClipboard(interviewsSQL, 'interviews')}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Copy size={18} />
              {copied === 'interviews' ? 'Copied!' : 'Copy SQL'}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4">📋 Setup Instructions:</h3>
            <ol className="text-blue-800 space-y-3">
              <li className="flex gap-3">
                <span className="font-bold">1.</span>
                <span>Go to <a href="https://app.supabase.com" target="_blank" className="text-blue-600 hover:underline font-semibold">Supabase Dashboard</a></span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">2.</span>
                <span>Select your project</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">3.</span>
                <span>Click "SQL Editor" on the left sidebar</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">4.</span>
                <span>Click "New Query"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">5.</span>
                <span>Copy the SQL above and paste it</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">6.</span>
                <span>Click "Run" to execute</span>
              </li>
            </ol>
          </div>

          {/* Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ After Setup:</h3>
            <ul className="text-green-800 space-y-2">
              <li>✓ Candidates can apply for jobs</li>
              <li>✓ Interviews are saved automatically</li>
              <li>✓ Recruiter dashboard shows all applicants and interviews</li>
              <li>✓ Interview transcripts and data are preserved</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
