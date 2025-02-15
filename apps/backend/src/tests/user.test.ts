import request from "supertest";
import app from "../app";
// import bcrypt from "bcrypt";
import { User } from "../schemas/UserSchema";
import { setupTestUser } from "./helpers";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("User API", () => {
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;

  beforeEach(async () => {
    await User.deleteMany({});

    const admin = await setupTestUser("admin");
    adminToken = admin.token;

    const employee = await setupTestUser("employee");
    employeeToken = employee.token;

    const customer = await setupTestUser("customer");
    customerToken = customer.token;
  });

  it("should allow employee to create only customers", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "New Customer",
        email: "new.customer@test.com",
        password: "123456",
        role: "customer",
      });

    expect(res.statusCode).toEqual(201);
  });

  it("should create user when admin", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New User",
        email: "newuser@test.com",
        password: "123456",
        role: "employee",
      });

    expect(res.statusCode).toEqual(201);
  });

  it("should allow employee to create only customers", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        name: "New Customer",
        email: "new.customer@example.com",
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

    console.log(user); // Adicione este log para garantir que o usuário foi criado

    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log(res.body); // Adicione este log para verificar a mensagem de erro
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
  });

  it("should update user profile", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Updated Name" });

    console.log(res.body); // Adicione este log para verificar a mensagem de erro
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe("Updated Name");
  });
});
