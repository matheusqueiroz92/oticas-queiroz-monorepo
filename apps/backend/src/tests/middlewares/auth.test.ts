import request from "supertest";
import app from "../../app";
import { User } from "../../models/User";
import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

describe("Auth API", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should authenticate with email and return JWT token", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "test@example.com", password: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("name", "Test User");
    expect(res.body.user).toHaveProperty("email", "test@example.com");
    expect(res.body.user).toHaveProperty("role", "employee");
  });

  it("should authenticate with username and return JWT token", async () => {
    const user = await User.create({
      name: "TestUser",
      email: "test@example.com",
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "TestUser", password: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should return 401 for invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "wrong", password: "wrong" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Credenciais inválidas");
  });

  it("should return 500 for server error", async () => {
    jest.spyOn(User, "findOne").mockImplementationOnce(() => {
      throw new Error();
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ login: "test", password: "test" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Erro no servidor");
  });
});
