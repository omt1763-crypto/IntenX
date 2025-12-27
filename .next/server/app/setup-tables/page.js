(()=>{var e={};e.id=8728,e.ids=[8728],e.modules={55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},25528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},91877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},25319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},57310:e=>{"use strict";e.exports=require("url")},3090:(e,s,t)=>{"use strict";t.r(s),t.d(s,{GlobalError:()=>l.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>b,tree:()=>d});var i=t(67096),a=t(16132),r=t(37284),l=t.n(r),n=t(32564),o={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>n[e]);t.d(s,o);let d=["",{children:["setup-tables",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,49297)),"C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\setup-tables\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,21606)),"C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\layout.js"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,9291,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\setup-tables\\page.tsx"],p="/setup-tables/page",u={require:t,loadChunk:()=>Promise.resolve()},b=new i.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/setup-tables/page",pathname:"/setup-tables",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},15285:(e,s,t)=>{Promise.resolve().then(t.bind(t,38547))},38547:(e,s,t)=>{"use strict";t.r(s),t.d(s,{default:()=>TablesSetup});var i=t(30784),a=t(9885),r=t(81547),l=t(43335);function TablesSetup(){let[e,s]=(0,a.useState)(null),copyToClipboard=(e,t)=>{navigator.clipboard.writeText(e),s(t),setTimeout(()=>s(null),2e3)},t=`CREATE TABLE IF NOT EXISTS public.job_applicants (
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
  WITH CHECK (true);`,n=`CREATE TABLE IF NOT EXISTS public.interviews (
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
  WITH CHECK (job_id IN (SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()));`;return i.jsx("main",{className:"min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] p-8",children:(0,i.jsxs)("div",{className:"max-w-4xl mx-auto",children:[i.jsx("h1",{className:"text-3xl font-bold text-[#007a78] mb-2",children:"Database Tables Setup"}),i.jsx("p",{className:"text-slate-600 mb-8",children:"Copy and run these SQL scripts in your Supabase dashboard"}),(0,i.jsxs)("div",{className:"space-y-8",children:[(0,i.jsxs)("div",{className:"bg-white border border-[#11cd68]/20 rounded-lg p-6",children:[(0,i.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[i.jsx("h2",{className:"text-xl font-semibold text-[#007a78]",children:"Table 1: job_applicants"}),i.jsx(r.Z,{className:"text-green-600",size:24})]}),i.jsx("p",{className:"text-sm text-slate-600 mb-4",children:"Stores candidate information when they apply for jobs"}),i.jsx("div",{className:"bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200 overflow-x-auto",children:(0,i.jsxs)("pre",{className:"text-xs text-slate-700 whitespace-pre-wrap break-words font-mono",children:[t.substring(0,200),"..."]})}),(0,i.jsxs)("button",{onClick:()=>copyToClipboard(t,"job_applicants"),className:"w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",children:[i.jsx(l.Z,{size:18}),"job_applicants"===e?"Copied!":"Copy SQL"]})]}),(0,i.jsxs)("div",{className:"bg-white border border-[#11cd68]/20 rounded-lg p-6",children:[(0,i.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[i.jsx("h2",{className:"text-xl font-semibold text-[#007a78]",children:"Table 2: interviews"}),i.jsx("span",{className:"bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold",children:"⚠️ Run This Now"})]}),i.jsx("p",{className:"text-sm text-slate-600 mb-4",children:"Stores completed interview data with conversation transcripts"}),i.jsx("div",{className:"bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200 overflow-x-auto",children:(0,i.jsxs)("pre",{className:"text-xs text-slate-700 whitespace-pre-wrap break-words font-mono",children:[n.substring(0,200),"..."]})}),(0,i.jsxs)("button",{onClick:()=>copyToClipboard(n,"interviews"),className:"w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",children:[i.jsx(l.Z,{size:18}),"interviews"===e?"Copied!":"Copy SQL"]})]}),(0,i.jsxs)("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-6",children:[i.jsx("h3",{className:"font-semibold text-blue-900 mb-4",children:"\uD83D\uDCCB Setup Instructions:"}),(0,i.jsxs)("ol",{className:"text-blue-800 space-y-3",children:[(0,i.jsxs)("li",{className:"flex gap-3",children:[i.jsx("span",{className:"font-bold",children:"1."}),(0,i.jsxs)("span",{children:["Go to ",i.jsx("a",{href:"https://app.supabase.com",target:"_blank",className:"text-blue-600 hover:underline font-semibold",children:"Supabase Dashboard"})]})]}),(0,i.jsxs)("li",{className:"flex gap-3",children:[i.jsx("span",{className:"font-bold",children:"2."}),i.jsx("span",{children:"Select your project"})]}),(0,i.jsxs)("li",{className:"flex gap-3",children:[i.jsx("span",{className:"font-bold",children:"3."}),i.jsx("span",{children:'Click "SQL Editor" on the left sidebar'})]}),(0,i.jsxs)("li",{className:"flex gap-3",children:[i.jsx("span",{className:"font-bold",children:"4."}),i.jsx("span",{children:'Click "New Query"'})]}),(0,i.jsxs)("li",{className:"flex gap-3",children:[i.jsx("span",{className:"font-bold",children:"5."}),i.jsx("span",{children:"Copy the SQL above and paste it"})]}),(0,i.jsxs)("li",{className:"flex gap-3",children:[i.jsx("span",{className:"font-bold",children:"6."}),i.jsx("span",{children:'Click "Run" to execute'})]})]})]}),(0,i.jsxs)("div",{className:"bg-green-50 border border-green-200 rounded-lg p-6",children:[i.jsx("h3",{className:"font-semibold text-green-900 mb-2",children:"✅ After Setup:"}),(0,i.jsxs)("ul",{className:"text-green-800 space-y-2",children:[i.jsx("li",{children:"✓ Candidates can apply for jobs"}),i.jsx("li",{children:"✓ Interviews are saved automatically"}),i.jsx("li",{children:"✓ Recruiter dashboard shows all applicants and interviews"}),i.jsx("li",{children:"✓ Interview transcripts and data are preserved"})]})]})]})]})})}},49297:(e,s,t)=>{"use strict";t.r(s),t.d(s,{$$typeof:()=>l,__esModule:()=>r,default:()=>o});var i=t(95153);let a=(0,i.createProxy)(String.raw`C:\Users\omt91\Downloads\main\interviewverse_frontend\app\setup-tables\page.tsx`),{__esModule:r,$$typeof:l}=a,n=a.default,o=n},81547:(e,s,t)=>{"use strict";t.d(s,{Z:()=>a});var i=t(8025);let a=(0,i.Z)("CheckCircle2",[["path",{d:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",key:"14v8dr"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},43335:(e,s,t)=>{"use strict";t.d(s,{Z:()=>a});var i=t(8025);let a=(0,i.Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])}};var s=require("../../webpack-runtime.js");s.C(e);var __webpack_exec__=e=>s(s.s=e),t=s.X(0,[6977,8025,2012],()=>__webpack_exec__(3090));module.exports=t})();