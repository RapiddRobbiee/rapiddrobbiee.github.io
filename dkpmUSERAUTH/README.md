# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1.  Install dependencies:
    `npm install`
2.  Create a `.env.local` file in the root of your project.
3.  Add your Gemini API key to `.env.local`:
    `GEMINI_API_KEY="YOUR_GEMINI_API_KEY"`
4.  Add your Firebase project configuration to `.env.local`. You can get these from your Firebase project settings:
    ```
    VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    ```
    **Note:** Ensure you enable Email/Password and Google sign-in providers in the Firebase Authentication console.
5.  Run the app:
    `npm run dev`
