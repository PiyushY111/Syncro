import express from 'express';
import { login, me, register, updateProfile, updatePassword, verifyLogin, resendCode, updateGoogleSync } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/verify-login', verifyLogin);
authRouter.post('/resend-code', resendCode);
authRouter.get('/me', protect, me);
authRouter.put('/profile', protect, updateProfile);
authRouter.put('/password', protect, updatePassword);
authRouter.put('/google-sync', protect, updateGoogleSync);

export default authRouter;