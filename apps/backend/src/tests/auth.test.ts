import request from "supertest";
import app from "../app";
import { User } from "../schemas/UserSchema";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { describe, it, expect, beforeEach } from "@jest/globals";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const debugTest = (res: any) => {
  console.log({
    status: res.status,
    body: res.body,
    headers: res.headers,
    error: res.error?.text,
  });
};

describe("Auth API", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should login successfully", async () => {
    // Criar usuário para teste
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: await bcrypt.hash("123456", 10),
      role: "customer",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "123456",
    });

    debugTest(res);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should register new user with admin token", async () => {
    const admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });

    const adminToken = generateToken(admin._id.toString(), "admin");

    const res = await request(app)
      .post("/api/auth/register") // Certifique-se que a rota está correta
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New User",
        email: "new@test.com",
        password: "123456",
        role: "customer",
      });

    debugTest(res);
    expect(res.statusCode).toEqual(201);
  });
});
