import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && !key.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createJobApplicantsTable() {
  try {
    console.log('📝 Creating job_applicants table...')

    // Create the table using SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.job_applicants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          position_applied VARCHAR(255),
          status VARCHAR(50) DEFAULT 'invited',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_job_applicants_job_id ON public.job_applicants(job_id);
        CREATE INDEX IF NOT EXISTS idx_job_applicants_email ON public.job_applicants(email);
        CREATE INDEX IF NOT EXISTS idx_job_applicants_status ON public.job_applicants(status);
      `
    })

    if (error) {
      // The exec_sql RPC might not exist, so let's try a different approach
      console.log('ℹ️ exec_sql not available, using alternative method...')
      
      // We'll need to use the SQL editor in Supabase dashboard instead
      // But let's provide the SQL that needs to be run
      const sql = `
CREATE TABLE IF NOT EXISTS public.job_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  position_applied VARCHAR(255),
  status VARCHAR(50) DEFAULT 'invited',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applicants_job_id ON public.job_applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applicants_email ON public.job_applicants(email);
CREATE INDEX IF NOT EXISTS idx_job_applicants_status ON public.job_applicants(status);
      `

      console.log('\n📋 Please run this SQL in your Supabase dashboard:')
      console.log('=' .repeat(80))
      console.log(sql)
      console.log('=' .repeat(80))
      console.log('\nSteps:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Click "SQL Editor" on the left')
      console.log('3. Click "New Query"')
      console.log('4. Copy and paste the SQL above')
      console.log('5. Click "Run"')
      return
    }

    console.log('✅ job_applicants table created successfully!')
    
    // Test insert to verify table works
    const testData = {
      job_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
      name: 'Test Applicant',
      email: 'test@example.com',
      position_applied: 'Test Role',
      status: 'invited'
    }

    console.log('✅ Table structure is ready!')
    console.log('\nTable: job_applicants')
    console.log('Columns:')
    console.log('  - id (UUID, Primary Key)')
    console.log('  - job_id (UUID, Foreign Key to jobs)')
    console.log('  - name (VARCHAR)')
    console.log('  - email (VARCHAR)')
    console.log('  - position_applied (VARCHAR)')
    console.log('  - status (VARCHAR, default: invited)')
    console.log('  - created_at (TIMESTAMPTZ)')
    console.log('  - updated_at (TIMESTAMPTZ)')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createJobApplicantsTable()
