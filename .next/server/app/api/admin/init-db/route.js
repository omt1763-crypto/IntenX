"use strict";(()=>{var e={};e.id=9773,e.ids=[9773],e.modules={30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},76541:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>T,originalPathname:()=>l,requestAsyncStorage:()=>d,routeModule:()=>n,serverHooks:()=>p,staticGenerationAsyncStorage:()=>E,staticGenerationBailout:()=>R});var s={};a.r(s),a.d(s,{GET:()=>GET});var r=a(10884),i=a(16132),o=a(95798),u=a(47770);async function GET(e){try{console.log("\uD83D\uDD27 Initializing database schema...");let{data:e,error:t}=await u.pR.from("users").select("count(*)",{count:"exact"}).limit(1);if(t&&"PGRST116"===t.code){console.log("⚠️ Users table does not exist");let e=`
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
      `;return o.Z.json({status:"error",message:"Users table does not exist",action:"Please create the table manually in Supabase SQL Editor",sql:e,instructions:["1. Go to https://app.supabase.com","2. Select project: efiurfmrgyisldruqbad","3. SQL Editor → New Query","4. Copy the SQL above","5. Paste & Run"]},{status:400})}if(t)return o.Z.json({status:"error",message:t.message},{status:500});return o.Z.json({status:"success",message:"Users table exists and is ready!",ready:!0})}catch(e){return o.Z.json({status:"error",message:e.message},{status:500})}}let n=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/admin/init-db/route",pathname:"/api/admin/init-db",filename:"route",bundlePath:"app/api/admin/init-db/route"},resolvedPagePath:"C:\\Users\\omt91\\Downloads\\main\\interviewverse_frontend\\app\\api\\admin\\init-db\\route.js",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:E,serverHooks:p,headerHooks:T,staticGenerationBailout:R}=n,l="/api/admin/init-db/route"}};var t=require("../../../../webpack-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),a=t.X(0,[729,5798,8617,7770],()=>__webpack_exec__(76541));module.exports=a})();