import express from "express";
import verifySignUp from "../middlewares/verifySignUp.js";
import { login, logout, register, sendVerificationCode, socialLogin, updateProfile, upload, uploadAvatar, getUserTimeline, deleteAccount } from "../controllers/auth.controller.js";
import authJwt from "../middlewares/authJwt.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", [
  verifySignUp.checkDuplicateUsernameOrEmail,
  verifySignUp.checkRolesExisted
], register);
router.post("/send-otp", sendVerificationCode)

router.post("/logout", logout);

router.post("/upload-avatar/:uuid", authJwt.verifyToken, upload, uploadAvatar);
router.put("/update-profile/:uuid", authJwt.verifyToken, updateProfile);

router.post("/social-login", socialLogin);

router.get("/timeline/:uuid", authJwt.verifyToken, getUserTimeline);

router.delete(
  '/delete-account', // Hoặc '/delete-account' tùy bạn chọn
  authJwt.verifyToken, // Áp dụng middleware xác thực
  deleteAccount
);
export default router;