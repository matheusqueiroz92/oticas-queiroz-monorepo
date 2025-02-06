import request from "supertest";
import app from "../app";
import { User } from "../models/User";

describe("User API", () => {
  it("should create a new user", async () => {
    const res = await request(app).post("/api/users").send({
      name: "Matheus1",
      email: "matheus1@example.com",
      password: "123456",
      role: "customer",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "Matheus1");
    expect(res.body).toHaveProperty("email", "matheus1@example.com");
  });

  it("should get a user by ID", async () => {
    const user = await User.create({
      name: "Matheus2",
      email: "matheus2@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app).get(`/api/users/${user._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Matheus2");
    expect(res.body).toHaveProperty("email", "matheus2@example.com");
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("should update a user by ID", async () => {
    const user = await User.create({
      name: "Matheus3",
      email: "matheus3@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .send({ name: "Matheus Updated", email: "matheus.updated@example.com" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Matheus Updated");
    expect(res.body).toHaveProperty("email", "matheus.updated@example.com");
  }, 10000);

  it("should delete a user by ID", async () => {
    const user = await User.create({
      name: "Matheus4",
      email: "matheus4@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app).delete(`/api/users/${user._id}`);

    expect(res.statusCode).toEqual(204);

    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });
});
