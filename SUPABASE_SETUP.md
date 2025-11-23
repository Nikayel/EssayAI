# Supabase Setup Guide - EssayEdge AI

Complete guide to set up Supabase with RLS, migrations, and auth.

---

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a name: `essayedge-ai`
4. Set database password (save this!)
5. Choose region (closest to your users)
6. Click "Create"

### 2. Get Connection Details

Once created, go to **Project Settings** → **API**:

```bash
# Copy these to .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (⚠️ Secret!)
```

Go to **Project Settings** → **Database** → **Connection String**:

```bash
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

---

## 📊 Run Migrations

### Option A: Via Supabase Dashboard (Easiest)

1. Go to **SQL Editor** in Supabase dashboard
2. Copy content from `supabase/migrations/20241123000001_initial_schema.sql`
3. Paste and click **Run**
4. Repeat for `supabase/migrations/20241123000002_rls_policies.sql`

### Option B: Via Supabase CLI (Recommended for production)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref xxxxx

# Push migrations
supabase db push

# Verify
supabase db diff
```

---

## 🔐 Verify RLS is Working

Run these tests in **SQL Editor**:

```sql
-- Should return empty (RLS blocks access without auth)
SELECT * FROM essays;

-- Should return user table (public read policy)
SELECT * FROM schools LIMIT 1;

-- Check all RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🎭 Create Test Users

### Via Dashboard:

1. Go to **Authentication** → **Users**
2. Click "Add User"
3. Email: `student@test.com`
4. Password: `test123456`
5. Click "Create User"

### Via SQL:

```sql
-- Insert test student
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  'student@test.com',
  crypt('test123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);

-- Create corresponding user in public.users
INSERT INTO public.users (id, email, name, role)
SELECT id, email, 'Test Student', 'STUDENT'
FROM auth.users
WHERE email = 'student@test.com';
```

### Create Admin User:

```sql
-- Create admin in public.users
INSERT INTO public.users (id, email, name, role)
SELECT id, email, 'Admin User', 'ADMIN'
FROM auth.users
WHERE email = 'admin@test.com';
```

---

## 📁 Storage Buckets (for Human Review files)

1. Go to **Storage** in Supabase
2. Click "New Bucket"
3. Name: `review-files`
4. Make it **Private**
5. Set max file size: 10 MB

### Create Storage Policy:

```sql
-- Users can upload files for their own reviews
CREATE POLICY "Users can upload review files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can download their own files
CREATE POLICY "Users can download own review files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'review-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🧪 Test Your Setup

### 1. Test Auth:

```bash
curl -X POST https://xxxxx.supabase.co/auth/v1/signup \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Test RLS:

```javascript
// In your Next.js app
const { data, error } = await supabase
  .from('essays')
  .select('*');

// Should only return essays owned by logged-in user
console.log(data);
```

### 3. Test Database:

```bash
# Install Prisma CLI
npm install -D prisma

# Generate Prisma Client
npx prisma generate

# Test connection
npx prisma db pull

# Should show all tables
npx prisma studio
```

---

## 🔧 Common Issues & Fixes

### Issue: "relation does not exist"
**Fix**: Run migrations again via SQL Editor

### Issue: "permission denied for table"
**Fix**: Check RLS policies are enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Issue: "JWT expired"
**Fix**: Refresh token or re-login

### Issue: Prisma can't connect
**Fix**: Check DATABASE_URL has correct pooler connection string

---

## 📈 Production Checklist

- [ ] Run all migrations
- [ ] Enable RLS on all tables
- [ ] Test with real user account
- [ ] Set up storage buckets
- [ ] Configure auth email templates
- [ ] Set up database backups (automatic in Supabase)
- [ ] Add API rate limiting (via Supabase Edge Functions)
- [ ] Monitor database size (Dashboard → Reports)

---

## 🎯 Next Steps

1. **Test locally**: `npm run dev` and create an essay
2. **Deploy**: Push to Vercel with env vars
3. **Monitor**: Use Supabase Dashboard → Logs
4. **Scale**: Upgrade Supabase plan when needed

---

## 📞 Need Help?

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/your-repo/issues

**Your database is now production-ready!** 🎉
