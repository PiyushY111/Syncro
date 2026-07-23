import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
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