# Safety Reach - Complete Setup Guide

## Step 1 - Run the SQL Schema in Supabase

1. Go to your Supabase project:
   https://supabase.com/dashboard/project/wyqmcrqaxicimgdfttvq
2. Click **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Paste the full contents of `sql.sql`.
5. Click **Run**.

## Step 2 - Configure Email Auth

For easiest local testing:

1. Go to **Authentication -> Providers -> Email**.
2. Turn **Confirm email** OFF.
3. Click **Save**.

If you keep email confirmation ON, users must confirm their email before they can log in.

## Step 3 - Environment Variables

Your `.env` file should contain:

```env
SUPABASE_PUBLISHABLE_KEY="sb_publishable_yU0dHNn2LBJSISYqDFAqTw_eycI_dyk"
SUPABASE_URL="https://wyqmcrqaxicimgdfttvq.supabase.co"
VITE_SUPABASE_PROJECT_ID="wyqmcrqaxicimgdfttvq"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_yU0dHNn2LBJSISYqDFAqTw_eycI_dyk"
VITE_SUPABASE_ANON_KEY="sb_publishable_yU0dHNn2LBJSISYqDFAqTw_eycI_dyk"
VITE_SUPABASE_URL="https://wyqmcrqaxicimgdfttvq.supabase.co"
```

## Step 4 - Run the App

```bash
npm.cmd run dev
```

Open the URL Vite prints in the terminal, usually:

```text
http://localhost:5173
```

## Step 5 - Test

1. Sign up with a new account.
2. Log in.
3. Open **Settings** and save your profile.
4. Add emergency contacts.
5. Trigger an alert.
6. Check **Alert History**.

## Step 6 - Enable Real SOS Email Sending With EmailJS

The SOS button sends emails using EmailJS directly from the browser. This is the easiest setup for demo and college projects.

Create an EmailJS account at https://www.emailjs.com and add these values to `.env`:

```env
VITE_EMAILJS_SERVICE_ID="service_womansafety"
VITE_EMAILJS_TEMPLATE_ID="template_5sjzchk"
VITE_EMAILJS_PUBLIC_KEY="vA9DUsnekuf45NX05"
```

Your EmailJS template should use these variables:

```text
to_name
to_email
email
recipient_email
reply_to
user_email
from_name
message
sos_message
live_location
map_link
location_url
latitude
longitude
sent_at
```

In EmailJS template settings, the **To Email** field must be dynamic:

```text
{{to_email}}
```

Do not put your own email address in **To Email**, otherwise every SOS email will come only to your own inbox.

Your email body should include at least one of these location variables:

```text
Live location: {{location_url}}
Map link: {{map_link}}
Coordinates: {{latitude}}, {{longitude}}
```

If `{{message}}` is used, the app also includes the live location link inside that message automatically.

### Test SOS Email

1. Restart the app.
2. Log in.
3. Add at least one emergency contact with a valid email.
4. Click the SOS button.
5. The app gets your location, sends email with EmailJS, and saves alert history.

## Troubleshooting

| Error | Fix |
| --- | --- |
| Email not confirmed | Disable email confirmation in Supabase Dashboard -> Authentication -> Providers -> Email |
| Invalid login credentials | Check email/password and make sure the user has signed up |
| Missing Supabase environment variable | Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Profile not loading in Settings | Run `sql.sql` in Supabase SQL Editor |
| Contacts not saving | Run `sql.sql` and check RLS policies are created |
| EmailJS environment variables are missing | Check `.env` has `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` |
| EmailJS failed to send SOS email | Check EmailJS service/template settings and recipient email |
