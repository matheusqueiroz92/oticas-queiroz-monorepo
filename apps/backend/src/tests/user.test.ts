import request from "supertest";
import app from "../app";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("User API", () => {
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;

  beforeEach(async () => {
    await User.deleteMany({});

    const admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");

    const employee = await User.create({
      name: "Employee",
      email: "employee@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });
    employeeToken = generateToken(employee._id.toString(), "employee");

    const customer = await User.create({
      name: "Customer",
      email: "customer@test.com",
      password: await bcrypt.hash("123456", 10),
      role: "customer",
    });
    customerToken = generateToken(customer._id.toString(), "customer");
  });

  it("should create user when admin", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Matheus1",
        email: "matheus1@example.com",
        password: "123456",
        role: "employee",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "Matheus1");
  });

  it("should allow employee to create only customers", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "Customer",
        email: "customer@example.com",
        password: "123456",
        role: "customer",
      });

    expect(res.statusCode).toEqual(201);
  });

  it("should get user by ID with admin token", async () => {
    const user = await User.create({
      name: "Test",
      email: "test@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Test");
  });

  it("should update user with admin token", async () => {
    const user = await User.create({
      name: "ToUpdate",
      email: "update@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Updated");
  });

  it("should delete user with admin token", async () => {
    const user = await User.create({
      name: "ToDelete",
      email: "delete@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(204);
    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  it("should not allow unauthorized access", async () => {
    const res = await request(app).get("/api/users");
    expect(res.statusCode).toEqual(401);
  });

  it("should get user profile", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name");
  });

  it("should update user profile", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Updated Name" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe("Updated Name");
  });
});
