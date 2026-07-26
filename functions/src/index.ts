import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Sets a user as an admin based on their email.
 * This is a v2 HTTPS callable function.
 *
 * To run this, you need to be authenticated as an admin yourself.
 * For the VERY FIRST ADMIN, you must either deploy this function temporarily
 * without the auth check, or use the Firebase Admin SDK in a local script.
 *
 * This version includes an auth check to prevent abuse.
 */
export const addAdminRole = onCall(async (request) => {
  // Security Check: Ensure the user calling this function is already an admin.
  // IMPORTANT: To set your FIRST admin, you might need to temporarily
  // comment out this block, deploy, run it for your email, then uncomment and redeploy.
  if (request.auth?.token.admin !== true) {
    throw new HttpsError('permission-denied', 'You must be an admin to add other admins.');
  }

  const email = request.data.email;
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'Please provide a valid email address.');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    return { message: `Success! ${email} has been made an admin.` };
  } catch (error) {
    console.error('Error setting admin role:', error);
    if (error instanceof Error) {
      throw new HttpsError('internal', error.message);
    }
    throw new HttpsError('unknown', 'An unknown error occurred.');
  }
});
