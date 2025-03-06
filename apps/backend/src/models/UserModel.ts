import { User } from "../schemas/UserSchema";
import type { IUser } from "../interfaces/IUser";
import { type Document, Types } from "mongoose";
import bcrypt from "bcrypt";

interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "customer";
  image?: string;
  address?: string;
  phone?: string;
  cpf: number;
  rg: number;
  purchases?: Types.ObjectId[];
  debts?: number;
  sales?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export class UserModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private convertToIUser(doc: UserDocument): IUser {
    const user = doc.toObject();
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      _id: doc._id.toString(),
      purchases: user.purchases?.map((id: Types.ObjectId) => id.toString()),
      comparePassword: doc.comparePassword.bind(doc),
      image: doc.image, // Garantir que a imagem seja incluída
    };
  }

  async create(userData: Omit<IUser, "comparePassword">): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new User({ ...userData, password: hashedPassword });
    const savedUser = (await user.save()) as unknown as UserDocument;
    return this.convertToIUser(savedUser);
  }

  async update(
    id: string,
    userData: Partial<Omit<IUser, "comparePassword">>
  ): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    if (Object.prototype.hasOwnProperty.call(userData, "image")) {
      if (userData.image === undefined) {
        await User.findByIdAndUpdate(id, { $unset: { image: "" } });
        userData.image = undefined;
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: userData },
      {
        new: true,
        runValidators: true,
      }
    ).exec();

    if (!user) return null;
    return this.convertToIUser(user as unknown as UserDocument);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = (await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).exec()) as UserDocument | null;

    return user ? this.convertToIUser(user) : null;
  }

  async findByCpf(cpf: string): Promise<IUser | null> {
    const sanitizedCpf = cpf.replace(/[^\d]/g, "");

    const user = (await User.findOne({
      cpf: sanitizedCpf,
    }).exec()) as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;
    const user = (await User.findById(id).exec()) as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async findAll(): Promise<IUser[]> {
    const users = (await User.find().exec()) as unknown as UserDocument[];
    return users.map((user) => this.convertToIUser(user));
  }

  async search(searchTerm: string): Promise<IUser[]> {
    // Criar uma expressão regular para busca case-insensitive
    const searchRegex = new RegExp(searchTerm, "i");

    // Buscar por vários campos
    const users = (await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { cpf: { $regex: searchTerm.replace(/\D/g, "") } }, // Busca por CPF removendo caracteres não numéricos
        { address: searchRegex },
        { phone: searchRegex },
      ],
    }).exec()) as unknown as UserDocument[];

    return users.map((user) => this.convertToIUser(user));
  }

  async findByRole(role: string): Promise<IUser[]> {
    const users = (await User.find({
      role,
    }).exec()) as unknown as UserDocument[];
    return users.map((user) => this.convertToIUser(user));
  }

  async delete(id: string): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;
    const user = (await User.findByIdAndDelete(
      id
    ).exec()) as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async checkPassword(id: string, password: string): Promise<boolean> {
    const user = await User.findById(id).exec();
    if (!user) return false;
    return user.comparePassword(password);
  }
}
