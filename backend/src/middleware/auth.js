const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return err;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

const authenticateTeam = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return err;
    
    if (req.user.role !== 'team' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Team access required' });
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  authenticateAdmin,
  authenticateTeam
};
