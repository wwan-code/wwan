import jwt from "jsonwebtoken";
import { promisify } from "util";

export const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d", // 7 ngày
  });
};

export const verifyToken = async (token) => {
  try {
    return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};
