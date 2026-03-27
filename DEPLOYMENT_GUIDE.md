# 🚀 DEPLOYMENT GUIDE FOR BEGINNERS
## Student Grade Portal - Vercel + Render

This guide will teach you how to deploy your Student Grade Portal online for FREE using:
- **Vercel** → For Frontend (React app)
- **Render** → For Backend (Node.js/Express API)

---

## 📋 PREREQUISITES (What You Need)

### 1. Accounts to Create (FREE)
1. **GitHub Account** → https://github.com/signup
   - Store your code online
   
2. **Vercel Account** → https://vercel.com/signup
   - Deploy frontend (React app)
   - Sign up using your GitHub account
   
3. **Render Account** → https://render.com/
   - Deploy backend (Node.js API)
   - Sign up using your GitHub account

4. **MongoDB Atlas Account** → https://www.mongodb.com/atlas
   - Database for your app
   - Free tier available

---

## 🗂️ PROJECT STRUCTURE

Your project has 2 parts:
```
STUDENT PORTAL/
├── frontend/          ← React app (deploy to Vercel)
├── backend/           ← Node.js API (deploy to Render)
└── README.md
```

---

## 🎯 STEP 1: Push Code to GitHub

### 1.1 Create a GitHub Repository
1. Go to https://github.com/new
2. Repository name: `grade-portal`
3. Make it **Public**
4. Click **Create repository**

### 1.2 Upload Your Code

**OPTION A: Using Command Line (Terminal)**

```bash
# Open terminal in your project folder
cd "c:\Users\ADMIN\Documents\STUDENT PORTAL"

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Connect to GitHub (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/grade-portal.git

# Push code
git push -u origin master
```

**OPTION B: Using GitHub Desktop (Easier for Beginners)**
1. Download GitHub Desktop: https://desktop.github.com/
2. Click "Add existing repository"
3. Select your `STUDENT PORTAL` folder
4. Click "Publish repository"

---

## 🎯 STEP 2: Setup MongoDB Atlas (Database)

### 2.1 Create Cluster
1. Go to https://www.mongodb.com/atlas
2. Sign up / Sign in
3. Click "Build a Database"
4. Choose **FREE** tier (M0)
5. Select region closest to you (e.g., Singapore)
6. Click "Create Cluster" (takes 1-3 minutes)

### 2.2 Create Database User
1. Click "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Authentication Method: Password
4. Username: `admin`
5. Password: Generate a strong password (SAVE THIS!)
6. Click "Add User"

### 2.3 Allow Network Access
1. Click "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 2.4 Get Connection String
1. Click "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Click "Drivers"
4. Select "Node.js"
5. Copy the connection string:
   ```
   mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/grade-portal?retryWrites=true&w=majority
   ```
6. Replace `PASSWORD` with your actual password
7. **SAVE THIS STRING** - you'll need it for Render

---

## 🎯 STEP 3: Deploy Backend to Render

### 3.1 Create Web Service
1. Go to https://render.com/
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Find and select your `grade-portal` repository
5. Click "Connect"

### 3.2 Configure Backend
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | grade-portal-api |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Root Directory** | `backend` |

### 3.3 Add Environment Variables
Click "Advanced" then "Add Environment Variable":

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your MongoDB connection string from Step 2 |
| `JWT_SECRET` | Create random string (e.g., `MySecretKey123!@#`) |
| `ADMIN_ID` | `admin` |
| `ADMIN_PASSWORD` | Create admin password |

Click **Create Web Service**

### 3.4 Wait for Deployment
- Render will build and deploy your backend
- Takes 2-5 minutes
- You'll see a green "Live" when done
- **Copy the URL** (e.g., `https://grade-portal-api.onrender.com`)

---

## 🎯 STEP 4: Deploy Frontend to Vercel

### 4.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 4.2 Login to Vercel
```bash
vercel login
```
- Press Enter to open browser
- Click "Continue with GitHub"
- Authorize Vercel

### 4.3 Deploy Frontend

**Navigate to frontend folder:**
```bash
cd "c:\Users\ADMIN\Documents\STUDENT PORTAL\frontend"
```

**Create environment file:**
Create file: `frontend\.env.production`
```
VITE_API_URL=https://grade-portal-api.onrender.com/api
```
(Replace with your actual Render URL from Step 3)

**Deploy:**
```bash
vercel
```

Answer the prompts:
- Set up project? **Yes**
- Link to existing project? **No**
- Project name? **grade-portal**
- Directory? **.\** (current directory)

### 4.4 Configure for Production
After first deploy, run:
```bash
vercel --prod
```

### 4.5 Add Environment Variable on Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click your project
3. Click "Settings" tab
4. Click "Environment Variables" (left sidebar)
5. Add variable:
   - Name: `VITE_API_URL`
   - Value: `https://grade-portal-api.onrender.com/api`
6. Click "Save"
7. Redeploy: Go to "Deployments" tab → Click "Redeploy"

---

## 🎯 STEP 5: Configure CORS (IMPORTANT!)

Your backend needs to allow requests from Vercel.

### 5.1 Update Backend CORS
Edit file: `backend/server.js`

Find the CORS section and update:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',     // Local development
    'http://localhost:5173',     // Vite default
    'https://your-vercel-url.vercel.app',  // Your Vercel URL
    'https://grade-portal.vercel.app'      // Your custom domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

Replace `your-vercel-url` with your actual Vercel URL from Step 4.

### 5.2 Commit and Push Changes
```bash
git add .
git commit -m "Update CORS for production"
git push origin master
```

### 5.3 Redeploy Backend
- Go to Render dashboard
- Click your service
- Click "Manual Deploy" → "Deploy latest commit"

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access allowed (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Backend deployed on Render
- [ ] Environment variables set on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables set on Vercel
- [ ] CORS updated in backend
- [ ] Test login works

---

## 🔧 TROUBLESHOOTING

### Problem: "Cannot connect to backend"
**Solution:**
1. Check if Render service is running (green "Live")
2. Verify `VITE_API_URL` is correct in Vercel
3. Check CORS settings include your Vercel URL
4. Check browser console for exact error

### Problem: "MongoDB connection failed"
**Solution:**
1. Check `MONGODB_URI` in Render environment variables
2. Verify password is correct (special characters may need encoding)
3. Check Network Access in MongoDB Atlas

### Problem: "Build failed on Vercel"
**Solution:**
1. Check build logs in Vercel dashboard
2. Make sure `vite` is in package.json dependencies
3. Run `npm run build` locally to test

---

## 🌐 USEFUL LINKS

- **GitHub:** https://github.com
- **Vercel:** https://vercel.com
- **Render:** https://render.com
- **MongoDB Atlas:** https://www.mongodb.com/atlas
- **Your App:** https://[your-vercel-url].vercel.app

---

## 📞 NEED HELP?

If you get stuck:
1. Check the logs in Render/Vercel dashboards
2. Read the error messages carefully
3. Google the exact error message
4. Ask on Stack Overflow or Reddit

---

**🎉 CONGRATULATIONS! Your app is now live online!**
