/**
 * DTO Validation definitions for Authentication requests.
 */

export const validateRegister = (req) => {
  const { name, email, password } = req.body || {};
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { error: { message: "Name is required and must be at least 2 characters long." } };
  }
  if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) {
    return { error: { message: "A valid email address is required." } };
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return { error: { message: "Password must be at least 8 characters long." } };
  }
  if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/.test(password)) {
    return { error: { message: "Password must contain at least one letter and one number or special character." } };
  }
  return null;
};

export const validateLogin = (req) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) {
    return { error: { message: "A valid email address is required." } };
  }
  if (!password || typeof password !== "string" || password.length === 0) {
    return { error: { message: "Password is required." } };
  }
  return null;
};

export const validateForgotPassword = (req) => {
  const { email } = req.body || {};
  if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) {
    return { error: { message: "A valid email address is required." } };
  }
  return null;
};

export const validateResetPassword = (req) => {
  const { token, newPassword } = req.body || {};
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { error: { message: "Password reset token is required." } };
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return { error: { message: "New password must be at least 8 characters long." } };
  }
  if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/.test(newPassword)) {
    return { error: { message: "New password must contain at least one letter and one number or special character." } };
  }
  return null;
};

export default {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
