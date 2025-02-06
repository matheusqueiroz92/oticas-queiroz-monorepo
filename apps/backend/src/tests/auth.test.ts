import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

describe("Auth API", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should authenticate user and return JWT token", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should not authenticate invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@example.com", password: "wrong" });

    expect(res.statusCode).toBe(401);
  });

  it("should include user role in token", async () => {
    const user = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "123456" });

    const decoded = jwt.verify(
      res.body.token,
      process.env.JWT_SECRET || "secret"
    );
    expect(decoded).toHaveProperty("role", "admin");
  });
});
