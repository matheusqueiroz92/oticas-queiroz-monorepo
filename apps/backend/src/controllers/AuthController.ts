import type { Request, Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { login, password } = req.body;

      const user = await User.findOne({
        $or: [{ email: login }, { name: login }],
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: "Credenciais inválidas" });
        return;
      }

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Erro no servidor" });
    }
  }
}
