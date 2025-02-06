import request from "supertest";
import app from "../app"; // Certifique-se de que está importando o app corretamente
import { User } from "../models/User";

describe("User API", () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  it("should create a new user", async () => {
    const res = await request(app).post("/api/users").send({
      name: "Matheus",
      email: "matheus@example.com",
      password: "123456",
      role: "customer",
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "Matheus");
    expect(res.body).toHaveProperty("email", "matheus@example.com");
  });

  it("should get all users", async () => {
    const user1 = await User.create({
      name: "Matheus",
      email: "matheus@example.com",
      password: "123456",
      role: "customer",
    });

    const user2 = await User.create({
      name: "Lucas",
      email: "lucas@example.com",
      password: "123456",
      role: "customer",
    });

    const user3 = await User.create({
      name: "Deborah",
      email: "deborah@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app).get("/api/users/");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Matheus");

    expect(res.body).toHaveProperty("email", "matheus@example.com");
  });

  it("should get a user by ID", async () => {
    const user = await User.create({
      name: "Matheus",
      email: "matheus@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app).get(`/api/users/${user._id}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Matheus");
    expect(res.body).toHaveProperty("email", "matheus@example.com");
  });

  it("should update a user by ID", async () => {
    const user = await User.create({
      name: "Matheus",
      email: "matheus@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .send({ name: "Matheus Updated", email: "matheus.updated@example.com" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Matheus Updated");
    expect(res.body).toHaveProperty("email", "matheus.updated@example.com");
  });

  it("should delete a user by ID", async () => {
    const user = await User.create({
      name: "Matheus",
      email: "matheus@example.com",
      password: "123456",
      role: "customer",
    });

    const res = await request(app).delete(`/api/users/${user._id}`);

    expect(res.statusCode).toEqual(204);

    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });
});
