import Role from "../models/Role.js";
import User from "../models/User.js";

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    const existingUserByEmail = await User.findOne({ where: { email: req.body.email } });
    if (existingUserByEmail) {
      return res.status(400).send({ message: "Email đã được sử dụng!" });
    }

    next();
  } catch (error) {
    return res.status(500).send({ message: "Có lỗi xảy ra trong quá trình kiểm tra!" });
  }
};

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    const invalidRoles = req.body.roles.filter(role => !Role.includes(role));
    if (invalidRoles.length > 0) {
      return res.status(400).json({ message: "Role does not exist: " + invalidRoles.join(", ") });
    }
  }
  
  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};

export default verifySignUp;