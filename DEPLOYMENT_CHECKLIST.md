# Deployment Checklist - Environment Variables 4KB Limit Solution

Use this checklist to verify everything is set up correctly before deploying.

## ✅ Pre-Deployment Verification

### Code Changes
- [ ] `scripts/generate-config.js` exists
- [ ] `package.json` has `"prebuild": "node scripts/generate-config.js"` in scripts
- [ ] All functions have `getConfig()` function:
  - [ ] send-email.js
  - [ ] send-praise-notification.js
  - [ ] send-notification.js
  - [ ] send-alimtalk.js
  - [ ] process-praise.js
- [ ] All functions read from `config.*` not `process.env` (except fallback)
- [ ] `.gitignore` contains `netlify/functions/config.json`
- [ ] `.gitignore` contains `netlify/functions/firebase-credentials.json`

### Local Testing
```bash
# Run these commands locally
npm run prebuild                              # ✅ Should generate config.json
cat netlify/functions/config.json             # ✅ Should show valid JSON
npm run build                                 # ✅ Should build without errors
netlify dev                                   # ✅ Should start locally
```

- [ ] `npm run prebuild` runs successfully
- [ ] `config.json` generates with correct structure
- [ ] `config.json` contains all expected keys
- [ ] `npm run build` completes without errors
- [ ] `netlify dev` starts without errors

### Validation Script
```bash
bash test-env-solution.sh
```

- [ ] Test 1: .env file size under 1KB ✅
- [ ] Test 2: prebuild script executes ✅
- [ ] Test 3: config.json generated ✅
- [ ] Test 4: config.json valid JSON ✅
- [ ] Test 5: all required keys present ✅
- [ ] Test 6: getConfig() in functions ✅
- [ ] Test 7: .gitignore configured ✅
- [ ] Test 8: npm run build succeeds ✅

## ✅ Netlify Configuration

### Environment Variables in Netlify UI
Go to **Site settings → Environment variables**

Set these variables (exact names matter):
- [ ] RESEND_API_KEY=`<value>`
- [ ] NHN_APPKEY=`<value>`
- [ ] NHN_SECRET_KEY=`<value>`
- [ ] NHN_API_URL=`https://api-alimtalk.cloud.toast.com`
- [ ] NHN_PLUS_FRIEND_ID=`@조강308`
- [ ] NHN_TEMPLATE_GUEST_CONFIRM=`<value>`
- [ ] NHN_SENDER_KEY=`<value>`
- [ ] OPENAI_API_KEY=`<value>`

**Total size**: Should be under 1KB when combined

### Build Settings
- [ ] Repository connected to Netlify
- [ ] Branch to deploy: `main` (or your deploy branch)
- [ ] Build command: `npm run build` (or `npm ci && npm run build`)
- [ ] Publish directory: `dist`
- [ ] Functions directory: `netlify/functions`

## ✅ Before First Deployment

1. **Verify locally**:
   ```bash
   cd d:\dev\loungeap
   npm install
   npm run prebuild
   npm run build
   netlify dev
   ```
   All should complete without errors

2. **Check environment variable values**:
   - Make sure values are in Netlify UI, not in `.env` file
   - `.env` should only have development/fallback values

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "fix: implement environment variables config.json solution for AWS Lambda 4KB limit"
   git push origin main
   ```

## ✅ Staging Deployment

```bash
netlify deploy --draft
```

- [ ] Deploy succeeds (no errors about 4KB limit)
- [ ] Check Netlify deploy logs
- [ ] Visit staging URL
- [ ] Test a function endpoint (e.g., email, praise)
- [ ] Check function logs: `netlify logs --function=send-email`

### What to look for in logs
✅ Good:
```
✅ config.json generated from environment variables
Function loaded successfully
API call successful
```

❌ Bad:
```
❌ config.json 읽기 실패
environment variables exceed the 4KB limit
API key is undefined
```

## ✅ Testing Functions

Test each function to verify config loading:

```bash
# Test send-email
curl -X POST https://[staging-url]/.netlify/functions/send-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test"}'

# Check logs
netlify logs --function=send-email

# Should show:
# ✅ config.json 생성됨
# API call successful (or similar success message)
```

- [ ] send-email function works
- [ ] send-alimtalk function works
- [ ] send-notification function works
- [ ] process-praise function works

## ✅ Production Deployment

Once staging is verified:

```bash
netlify deploy --prod
```

- [ ] Deploy command runs successfully
- [ ] No "4KB limit exceeded" error
- [ ] Functions are live
- [ ] All endpoints responding

### Monitor Production
```bash
netlify logs
```

- [ ] Check logs for any errors
- [ ] Verify config.json is being read correctly
- [ ] Monitor for first 24 hours
- [ ] Test real workflows (guest booking, praise posting, etc.)

## ⚠️ If Deployment Fails

### Error: "4KB limit exceeded"
1. Check if env vars are still > 1KB total
2. Verify `npm run prebuild` ran during build
3. Check Netlify build logs for "config.json generated"
4. If still failing, check for environment variables in code (grep for `process.env`)

### Error: "config.json not found"
1. Verify `npm run prebuild` ran
2. Check that `scripts/generate-config.js` exists
3. Verify it's executable: `ls -la scripts/generate-config.js`
4. Check Netlify build output for generate-config.js errors

### Error: "API key is undefined"
1. Check Netlify UI has the environment variable set
2. Verify variable name matches `generate-config.js` exactly (case-sensitive)
3. Check config.json structure matches what function expects
4. Look at function logs for which key is missing

### Debug Commands
```bash
# Check environment variables locally
npm run prebuild
cat netlify/functions/config.json | jq .

# Check what generate-config.js is reading
node scripts/generate-config.js

# Test function locally
netlify dev --debug

# Check Netlify build logs
netlify status
netlify logs --with=framework
```

## ✅ Post-Deployment Verification

### First 24 Hours
- [ ] Monitor Netlify analytics - no spike in errors
- [ ] Check function execution times - should be normal
- [ ] Verify API integrations working (email, SMS, push notifications)
- [ ] Test guest booking workflow end-to-end
- [ ] Test praise creation workflow

### User Communication
- [ ] Notify team that deployment is complete
- [ ] Document any configuration changes made
- [ ] Update team wiki/documentation if needed

### Cleanup
- [ ] Delete old `firebase-credentials.json` template if needed
- [ ] Archive old documentation about Netlify setup
- [ ] Update README to reference new SOLUTION_STATUS.md

## ✅ Long-Term Monitoring

### Weekly Checks
- [ ] Monitor error rates in Netlify
- [ ] Check if new functions added using same config pattern
- [ ] Verify config.json is regenerated during each deploy

### If Adding New Environment Variables
1. Add variable to Netlify UI
2. Update `scripts/generate-config.js` to read it
3. Update function to use `config.<service>.<key>`
4. Redeploy

### If Changing API Keys
1. Update value in Netlify UI
2. No code changes needed - `npm run prebuild` will regenerate config.json
3. Redeploy: `netlify deploy --prod`

## 📋 Summary

- **Before**: Deployment failed with "4KB limit exceeded"
- **After**: Deployment succeeds, environment variables ~400 bytes
- **Root Cause**: AWS Lambda hard limit on env vars, Netlify passes all to each function
- **Solution**: Build-time config generation from minimal env vars
- **Deployment**: Standard `netlify deploy --prod`
- **Result**: Scalable, secure, production-ready configuration system

---

**Last Updated**: [Date of Solution Implementation]
**Status**: Ready for Production Deployment ✅

For detailed information, see:
- [SOLUTION_STATUS.md](SOLUTION_STATUS.md) - Overview
- [SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md) - Complete guide
- [NETLIFY_MINIMAL_ENV_VARS.md](NETLIFY_MINIMAL_ENV_VARS.md) - Environment variable requirements
- [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - Visual architecture
