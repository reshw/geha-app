# Environment Variables 4KB Limit Solution - Complete Implementation

## Problem Statement
Netlify deployment was failing with: **"Your environment variables exceed the 4KB limit imposed by AWS Lambda"**

Root cause: AWS Lambda has a hard 4KB limit on environment variables **per function**. Netlify UI passes environment variables to all functions, so when combined credentials exceeded 4KB, every function failed.

## Solution Overview
Convert from environment-variable-based configuration to **build-time file generation**.

**Core Idea**: 
1. Keep API keys in Netlify UI environment variables (minimal size ~400 bytes)
2. At build time: `prebuild` hook runs `scripts/generate-config.js`
3. Script reads environment variables and generates `netlify/functions/config.json`
4. Netlify functions read from `config.json` file instead of `process.env`
5. **Result**: AWS Lambda receives NO environment variables (or minimal ones), just a file to read → no 4KB limit

## Implementation Details

### Step 1: Environment Variables in Netlify UI (Minimal - 400 bytes)
```
RESEND_API_KEY=re_...
NHN_APPKEY=...
NHN_SECRET_KEY=...
NHN_API_URL=https://api.nhncloudservice.com
NHN_PLUS_FRIEND_ID=@조강308
NHN_TEMPLATE_GUEST_CONFIRM=TW_5514
NHN_SENDER_KEY=...
OPENAI_API_KEY=sk-...
```

**NOT in environment variables** (solved separately):
- Firebase credentials → loaded from file (`firebase-credentials.json`)
- Frontend configs → loaded from `.env` as `VITE_*` (public configs)

### Step 2: Build-Time Script (`scripts/generate-config.js`)
```javascript
const fs = require('fs');
const path = require('path');

const config = {
  resend: {
    apiKey: process.env.RESEND_API_KEY
  },
  nhn: {
    apiUrl: process.env.NHN_API_URL || 'https://api.nhncloudservice.com',
    appkey: process.env.NHN_APPKEY,
    secretKey: process.env.NHN_SECRET_KEY,
    senderKey: process.env.NHN_SENDER_KEY,
    plusFriendId: process.env.NHN_PLUS_FRIEND_ID,
    templateGuestConfirm: process.env.NHN_TEMPLATE_GUEST_CONFIRM
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }
};

const configPath = path.join(__dirname, '..', 'netlify', 'functions', 'config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ config.json generated at', configPath);
```

### Step 3: Package.json Prebuild Hook
```json
{
  "scripts": {
    "prebuild": "node scripts/generate-config.js",
    "build": "vite build && npm run build:netlify",
    "dev": "vite"
  }
}
```

When you run `npm run build`:
1. `prebuild` hook executes first → generates `config.json`
2. Vite builds frontend
3. Functions can read from `config.json`

### Step 4: Function Configuration Pattern
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
    console.warn('⚠️ config.json 읽기 실패:', error.message);
    // Fallback for local development - read from process.env
    return {
      resend: { apiKey: process.env.RESEND_API_KEY },
      nhn: {
        apiUrl: process.env.NHN_API_URL,
        appkey: process.env.NHN_APPKEY,
        secretKey: process.env.NHN_SECRET_KEY
      },
      openai: { apiKey: process.env.OPENAI_API_KEY }
    };
  }
}

const config = getConfig();

// Use config instead of process.env
const apiKey = config.resend.apiKey;  // instead of process.env.RESEND_API_KEY
const nhnAppKey = config.nhn.appkey;  // instead of process.env.NHN_APPKEY
```

### Step 5: Functions Updated

#### ✅ send-email.js
- **Change**: Reads `config.resend.apiKey` instead of `process.env.RESEND_API_KEY`
- **Status**: Complete
- **Pattern**: CommonJS

#### ✅ send-praise-notification.js
- **Change**: Reads `config.resend.apiKey` instead of `process.env.RESEND_API_KEY`
- **Status**: Complete
- **Pattern**: ES6 modules (uses `import.meta.url`)

#### ✅ send-notification.js
- **Change**: Reads NHN config from `config.nhn.*` instead of `process.env.NHN_*`
- **Status**: Complete
- **Pattern**: CommonJS

#### ✅ send-alimtalk.js
- **Change**: Reads NHN config from `config.nhn.*` instead of `process.env.NHN_*`
- **Removed**: Deprecated ALIGO_* references (migrated to NHN)
- **Status**: Complete
- **Pattern**: CommonJS

#### ✅ process-praise.js
- **Change**: Reads `config.openai.apiKey` instead of `process.env.OPENAI_API_KEY`
- **Status**: Complete
- **Pattern**: ES6 modules (uses `import.meta.url`)

#### ✅ settlement-auto-close.js, send-push-notification.js
- **Status**: Already using `firebase-loader.js` for Firebase credentials
- **Pattern**: Loads from `firebase-credentials.json` file

#### ✅ send-alimtalk-proxy.js, check-ip.js
- **Status**: Verified - no environment variable dependencies
- **Pattern**: Use Netlify context or external APIs

#### ✅ send-pending-expense-reminder.js
- **Status**: Uses firebase-loader.js
- **Pattern**: File-based Firebase loading

### Step 6: File Protection (.gitignore)
```gitignore
netlify/functions/config.json          # Generated at build time, never commit
netlify/functions/firebase-credentials.json  # Firebase credentials, never commit
.env                                    # Local development only
```

These files are generated/stored locally but never committed to GitHub.

## Size Comparison

### Before (4.5KB+)
```
.env file containing:
- Firebase private key: ~1.8KB
- Base64 encoded JSON: ~2KB
- API keys: ~200 bytes
─────────────────────────────
Total: 4.5KB+

Result: Each function receives 4.5KB of env vars → exceeds 4KB limit → ❌ FAILURE
```

### After (400 bytes in env vars)
```
Netlify UI environment variables:
- RESEND_API_KEY: ~50 bytes
- NHN credentials: ~150 bytes
- OPENAI_API_KEY: ~50 bytes
- Firebase minimal: ~100 bytes
─────────────────────────────
Total: ~400 bytes

+ config.json (generated): 400 bytes (file read, not env var)
+ firebase-credentials.json (file): 1.8KB (file read, not env var)

Result: Each function receives 400 bytes of env vars + file reads → under 4KB limit → ✅ SUCCESS
```

## Local Development Setup

### 1. Create `.env` file
```env
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

# Firebase (optional for local)
FIREBASE_PROJECT_ID=...

# Frontend (public - safe)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_KAKAO_MAP_API_KEY=...
```

### 2. Run build locally
```bash
npm run prebuild    # Generates config.json from .env
npm run build       # Builds frontend + Netlify functions
```

### 3. Test functions locally
```bash
netlify dev         # Runs functions locally with config.json
```

## Netlify Deployment Setup

### 1. In Netlify UI → Site settings → Environment variables
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

### 2. For Firebase (if needed)
Download from Firebase Console → Project Settings → Service Accounts → Generate new private key

**Option A**: Upload to Netlify (more complex)
**Option B**: Store in Netlify Blobs / external service (recommended)
**Option C**: Use firebase-credentials.json file committed with dummy data (current approach)

### 3. Netlify Build Will:
1. Run `npm run prebuild` → generates `config.json` from env vars
2. Run `npm run build` → Vite builds frontend
3. Deploy functions that read from `config.json`

## Why This Works

| Element | Problem | Solution |
|---------|---------|----------|
| **Size Limit** | AWS Lambda 4KB env var limit per function | Move config to file I/O (not counted) |
| **Security** | API keys exposed in GitHub | Keys in Netlify UI only (never committed) |
| **Flexibility** | Hard-coded credentials | Dynamic config from env vars |
| **Scalability** | Can't add more config without exceeding limit | Unlimited file size |
| **Local Dev** | Needs manual setup | Fallback to process.env from .env file |

## Verification Checklist

- [ ] `.env` file minimal (~500 bytes, public info only)
- [ ] `scripts/generate-config.js` exists and generates valid JSON
- [ ] `package.json` has `"prebuild": "node scripts/generate-config.js"`
- [ ] All functions have `getConfig()` function
- [ ] All functions read from `config.*` not `process.env` (except fallback)
- [ ] `netlify/functions/config.json` is in `.gitignore`
- [ ] `netlify/functions/firebase-credentials.json` is in `.gitignore`
- [ ] `npm run prebuild` generates `config.json` correctly locally
- [ ] `npm run build` succeeds
- [ ] Deploy to Netlify staging: `netlify deploy`
- [ ] Check function logs: `netlify logs --function=send-email`
- [ ] Deploy to production: `netlify deploy --prod`

## Testing Commands

```bash
# Test locally
npm run prebuild
cat netlify/functions/config.json   # Verify contents

# Test build
npm run build

# Test with Netlify
netlify dev                         # Run locally with full Netlify context

# Deploy staging
netlify deploy

# Monitor deployment
netlify logs --function=send-email
```

## Common Issues & Solutions

### Issue: "config.json not found"
**Solution**: Make sure `prebuild` runs before deployment. Check Netlify logs for `npm run prebuild` output.

### Issue: "API key is undefined"
**Solution**: 
1. Check `netlify/functions/config.json` exists
2. Verify environment variable is set in Netlify UI
3. Check variable name matches in `generate-config.js`

### Issue: "Function timeout"
**Solution**: File I/O adds negligible overhead. If functions timeout, issue is likely elsewhere (API calls, database queries).

### Issue: "Works locally but not on Netlify"
**Solution**: 
1. Check `.env` file is not committed (it's gitignored)
2. Verify all env vars are in Netlify UI
3. Use `netlify env:list` to verify variables
4. Check Netlify function logs: `netlify logs --function=<name>`

## Success Indicators
✅ Deployment succeeds without "environment variables exceed 4KB" error
✅ Functions receive requests and process them
✅ Logs show no "config.json" or "API key undefined" errors
✅ Both staging and production deployments work
✅ New team members can deploy without modifying code (just env vars)

## Further Optimization
If you need to further reduce env var size:
- Use Netlify Environment Groups
- Store rarely-changing configs in code (no env var)
- Use Netlify Blobs for larger static configs
- Consider using a minimal `.env` with just one "CONFIG_KEY" pointing to external JSON

## Summary
The solution completely eliminates the 4KB environment variable limit by moving configuration from process.env to file-based config.json generated at build time. This keeps Netlify UI env vars under 400 bytes while allowing unlimited configuration size through file I/O.
