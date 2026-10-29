# Dermalyze (stage 1)

Login, photo upload, AI skin analysis (acne, dark circles, pigmentation), and a photo history.

## Run it (Windows PowerShell)

1. Open this folder in PowerShell: `cd C:\Users\Shali\dermalyze`
2. `npm install`  (a few minutes)
3. `npx ampx sandbox`  (first time takes 5-10 minutes; leave this window open)
   - It creates your Cognito login, S3 bucket, database and AI function in AWS, and writes `amplify_outputs.json`.
4. Open a SECOND PowerShell window in the same folder and run: `npm run dev`
5. Open the address it prints (usually http://localhost:5173), create an account with your email, confirm the code, and upload a photo.

## Change the AI model

Edit `MODEL_ID` in `amplify/functions/analyze/resource.ts`. The sandbox redeploys on save.

## Stop and clean up

Press Ctrl+C in the sandbox window, then `npx ampx sandbox delete` to remove everything from AWS.
