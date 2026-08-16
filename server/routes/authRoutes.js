import express from 'express';
import { login, me, register, updateProfile, updatePassword, verifyLogin, resendCode, refreshSession, logoutSession, updateGoogleSync } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const authRouter = express.Router();

authRouter.post('/register', authLimiter, validate(validateRegister), register);
authRouter.post('/login', authLimiter, validate(validateLogin), login);
authRouter.post('/verify-login', authLimiter, verifyLogin);
authRouter.post('/verify', authLimiter, verifyLogin);
authRouter.post('/resend-code', authLimiter, resendCode);
authRouter.post('/refresh', authLimiter, refreshSession);
authRouter.post('/logout', logoutSession);

authRouter.get('/me', protect, me);
authRouter.put('/profile', protect, updateProfile);
authRouter.put('/password', protect, updatePassword);
authRouter.put('/google-sync', protect, updateGoogleSync);

export default authRouter;