"use strict";(()=>{var e={};e.id=9773,e.ids=[9773],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},66799:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>T,patchFetch:()=>c,requestAsyncStorage:()=>E,routeModule:()=>p,serverHooks:()=>l,staticGenerationAsyncStorage:()=>R});var a={};s.r(a),s.d(a,{GET:()=>d});var r=s(49303),n=s(88716),i=s(60670),o=s(87070),u=s(85662);async function d(e){try{console.log("\uD83D\uDD27 Initializing database schema...");let{data:e,error:t}=await u.pR.from("users").select("count(*)",{count:"exact"}).limit(1);if(t&&"PGRST116"===t.code){console.log("⚠️ Users table does not exist");let e=`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'company')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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
        EXECUTE FUNCTION update_updated_at_column();
      `;return o.NextResponse.json({status:"error",message:"Users table does not exist",action:"Please create the table manually in Supabase SQL Editor",sql:e,instructions:["1. Go to https://app.supabase.com","2. Select project: efiurfmrgyisldruqbad","3. SQL Editor → New Query","4. Copy the SQL above","5. Paste & Run"]},{status:400})}if(t)return o.NextResponse.json({status:"error",message:t.message},{status:500});return o.NextResponse.json({status:"success",message:"Users table exists and is ready!",ready:!0})}catch(e){return o.NextResponse.json({status:"error",message:e.message},{status:500})}}let p=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/init-db/route",pathname:"/api/admin/init-db",filename:"route",bundlePath:"app/api/admin/init-db/route"},resolvedPagePath:"C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\api\\admin\\init-db\\route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:E,staticGenerationAsyncStorage:R,serverHooks:l}=p,T="/api/admin/init-db/route";function c(){return(0,i.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:R})}},85662:(e,t,s)=>{s.d(t,{OQ:()=>o,pR:()=>u});var a=s(76596);let r=process.env.NEXT_PUBLIC_SUPABASE_URL,n=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,i=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!r||!n)throw Error("Missing Supabase environment variables");let o=(0,a.eI)(r,n),u=(0,a.eI)(r,i||n)}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),a=t.X(0,[8948,5972,6596],()=>s(66799));module.exports=a})();