import { User } from "../schemas/UserSchema";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";

export const setupTestUser = async (
  role: "admin" | "employee" | "customer"
) => {
  const user = await User.create({
    name: `Test ${role}`,
    email: `${role}@test.com`,
    password: await bcrypt.hash("123456", 10),
    role,
  });

  const token = generateToken(user._id.toString(), role);
  return { user, token };
};
