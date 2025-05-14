import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    // Có thể kiểm tra lỗi cụ thể (TokenExpiredError, JsonWebTokenError)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Unauthorized! Access Token was expired!" });
    }
    return res.status(401).json({ message: "Unauthorized!" });
  }
};

const getUser = async (req, res, next) => {
  const token = req.headers["x-access-token"];
  req.userId = null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return next();
    }

    req.userId = user.id;
    next();
  } catch (err) {
    return next();
  }
};

const checkRole = async (req, res, next, role) => {
  try {
    const user = await User.findOne({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const roles = await user.getRoles();
    const hasRole = roles.some(r => r.name === role);
    if (hasRole) {
      return next();
    }

    return res.status(403).json({ message: `Require ${role.charAt(0).toUpperCase() + role.slice(1)} Role!` });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const isAdmin = (req, res, next) => checkRole(req, res, next, 'admin');
const isEditor = (req, res, next) => checkRole(req, res, next, 'editor');

const isEditorOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const roles = await user.getRoles();
    const hasEditor = roles.some(r => r.name === 'editor');
    const hasAdmin = roles.some(r => r.name === 'admin');

    if (hasEditor || hasAdmin) {
      return next();
    }

    return res.status(403).json({ message: "Yêu cầu vai trò Editor hoặc Admin!" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", error: err });
  }
};

const authJwt = {
  getUser,
  verifyToken,
  isAdmin,
  isEditor,
  isEditorOrAdmin
};

export default authJwt;