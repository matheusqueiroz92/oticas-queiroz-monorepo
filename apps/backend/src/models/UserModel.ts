import { User } from "../schemas/UserSchema";
import type { IUser } from "../interfaces/IUser";
import { type Document, Types } from "mongoose";
import bcrypt from "bcrypt";

interface UserDocument extends Omit<Document, "_id"> {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "customer";
  address?: string;
  phone?: string;
  prescription?: {
    leftEye: number;
    rightEye: number;
    addition?: number;
  };
  purchases?: Types.ObjectId[];
  debts?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export class UserModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(userData: Omit<IUser, "comparePassword">): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new User({ ...userData, password: hashedPassword });
    const savedUser = (await user.save()) as unknown as UserDocument;
    return this.convertToIUser(savedUser);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = (await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    })) as unknown as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;
    const user = (await User.findById(id)) as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async findAll(): Promise<IUser[]> {
    const users = (await User.find()) as UserDocument[];
    return users.map((user) => this.convertToIUser(user));
  }

  async update(
    id: string,
    userData: Partial<Omit<IUser, "comparePassword">>
  ): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = (await User.findByIdAndUpdate(
      id,
      { $set: userData },
      {
        new: true,
        runValidators: true,
      }
    )) as UserDocument | null;

    return user ? this.convertToIUser(user) : null;
  }

  async delete(id: string): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;

    const user = (await User.findByIdAndDelete(id)) as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async checkPassword(id: string, password: string): Promise<boolean> {
    const user = await User.findById(id);
    if (!user) return false;
    return user.comparePassword(password);
  }

  private convertToIUser(doc: UserDocument): IUser {
    const user = doc.toObject();
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      _id: doc._id.toString(),
      purchases: doc.purchases?.map((id) => id.toString()),
      comparePassword: doc.comparePassword.bind(doc),
    };
  }
}
