# Troubleshooting Guide - Getting the App Running

## ❌ Issue: Can't Access App in Browser

Try these steps in order:

### Step 1: Install Dependencies
```bash
# Clear old node_modules (sometimes they get corrupted)
rm -rf node_modules package-lock.json

# Install fresh dependencies
npm install
```

If you see dependency conflicts, try:
```bash
npm install --legacy-peer-deps
```

**Expected output:** No red errors, just warnings are okay.

---

### Step 2: Check for Build Errors
```bash
# Try to build the app
npm run build
```

**Possible errors you might see:**

#### Error: "Cannot find module"
```bash
# Solution: Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

#### Error: "Port 3000 already in use"
```bash
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Then try:
npm run dev
```

#### TypeScript Errors (can usually be ignored)
```bash
# Next.js ignores TypeScript errors by default
# These shouldn't block your app from running
npm run dev
```

---

### Step 3: Start Development Server
```bash
npm run dev
```

**Expected output:**
```
> my-project@0.1.0 dev
> next dev

  ▲ Next.js 16.2.6
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

**If you see this, continue to Step 4.**

---

### Step 4: Access in Browser
Open your browser and go to: **http://localhost:3000**

You should see the app homepage.

---

## 🔍 If You Still Can't Access It:

### Check 1: Is the server actually running?
Look for this in terminal:
```
✓ Ready in X.Xs
```

If you see errors instead:
```bash
# Scroll up in terminal to see the error message
# Copy the error and let me know
```

### Check 2: Try a different port
```bash
npm run dev -- -p 3001
# Then visit: http://localhost:3001
```

### Check 3: Check if port 3000 is open
```bash
# macOS/Linux:
netstat -an | grep 3000

# Windows (PowerShell):
netstat -ano | findstr :3000
```

### Check 4: Firewall issues
- Check if your firewall is blocking localhost:3000
- Try disabling temporarily to test

---

## 📋 Quick Checklist

- [ ] Ran `npm install` successfully
- [ ] Ran `npm run build` successfully
- [ ] Terminal shows "Ready in X.Xs"
- [ ] No red error messages in terminal
- [ ] Tried http://localhost:3000 in browser
- [ ] Refreshed browser (Ctrl+R or Cmd+R)
- [ ] Tried http://127.0.0.1:3000
- [ ] Tried a different browser

---

## 🆘 Still Having Issues?

Provide me with:
1. The **exact error message** from terminal
2. Output of: `npm run build 2>&1`
3. Your OS (Windows/Mac/Linux)
4. Node version: `node --version`

---

## 🚀 Production Testing

Once local dev works:

```bash
# Create production build
npm run build

# Test production build locally
npm start

# Visit http://localhost:3000
```

---

## 📊 Expected App Features

Based on the screenshots in the repo, you should see:
- ✅ Login page
- ✅ Dashboard
- ✅ Messages section
- ✅ Member addition

All of this should load on http://localhost:3000
