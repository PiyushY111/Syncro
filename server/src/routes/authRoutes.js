import express from 'express';
import {
  login,
  me,
  register,
  updateProfile,
  updatePassword,
  verifyLogin,
  resendCode,
  refreshSession,
  logoutSession,
  updateGoogleSync,
  forgotPassword,
  resetPassword,
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyLogin,
  validateResendCode,
} from '../validators/authValidators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { verifyCsrfToken } from '../middlewares/csrf.js';

const authRouter = express.Router();

// Registration, Login & Verification
authRouter.post('/register', authLimiter, validate(validateRegister), register);
authRouter.post('/login', authLimiter, validate(validateLogin), login);
authRouter.post('/verify-login', authLimiter, validate(validateVerifyLogin), verifyLogin);
authRouter.post('/verify', authLimiter, validate(validateVerifyLogin), verifyLogin);
authRouter.post('/resend-code', authLimiter, validate(validateResendCode), resendCode);
authRouter.post('/refresh', authLimiter, refreshSession);
authRouter.post('/logout', verifyCsrfToken, logoutSession);

// Password Recovery Flow
authRouter.post('/forgot-password', authLimiter, validate(validateForgotPassword), forgotPassword);
authRouter.post('/reset-password', authLimiter, validate(validateResetPassword), resetPassword);

// Authenticated User Profile & Security Settings
authRouter.get('/me', protect, me);
authRouter.put('/profile', protect, verifyCsrfToken, updateProfile);
authRouter.put('/password', protect, verifyCsrfToken, updatePassword);
authRouter.put('/google-sync', protect, verifyCsrfToken, updateGoogleSync);

// Session Management & Remote Revocation
authRouter.get('/sessions', protect, listSessions);
authRouter.post('/sessions/:sessionId/revoke', protect, verifyCsrfToken, revokeSession);
authRouter.post('/sessions/revoke-others', protect, verifyCsrfToken, revokeAllOtherSessions);

export default authRouter;