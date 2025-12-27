(()=>{var e={};e.id=7138,e.ids=[7138],e.modules={55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},25528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},91877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},25319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},57310:e=>{"use strict";e.exports=require("url")},12794:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>p,originalPathname:()=>c,pages:()=>u,routeModule:()=>m,tree:()=>d});var a=s(67096),r=s(16132),n=s(37284),l=s.n(n),i=s(32564),o={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>i[e]);s.d(t,o);let d=["",{children:["init-db",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,6373)),"C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\init-db\\page.js"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,21606)),"C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\layout.js"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9291,23)),"next/dist/client/components/not-found-error"]}],u=["C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\init-db\\page.js"],c="/init-db/page",p={require:s,loadChunk:()=>Promise.resolve()},m=new a.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/init-db/page",pathname:"/init-db",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},36205:(e,t,s)=>{Promise.resolve().then(s.bind(s,48146))},48146:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>InitDBPage});var a=s(30784),r=s(9885);function InitDBPage(){let[e,t]=(0,r.useState)("idle"),[s,n]=(0,r.useState)(""),createTable=async()=>{t("loading"),n("Creating users table...");try{let e=await fetch("/api/admin/init-db"),s=await e.json();e.ok&&s.ready?(t("success"),n("✅ Users table created successfully!")):(t("error"),n(s.message||"Failed to create table. Please follow the manual instructions below."))}catch(e){t("error"),n("Error: "+e.message)}};return a.jsx("div",{className:"min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8",children:a.jsx("div",{className:"max-w-2xl mx-auto",children:(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow-xl p-8",children:[a.jsx("h1",{className:"text-3xl font-bold text-slate-900 mb-4",children:"\uD83D\uDD27 Database Initialization"}),a.jsx("p",{className:"text-slate-600 mb-6",children:"Before you can use the authentication system, we need to create the users table in Supabase."}),s&&a.jsx("div",{className:`p-4 rounded-lg mb-6 ${"success"===e?"bg-green-100 text-green-800":"error"===e?"bg-red-100 text-red-800":"bg-blue-100 text-blue-800"}`,children:s}),(0,a.jsxs)("div",{className:"mb-8 p-6 border-2 border-green-200 rounded-lg bg-green-50",children:[a.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-3",children:"✅ Option 1: Automatic Setup (Recommended)"}),a.jsx("p",{className:"text-slate-600 mb-4",children:"Click the button below and I'll try to create the table automatically."}),a.jsx("button",{onClick:createTable,disabled:"loading"===e,className:"bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition",children:"loading"===e?"⏳ Creating...":"\uD83D\uDE80 Create Table"})]}),(0,a.jsxs)("div",{className:"p-6 border-2 border-blue-200 rounded-lg bg-blue-50",children:[a.jsx("h2",{className:"text-xl font-bold text-slate-900 mb-3",children:"\uD83D\uDCCB Option 2: Manual Setup"}),a.jsx("p",{className:"text-slate-600 mb-4",children:"If the automatic method doesn't work, follow these steps:"}),(0,a.jsxs)("ol",{className:"list-decimal list-inside space-y-2 text-slate-600 mb-4",children:[(0,a.jsxs)("li",{children:["Go to"," ",a.jsx("a",{href:"https://app.supabase.com",target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 hover:underline",children:"https://app.supabase.com"})]}),(0,a.jsxs)("li",{children:["Select project: ",a.jsx("strong",{children:"efiurfmrgyisldruqbad"})]}),(0,a.jsxs)("li",{children:["Click ",a.jsx("strong",{children:'"SQL Editor"'})," in the left sidebar"]}),(0,a.jsxs)("li",{children:["Click blue ",a.jsx("strong",{children:'"New Query"'})," button"]}),a.jsx("li",{children:"Copy the SQL code below"}),a.jsx("li",{children:"Paste into the SQL editor"}),(0,a.jsxs)("li",{children:["Click ",a.jsx("strong",{children:'"Run"'})," ⚡"]})]}),a.jsx("div",{className:"bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto mb-4",children:a.jsx("pre",{children:`CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();`})}),a.jsx("button",{onClick:()=>{let e=`CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();`;navigator.clipboard.writeText(e),alert("SQL copied to clipboard!")},className:"bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition",children:"\uD83D\uDCCB Copy SQL"})]}),a.jsx("div",{className:"mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg",children:(0,a.jsxs)("p",{className:"text-sm text-slate-600",children:[a.jsx("strong",{children:"Note:"})," After creating the table, you can test signup at"," ",a.jsx("a",{href:"/auth/signup",className:"text-blue-600 hover:underline",children:"/auth/signup"})]})})]})})})}},6373:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>l,__esModule:()=>n,default:()=>o});var a=s(95153);let r=(0,a.createProxy)(String.raw`C:\Users\omt91\Downloads\main\interviewverse_frontend\app\init-db\page.js`),{__esModule:n,$$typeof:l}=r,i=r.default,o=i}};var t=require("../../webpack-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),s=t.X(0,[6977,2012],()=>__webpack_exec__(12794));module.exports=s})();