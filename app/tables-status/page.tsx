'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, AlertCircle, Copy } from 'lucide-react'

export default function TablesStatus() {
  const [tables, setTables] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkTables()
  }, [])

  const checkTables = async () => {
    try {
      // Try to query job_applicants table to see if it exists
      const { data, error } = await supabase
        .from('job_applicants')
        .select('count(*)', { count: 'exact', head: true })

      setTables({
        job_applicants: !error || !error.message.includes('not found'),
        error: error?.message,
      })
    } catch (err) {
      console.error('Error checking tables:', err)
    } finally {
      setLoading(false)
    }
  }

  const copySQL = () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.job_applicants (
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

    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#007a78] mb-8">Database Tables Status</h1>

        <div className="space-y-4">
          {/* job_applicants table status */}
          <div className="bg-white border border-[#11cd68]/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">job_applicants Table</h2>
              {loading ? (
                <div className="animate-spin">⚙️</div>
              ) : tables.job_applicants ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={24} />
                  <span className="font-semibold">Exists</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={24} />
                  <span className="font-semibold">Missing</span>
                </div>
              )}
            </div>

            {!tables.job_applicants && !loading && (
              <div className="space-y-4">
                <p className="text-slate-600 text-sm">
                  The <code className="bg-slate-100 px-2 py-1 rounded">job_applicants</code> table needs to be created to store candidate applications.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Steps to create:</p>
                  <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                    <li>Go to <a href="https://app.supabase.com" target="_blank" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                    <li>Select your project</li>
                    <li>Click "SQL Editor" on the left sidebar</li>
                    <li>Click "New Query"</li>
                    <li>Click the button below to copy the SQL</li>
                    <li>Paste it in the SQL editor</li>
                    <li>Click "Run"</li>
                  </ol>
                </div>

                <button
                  onClick={copySQL}
                  className="w-full bg-gradient-to-r from-[#007a78] to-[#11cd68] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={20} />
                  {copied ? 'Copied to clipboard!' : 'Copy SQL to clipboard'}
                </button>
              </div>
            )}

            {tables.job_applicants && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-green-700 font-semibold">✅ Table is ready! Applicants can now be saved.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How applicants work:</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Candidate visits job link → pre-onboarding page collects their details</li>
            <li>✓ Details are saved to <code className="bg-white px-1 rounded">job_applicants</code> table</li>
            <li>✓ Recruiter can see all applicants in dashboard</li>
            <li>✓ Interview status updates when candidate completes interview</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
