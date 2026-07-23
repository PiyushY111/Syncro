import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    req.user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
    };

    next();

  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};