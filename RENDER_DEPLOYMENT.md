# Deploy to Render.com - Step by Step Guide

This guide will walk you through deploying EduBridge Africa to Render.com.

## Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Render Account** - Sign up at https://render.com (free)
3. **Gmail Account** (for email alerts) - Optional but recommended

---

## Step 1: Prepare Your Code on GitHub

### 1.1 Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Create a repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Backend Web Service

1. **Go to Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. **Connect GitHub** (if first time):
   - Click "Connect GitHub"
   - Authorize Render to access your repositories
   - Select your repository

4. **Configure the Service:**
   ```
   Name: edubridge-backend
   Region: Choose closest to your users (e.g., Oregon, Frankfurt)
   Branch: main (or your default branch)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

5. **Click "Advanced"** and set:
   ```
   Auto-Deploy: Yes (deploys on every push)
   ```

6. **Click "Create Web Service"**

### 2.2 Configure Environment Variables

While the service is building, go to **"Environment"** tab and add:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=noreply@edubridge-africa.com
```

**Important Notes:**
- `PORT=10000` - Render provides this port, don't change it
- `JWT_SECRET` - Generate a strong random string (32+ characters)
- `EMAIL_PASS` - For Gmail, you need an **App Password**, not your regular password
  - Go to Google Account → Security → 2-Step Verification → App Passwords
  - Generate an app password and use that

### 2.3 Add Persistent Disk for Database

1. Go to **"Disks"** tab
2. Click **"Mount Disk"**
3. Configure:
   ```
   Name: database-storage
   Mount Path: /opt/render/project/src/backend/data
   Size: 1 GB (minimum, increase if needed)
   ```
4. Click **"Mount Disk"**

**Why?** This ensures your SQLite database persists across deployments.

### 2.4 Wait for Deployment

- Render will build and deploy your backend
- Watch the logs for any errors
- Once deployed, note your backend URL: `https://edubridge-backend.onrender.com`

### 2.5 Test Backend

Open in browser or use curl:
```
https://edubridge-backend.onrender.com/api/health
```

You should see:
```json
{"success":true,"message":"EduBridge Africa API is running"}
```

---

## Step 3: Deploy Frontend to Render

### 3.1 Create Static Site

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. **Connect Repository:**
   - Select the same GitHub repository
   - Choose branch: `main`

3. **Configure Build:**
   ```
   Name: edubridge-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Click "Advanced"** and set:
   ```
   Auto-Deploy: Yes
   ```

5. **Click "Create Static Site"**

### 3.2 Configure Environment Variables

Go to **"Environment"** tab and add:

```
VITE_API_URL=https://edubridge-backend.onrender.com/api
```

**Important:** Replace `edubridge-backend` with your actual backend service name if different.

### 3.3 Wait for Deployment

- Render will build your React app
- Once complete, your site will be at: `https://edubridge-frontend.onrender.com`

---

## Step 4: Create Admin User

After backend is deployed:

### Option A: Using Render Shell

1. Go to your backend service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend
   node scripts/createAdmin.js
   ```

### Option B: Using Local Terminal

1. Update your local `.env` to point to production:
   ```env
   VITE_API_URL=https://edubridge-backend.onrender.com/api
   ```

2. Run the script locally (it will connect to production):
   ```bash
   cd backend
   node scripts/createAdmin.js
   ```

**Note:** The admin will be created in the production database.

---

## Step 5: Update CORS Settings

Your backend needs to allow requests from your frontend domain.

### 5.1 Update Backend CORS

Edit `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://edubridge-frontend.onrender.com',
    'https://your-custom-domain.com' // if you add one
  ],
  credentials: true
}));
```

Then commit and push:
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push
```

Render will auto-deploy the changes.

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain to Frontend

1. Go to your Static Site settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `edubridge.africa`)
4. Follow DNS configuration instructions

### 6.2 Add Custom Domain to Backend

1. Go to your Web Service settings
2. Click **"Custom Domains"**
3. Add subdomain (e.g., `api.edubridge.africa`)
4. Update frontend `VITE_API_URL` to use new domain

---

## Step 7: Verify Deployment

### 7.1 Test Checklist

- [ ] Backend health check works: `https://your-backend.onrender.com/api/health`
- [ ] Frontend loads: `https://your-frontend.onrender.com`
- [ ] Login works with admin credentials
- [ ] Can access dashboard after login
- [ ] Database persists (create a test user, restart service, verify it still exists)

### 7.2 Test Login

1. Go to your frontend URL
2. Login with:
   - Email: `admin@edubridge.africa`
   - Password: `bruno123` (or the password you set)

---

## Troubleshooting

### Backend Won't Start

**Check Logs:**
1. Go to backend service → "Logs" tab
2. Look for error messages

**Common Issues:**
- **Port Error**: Make sure `PORT` env var is set to `10000` (Render's default)
- **Database Error**: Ensure disk is mounted at `/opt/render/project/src/backend/data`
- **Module Not Found**: Check `package.json` dependencies

### Frontend Can't Connect to Backend

**Check:**
1. `VITE_API_URL` is set correctly in frontend environment
2. Backend URL is accessible (test in browser)
3. CORS is configured correctly
4. Backend service is running (not sleeping)

### Database Not Persisting

**Solution:**
1. Verify disk is mounted correctly
2. Check mount path: `/opt/render/project/src/backend/data`
3. Restart service and check if data persists

### Email Not Working

**For Gmail:**
1. Enable 2-Step Verification
2. Generate App Password
3. Use App Password (not regular password) in `EMAIL_PASS`

**Test Email:**
- Create a test attendance record or low grade
- Check backend logs for email errors

### Service Goes to Sleep (Free Tier)

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up

**Solutions:**
1. Upgrade to paid plan ($7/month) for always-on
2. Use a service like UptimeRobot to ping your backend every 5 minutes
3. Accept the cold start delay

---

## Cost Estimate

### Free Tier:
- **Backend**: Free (spins down after inactivity)
- **Frontend**: Free (always on)
- **Disk**: Free (1GB included)

### Paid Tier (Recommended for Production):
- **Backend**: $7/month (always on, no cold starts)
- **Frontend**: Free
- **Disk**: Free (1GB included)

**Total: ~$7/month** for production-ready hosting

---

## Next Steps

1. **Set up monitoring**: Use Render's built-in logs
2. **Configure backups**: Set up automated database backups
3. **Add SSL**: Render provides free SSL automatically
4. **Set up alerts**: Configure email alerts for service issues
5. **Scale up**: As you grow, consider upgrading resources

---

## Quick Reference

### Backend Service
- **URL**: `https://edubridge-backend.onrender.com`
- **Health Check**: `https://edubridge-backend.onrender.com/api/health`
- **Logs**: Dashboard → Service → Logs tab

### Frontend Site
- **URL**: `https://edubridge-frontend.onrender.com`
- **Build Logs**: Dashboard → Site → Logs tab

### Environment Variables

**Backend:**
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret-here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@edubridge-africa.com
```

**Frontend:**
```
VITE_API_URL=https://edubridge-backend.onrender.com/api
```

---

## Support

If you encounter issues:
1. Check Render logs (most helpful)
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Ensure both services are deployed and running

Good luck with your deployment! 🚀

