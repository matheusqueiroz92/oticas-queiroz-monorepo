import request from "supertest";
import app from "../app";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("Auth API", () => {
  let adminToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    const admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: "123456",
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Matheus",
        email: "newuser@example.com",
        password: "123456",
        role: "customer",
      });

    expect(res.statusCode).toEqual(201);
  });

  it("should login with valid credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Matheus",
        email: "matheus@example.com",
        password: "123456",
        role: "customer",
      });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "matheus@example.com", password: "123456" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should not login with invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "matheus@example.com", password: "wrongpassword" });

    expect(res.statusCode).toEqual(401);
  });
});
