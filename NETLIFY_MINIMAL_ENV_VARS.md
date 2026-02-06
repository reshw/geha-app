# Netlify Minimal Environment Variables Setup

## Overview
This document lists the **absolute minimum** environment variables needed in Netlify UI to generate the runtime config. Due to AWS Lambda's 4KB limit, all sensitive data is moved to file-based config generated at build time.

## Build-Time Flow
1. User sets environment variables in Netlify UI or `.env` file
2. During build, `npm run prebuild` runs `scripts/generate-config.js`
3. `scripts/generate-config.js` reads all env vars and generates `netlify/functions/config.json`
4. Netlify functions read from `config.json` (file I/O, not env vars)
5. Result: No 4KB environment variable payload passed to Lambda functions

## Required Environment Variables for Netlify UI

### Resend Email Service
```
RESEND_API_KEY=<your_resend_api_key>
```
- **Used by**: send-email.js, send-praise-notification.js
- **Size**: ~50 bytes
- **Security**: API-only token (safe to expose to functions)

### NHN Cloud (AlimTalk + SMS)
```
NHN_APPKEY=<your_nhn_appkey>
NHN_SECRET_KEY=<your_nhn_secret_key>
NHN_API_URL=https://api.nhncloudservice.com
NHN_PLUS_FRIEND_ID=@조강308
NHN_TEMPLATE_GUEST_CONFIRM=TW_5514
NHN_SENDER_KEY=<your_nhn_sender_key>
```
- **Used by**: send-alimtalk.js, send-alimtalk-proxy.js, send-notification.js
- **Total size**: ~200 bytes
- **Security**: Functions only call NHN API (no credentials exposed to frontend)

### OpenAI (Praise AI)
```
OPENAI_API_KEY=<your_openai_api_key>
```
- **Used by**: process-praise.js
- **Size**: ~50 bytes
- **Security**: Only used server-side in Netlify functions

### Firebase (Optional - for local development)
```
FIREBASE_PROJECT_ID=<your_firebase_project_id>
FIREBASE_PRIVATE_KEY=<your_firebase_private_key>
FIREBASE_CLIENT_EMAIL=<your_firebase_client_email>
```
- **Used by**: settlement-auto-close.js, send-push-notification.js, send-pending-expense-reminder.js
- **Size**: ~1.5KB (this is why we use file-based loading)
- **Security**: Loaded from `firebase-credentials.json` file instead of env vars
- **Setup**: Download from Firebase Console, copy to `netlify/functions/firebase-credentials.json`

### Other Configs (Public - safe in .env)
```
VITE_FIREBASE_API_KEY=<public_firebase_api_key>
VITE_FIREBASE_PROJECT_ID=<your_firebase_project_id>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_messaging_sender_id>
VITE_FIREBASE_APP_ID=<your_firebase_app_id>
VITE_CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
VITE_KAKAO_MAP_API_KEY=<your_kakao_map_api_key>
```
- **Used by**: Frontend (via `import.meta.env.VITE_*`)
- **Size**: ~200 bytes
- **Security**: Public configs only (frontend-safe)

## Total Environment Variable Size
```
Resend:      ~50 bytes
NHN Cloud:   ~200 bytes
OpenAI:      ~50 bytes
Firebase:    ~100 bytes (minimal - only for build)
─────────────────────────
TOTAL:       ~400 bytes (well under 4KB limit per function)
```

## Setup Instructions

### 1. In Netlify UI
Go to **Site settings → Environment variables**

Add these variables:
```
RESEND_API_KEY
NHN_APPKEY
NHN_SECRET_KEY
NHN_API_URL
NHN_PLUS_FRIEND_ID
NHN_TEMPLATE_GUEST_CONFIRM
NHN_SENDER_KEY
OPENAI_API_KEY
```

### 2. Firebase Credentials
Firebase private keys are too large for environment variables. Instead:

1. Download from Firebase Console → Project Settings → Service Accounts
2. Save the JSON file content
3. Copy to your local: `netlify/functions/firebase-credentials.json`
4. In Netlify, set only these variables:
   ```
   FIREBASE_PROJECT_ID=<value from JSON>
   FIREBASE_CLIENT_EMAIL=<value from JSON>
   FIREBASE_PRIVATE_KEY_ID=<value from JSON>
   ```

### 3. Local Development
Create `.env` file in project root:
```
# Resend
RESEND_API_KEY=re_test_...

# NHN Cloud
NHN_APPKEY=...
NHN_SECRET_KEY=...
NHN_API_URL=https://api.nhncloudservice.com
NHN_PLUS_FRIEND_ID=@조강308
NHN_TEMPLATE_GUEST_CONFIRM=TW_5514
NHN_SENDER_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...

# Firebase (optional for local testing)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Public configs (safe for frontend)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_KAKAO_MAP_API_KEY=...
```

## How config.json is Generated

When you run `npm run build`:
1. `prebuild` script executes: `node scripts/generate-config.js`
2. Script reads all environment variables
3. Creates `netlify/functions/config.json` with structure:
```json
{
  "resend": {
    "apiKey": "re_..."
  },
  "nhn": {
    "appkey": "...",
    "secretKey": "...",
    "apiUrl": "https://api.nhncloudservice.com",
    "plusFriendId": "@조강308",
    "templateGuestConfirm": "TW_5514",
    "senderKey": "..."
  },
  "openai": {
    "apiKey": "sk-..."
  },
  "firebase": {
    "projectId": "...",
    "privateKey": "...",
    "clientEmail": "..."
  }
}
```

## Function Usage Pattern

All functions follow this pattern:
```javascript
const fs = require('fs');
const path = require('path');

function getConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ config.json 읽기 실패:', error.message);
    // Fallback for local dev - read from process.env
    return {
      resend: { apiKey: process.env.RESEND_API_KEY },
      nhn: {
        appkey: process.env.NHN_APPKEY,
        secretKey: process.env.NHN_SECRET_KEY
      },
      openai: { apiKey: process.env.OPENAI_API_KEY }
    };
  }
}

const config = getConfig();
// Use config.resend.apiKey instead of process.env.RESEND_API_KEY
```

## Verification Checklist

- [ ] Environment variables in Netlify UI total < 400 bytes
- [ ] `scripts/generate-config.js` exists and creates valid JSON
- [ ] `netlify/functions/config.json` is in `.gitignore`
- [ ] All functions have `getConfig()` function
- [ ] All functions read from `config.*` instead of `process.env`
- [ ] `package.json` has `"prebuild": "node scripts/generate-config.js"`
- [ ] Firebase credentials loaded from file, not environment variables
- [ ] Test deployment: `netlify deploy --prod`

## Why This Works

| Approach | Problem | Solution |
|----------|---------|----------|
| **Before**: All env vars in Netlify UI | 4.5KB env vars × 8 functions = exceeds 4KB per function | ❌ Fails Lambda limit |
| **After**: Minimal env vars + config.json | ~400 bytes env vars + file I/O at runtime | ✅ Passes Lambda limit |

The key insight: AWS Lambda limits **environment variable SIZE**, not **configuration complexity**. By moving config to file I/O (file reads don't count toward the limit), we can pass unlimited configuration data to functions.

## Troubleshooting

### "config.json not found" Error
- Check that `prebuild` script ran: Look for `scripts/generate-config.js` in logs
- Verify `package.json` has `"prebuild": "node scripts/generate-config.js"`
- Confirm environment variables are set in Netlify UI

### "API Key is undefined"
- Check `config.json` structure matches what function expects
- Verify environment variable name matches in `generate-config.js`
- Test locally: `npm run prebuild` then check `netlify/functions/config.json` content

### Firebase Credentials Not Loading
- Ensure `firebase-credentials.json` exists in `netlify/functions/`
- Check file is not in `.gitignore` (we want it in functions folder, but NOT committed)
- Verify Firebase service account JSON format is correct

## Next Steps

1. Set environment variables in Netlify UI (see list above)
2. Run `npm run build` locally to test config.json generation
3. Verify all functions read from config instead of process.env
4. Deploy to staging: `netlify deploy`
5. Monitor function logs for any config loading errors
6. Deploy to production once staging validates
