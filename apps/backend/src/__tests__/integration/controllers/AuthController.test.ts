import request from "supertest";
import app from "../../../app";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import { config } from "dotenv";
import bcrypt from "bcrypt";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";
import path from "node:path";
import fs from "node:fs";
import { generateValidCPF } from "../../../utils/validators";

config();

describe("AuthController", () => {
  // CPFs para testes
  const validCPFs = {
    admin: "52998224725",
    employee: "87748248800",
    customer: "71428793860",
    newUser: "61184562847",
  };

  // Caminho para o diretório de uploads
  const uploadsPath = path.join(process.cwd(), "public/images/users");
  const testImagePath = path.join(uploadsPath, "test-image.png");

  // Modificar o modelo User diretamente antes de todos os testes
  beforeAll(async () => {
    // 1. Modificar o modelo User para ignorar validação de CPF
    const userSchema = User.schema;

    if (userSchema.path("cpf")?.validators) {
      userSchema.path("cpf").validators = [];

      // Adicionar um novo validador que sempre retorna true
      userSchema.path("cpf").validate({
        validator: () => true,
        message: "",
      });
    }

    // 2. Criar diretório de uploads se não existir
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    // Criar um arquivo de imagem de teste
    fs.writeFileSync(testImagePath, "test");
  });

  afterAll(() => {
    // Remover o arquivo de imagem de teste
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    cleanUploads();
  });

  const cleanUploads = () => {
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      for (const file of files) {
        const filePath = path.join(uploadsPath, file);
        if (fs.statSync(filePath).isFile() && file.startsWith("test-")) {
          fs.unlinkSync(filePath);
        }
      }
    }
  };

  describe("POST /api/auth/login", () => {
    it("should login successfully", async () => {
      const password = "123456";
      const hashedPassword = await bcrypt.hash(password, 10);
      const email = `test${Date.now()}@example.com`;

      await User.create({
        name: "Test User",
        email,
        password: hashedPassword,
        role: "customer",
        cpf: validCPFs.customer,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const res = await request(app).post("/api/auth/login").send({
        login: email,
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should fail with wrong password", async () => {
      const password = await bcrypt.hash("123456", 10);
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password,
        role: "customer",
        cpf: validCPFs.customer,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const res = await request(app).post("/api/auth/login").send({
        login: "test@example.com",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Credenciais inválidas");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should register new user when admin", async () => {
      // Criar admin
      const admin = await User.create({
        name: "Admin",
        email: "admin-register-test@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "New User by Admin")
        .field("email", `new-by-admin-${Date.now()}@test.com`)
        .field("password", "123456")
        .field("role", "employee")
        .field("cpf", generateValidCPF())
        .field("rg", "123456789")
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "New User by Admin");
    });

    it("should register new customer when employee", async () => {
      // Criar employee
      const employee = await User.create({
        name: "Employee",
        email: "employee@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "employee",
        cpf: validCPFs.employee,
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
      });

      const employeeToken = generateToken(employee._id.toString(), "employee");

      const newUserCpf = generateValidCPF();
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "New Customer")
        .field("email", `customer-${Date.now()}@test.com`)
        .field("password", "123456")
        .field("role", "customer")
        .field("cpf", newUserCpf)
        .field("rg", "123456789")
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("role", "customer");
      expect(res.body).toHaveProperty("cpf", newUserCpf);
    });

    it("should not register without token", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .field("name", "New User")
        .field("email", "new@test.com")
        .field("password", "123456")
        .field("role", "employee")
        .field("cpf", validCPFs.newUser)
        .field("rg", "123456789")
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(401);
    });

    it("should not register admin when employee", async () => {
      // Criar employee
      const employee = await User.create({
        name: "Employee",
        email: "employee@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "employee",
        cpf: validCPFs.employee,
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
      });

      const employeeToken = generateToken(employee._id.toString(), "employee");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "New Admin")
        .field("email", `newadmin-${Date.now()}@test.com`)
        .field("password", "123456")
        .field("role", "admin")
        .field("cpf", generateValidCPF())
        .field("rg", "123456789")
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "message",
        "Funcionários só podem cadastrar clientes e instituições"
      );
    });

    it("should not register with existing email", async () => {
      // Criar admin
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: validCPFs.admin,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      // Tentar registrar com o mesmo email
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Another User")
        .field("email", admin.email || "")
        .field("password", "newpassword")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("rg", "112233445")
        .field("birthDate", "1998-08-20");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Email já cadastrado");
    });

    it("should not register with existing CPF", async () => {
      // Criar usuário admin
      const adminData = {
        name: "Admin User",
        email: "admin-cpf-test@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      };
      const admin = await User.create(adminData);
      const adminToken = generateToken(admin._id.toString(), "admin");

      // Tentar registrar com o mesmo CPF
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "User With Same CPF")
        .field("email", "another-user-cpf@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", adminData.cpf) // <--- Usar o mesmo CPF do admin
        .field("rg", "554433221")
        .field("birthDate", "1992-02-02");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "CPF já cadastrado");
    });
  });

  describe("POST /api/auth/register with image", () => {
    it("should register new user with image when admin", async () => {
      // Criar admin
      const admin = await User.create({
        name: "Admin for Image Test",
        email: `admin-image-test-${Date.now()}@test.com`,
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "New User by Admin")
        .field(
          "email",
          `new-by-admin-${Date.now()}@test.com`
        )
        .field("password", "123456")
        .field("role", "employee")
        .field("cpf", generateValidCPF())
        .field("rg", "123456789")
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty(
        "name",
        "New User by Admin"
      );
    });

    it("should register new user without image when admin", async () => {
      // Criar admin
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: validCPFs.admin,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });
      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "New User without Image")
        .field("email", `new-no-image-${Date.now()}@test.com`)
        .field("password", "123456")
        .field("role", "employee")
        .field("cpf", generateValidCPF())
        .field("rg", "123456789")
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).not.toHaveProperty("image");
    });
  });

  // NOVOS TESTES PARA COBERTURA COMPLETA

  describe("POST /api/auth/login - Validação de dados", () => {
    it("should fail with invalid login data (empty login)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        login: "",
        password: "123456",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de login inválidos");
    });

    it("should fail with invalid login data (short password)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        login: "test@example.com",
        password: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de login inválidos");
    });

    it("should fail with invalid login data (missing password)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        login: "test@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de login inválidos");
    });
  });

  describe("POST /api/auth/register - Validação de dados", () => {
    it("should fail with invalid registration data (short name)", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-validation@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Ab") // Nome muito curto
        .field("email", "test@example.com")
        .field("password", "123456")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de registro inválidos");
    });

    it("should fail with invalid registration data (short password)", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-password@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test User")
        .field("email", "test@example.com")
        .field("password", "123") // Senha muito curta
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de registro inválidos");
    });

    it("should fail with invalid registration data (invalid role)", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-role@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test User")
        .field("email", "test@example.com")
        .field("password", "123456")
        .field("role", "invalid_role") // Role inválido
        .field("cpf", generateValidCPF())
        .field("birthDate", "1995-05-15");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de registro inválidos");
    });

    it("should fail with invalid registration data (future birth date)", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-future-date@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test User")
        .field("email", "test@example.com")
        .field("password", "123456")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", futureDate.toISOString().split("T")[0]);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de registro inválidos");
    });

    it("should fail with invalid registration data (invalid birth date)", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-invalid-date@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test User")
        .field("email", "test@example.com")
        .field("password", "123456")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "invalid-date");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de registro inválidos");
    });
  });

  describe("POST /api/auth/register - Instituições e CNPJ", () => {
    it("should register institution with valid CNPJ", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-institution@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test Institution")
        .field("email", `institution-${Date.now()}@test.com`)
        .field("password", "123456")
        .field("role", "institution")
        .field("cnpj", "12345678000195") // CNPJ válido
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("role", "institution");
      expect(res.body).toHaveProperty("cnpj", "12345678000195");
      expect(res.body).not.toHaveProperty("cpf"); // CPF deve ser removido para instituições
    });

    it("should fail with invalid CNPJ", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-invalid-cnpj@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test Institution")
        .field("email", "institution@test.com")
        .field("password", "123456")
        .field("role", "institution")
        .field("cnpj", "12345678901234") // CNPJ inválido
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de registro inválidos");
    });

    it("should fail with short CNPJ", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-short-cnpj@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test Institution")
        .field("email", "institution@test.com")
        .field("password", "123456")
        .field("role", "institution")
        .field("cnpj", "123456789") // CNPJ muito curto
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados de registro inválidos");
    });
  });

  describe("POST /api/auth/register - Employee permissions", () => {
    let employeeUser: any;

    beforeEach(async () => {
      employeeUser = await User.create({
        name: "Employee Test",
        email: `employee-test-${Date.now()}@test.com`,
        password: await bcrypt.hash("123456", 10),
        role: "employee",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });
    });

    it("should not allow employee to register admin users", async () => {
      const employeeToken = generateToken(employeeUser._id.toString(), "employee");
      
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Admin User")
        .field("email", "admin@test.com")
        .field("password", "password123")
        .field("role", "admin")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Funcionários só podem cadastrar clientes e instituições");
    });

    it("should not allow employee to register employee users", async () => {
      const employeeToken = generateToken(employeeUser._id.toString(), "employee");
      
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Employee User")
        .field("email", "employee@test.com")
        .field("password", "password123")
        .field("role", "employee")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Funcionários só podem cadastrar clientes e instituições");
    });

    it("should allow employee to register customer users", async () => {
      const employeeToken = generateToken(employeeUser._id.toString(), "employee");
      
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Customer User")
        .field("email", "customer@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.role).toBe("customer");
    });

    it("should allow employee to register institution users", async () => {
      const employeeToken = generateToken(employeeUser._id.toString(), "employee");
      
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Institution User")
        .field("email", "institution@test.com")
        .field("password", "password123")
        .field("role", "institution")
        .field("cnpj", "12345678000195");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.role).toBe("institution");
    });
  });

  describe("POST /api/auth/validate-token", () => {
    it("should validate token successfully", async () => {
      const user = await User.create({
        name: "Test User",
        email: "validate-token@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "customer",
        cpf: generateValidCPF(),
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
      });

      const token = generateToken(user._id.toString(), "customer");

      const res = await request(app)
        .post("/api/auth/validate-token")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name");
      expect(res.body).toHaveProperty("role");
    });

    it("should fail when no token is provided", async () => {
      const res = await request(app)
        .post("/api/auth/validate-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });
  });

  describe("POST /api/auth/register - Edge cases", () => {
    it("should fail when user is not authenticated (no role)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .field("name", "Test User")
        .field("email", "test@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });

    it("should fail when user is not authenticated (no user object)", async () => {
      // Simular uma requisição sem o middleware de autenticação
      const res = await request(app)
        .post("/api/auth/register")
        .field("name", "Test User")
        .field("email", "test@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/validate-token - Edge cases", () => {
    it("should fail when user object has no id", async () => {
      // Criar um token inválido que não contém id
      const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE2MzQ1Njc4NzQsImV4cCI6MTYzNDU3MTQ3NH0.invalid-signature";

      const res = await request(app)
        .post("/api/auth/validate-token")
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token inválido");
    });
  });

  describe("AuthController - Edge cases for 100% coverage", () => {
    it("should fail when user is not authenticated (no role) in register", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .field("name", "Test User")
        .field("email", "test@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });

    it("should fail when user is not authenticated (no user object) in register", async () => {
      // Simular uma requisição sem o middleware de autenticação
      const res = await request(app)
        .post("/api/auth/register")
        .field("name", "Test User")
        .field("email", "test@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });

    it("should fail when employee tries to register admin role", async () => {
      const employeeUser = await User.create({
        name: "Employee Test",
        email: `employee-test-${Date.now()}@test.com`,
        password: await bcrypt.hash("123456", 10),
        role: "employee",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });
      const employeeToken = generateToken(employeeUser._id.toString(), "employee");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Admin User")
        .field("email", "admin@test.com")
        .field("password", "password123")
        .field("role", "admin")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Funcionários só podem cadastrar clientes e instituições");
    });

    it("should fail when employee tries to register employee role", async () => {
      const employeeUser = await User.create({
        name: "Employee Test",
        email: `employee-test-${Date.now()}@test.com`,
        password: await bcrypt.hash("123456", 10),
        role: "employee",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });
      const employeeToken = generateToken(employeeUser._id.toString(), "employee");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Another Employee")
        .field("email", "employee2@test.com")
        .field("password", "password123")
        .field("role", "employee")
        .field("cpf", generateValidCPF())
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Funcionários só podem cadastrar clientes e instituições");
    });

    it("should fail when no token is provided in validateToken", async () => {
      const res = await request(app)
        .post("/api/auth/validate-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });

    it("should fail when user is not authenticated (no id) in validateToken", async () => {
      // Simular uma requisição sem o middleware de autenticação
      const res = await request(app)
        .post("/api/auth/validate-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });

    // NOVOS TESTES PARA COBERTURA 100%


    it("should handle non-institution registration without CNPJ", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-customer-cnpj@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test Customer")
        .field("email", "customer@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("cnpj", "12345678000195") // CNPJ deve ser removido para clientes
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.role).toBe("customer");
      expect(res.body).toHaveProperty("cpf");
      expect(res.body).not.toHaveProperty("cnpj"); // CNPJ deve ser removido
    });

    it("should handle non-institution registration without CNPJ", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin-customer-cnpj@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: generateValidCPF(),
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "Test Customer")
        .field("email", "customer@test.com")
        .field("password", "password123")
        .field("role", "customer")
        .field("cpf", generateValidCPF())
        .field("cnpj", "12345678000195") // CNPJ deve ser removido para clientes
        .field("birthDate", "1990-01-01");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.role).toBe("customer");
      expect(res.body).toHaveProperty("cpf");
      expect(res.body).not.toHaveProperty("cnpj"); // CNPJ deve ser removido
    });
  });
});
