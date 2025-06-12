import express from "express";
import verifySignUp from "../middlewares/verifySignUp.js";
import { login, logout, register, sendVerificationCode, socialLogin, updateProfile, upload, uploadAvatar, getUserTimeline, deleteAccount } from "../controllers/auth.controller.js";
import authJwt from "../middlewares/authJwt.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) =>
    res.status(options.statusCode).json({
      message: "Quá nhiều lần thử từ IP này. Vui lòng thử lại sau 15 phút."
    }),
  // skipSuccessfulRequests: true, // Bỏ qua nếu không muốn chỉ đếm request lỗi
});

const router = express.Router();

router.post("/login", authLimiter, login);
router.post("/register", [
  verifySignUp.checkDuplicateUsernameOrEmail,
  verifySignUp.checkRolesExisted
], register);
router.post("/send-otp", sendVerificationCode)

router.post("/logout", logout);

router.post("/upload-avatar/:uuid", authJwt.verifyToken, upload, uploadAvatar);
router.put("/update-profile/:uuid", authJwt.verifyToken, upload, updateProfile);

router.post("/social-login", socialLogin);

router.get("/timeline/:uuid", authJwt.verifyToken, getUserTimeline);

router.delete(
  '/delete-account',
  authJwt.verifyToken,
  deleteAccount
);
export default router;