# Household Prep Tracker

Free to host: GitHub Pages serves the app, Firebase (free Spark plan) stores and syncs each household's list.

## 1. Firebase (about 10 minutes)
1. Go to console.firebase.google.com → Create a project. Turn off Google Analytics.
2. Build → Authentication → Get started → Email/Password → Enable → Save.
3. Build → Firestore Database → Create database → choose a US location → Start in production mode.
4. Firestore → Rules tab → replace everything with the contents of firestore.rules → Publish.
5. Project settings (gear icon) → Your apps → Web (</>) → register an app (no hosting).
   Copy the firebaseConfig values into firebase-config.js.
6. Authentication → Settings → Authorized domains → Add domain → yourusername.github.io

## 2. GitHub Pages
1. New public repo, e.g. prep-tracker. Upload every file in this folder.
2. Settings → Pages → Deploy from a branch → main / (root) → Save.
3. Open https://yourusername.github.io/prep-tracker

## Using it
- Each person creates an account with their email.
- One person per family taps "Start household", then "Invite" to send a link to their family.
- Anyone else you share the app with starts their own household. Households never see each other's lists.
- On iPhone/iPad: open in Safari → Share → Add to Home Screen.
