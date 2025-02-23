import { User } from "../schemas/UserSchema";
import { type Document, Types } from "mongoose";
import type { IUser } from "../interfaces/IUser";

interface UserDocument extends Omit<Document, "_id"> {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "customer";
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export class AuthModel {
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return (await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    })) as unknown as UserDocument | null;
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return (await User.findById(id)) as unknown as UserDocument | null;
  }

  async verifyPassword(user: UserDocument, password: string): Promise<boolean> {
    return await user.comparePassword(password);
  }

  convertToIUser(doc: UserDocument): IUser {
    const user = doc.toObject();
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      _id: doc._id.toString(),
      comparePassword: doc.comparePassword.bind(doc),
      image: user.image, // Garantir que a imagem seja incluída
    };
  }
}
