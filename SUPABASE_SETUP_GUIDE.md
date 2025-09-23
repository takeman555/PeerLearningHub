# Supabase Project Setup Guide

## Step 1: Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Fill in the project details:
   - **Name**: `peer-learning-hub` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to your users
6. Click "Create new project"
7. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to your project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" under Settings
4. You'll see your project credentials:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **API Keys**:
     - `anon` `public` key (this is safe to use in your frontend)
     - `service_role` `secret` key (keep this secret!)

## Step 3: Update Your Environment Variables

1. Open the `.env` file in the PeerLearningHub directory
2. Replace the placeholder values with your actual Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 4: Verify the Connection

After updating your `.env` file:

1. Restart your development server
2. The app should now be able to connect to your Supabase project
3. You can test the connection by trying to register a new user

## Important Notes

- Never commit your actual API keys to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Keep your `service_role` key secret - only use it in server-side code
- The `anon` key is safe to use in your React Native app

## Next Steps

Once you have your Supabase project set up and credentials configured:

1. The database tables will be created in the next task
2. Authentication should work with the existing code
3. You can proceed with implementing the database schema

## Troubleshooting

If you encounter issues:

1. Double-check that your URL and API key are correct
2. Make sure there are no extra spaces in your `.env` file
3. Restart your development server after changing environment variables
4. Check the Supabase dashboard for any error logs