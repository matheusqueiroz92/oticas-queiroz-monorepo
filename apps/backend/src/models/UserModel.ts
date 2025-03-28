import { User } from "../schemas/UserSchema";
import type { ICreateUserDTO, IUser } from "../interfaces/IUser";
import type mongoose from "mongoose";
import { type Document, Model, Types } from "mongoose";
import bcrypt from "bcrypt";

interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  password: string;
  role: "admin" | "employee" | "customer";
  image?: string;
  address?: string;
  phone?: string;
  cpf: number;
  rg?: number;
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
      image: doc.image,
    };
  }

  async create(updateData: ICreateUserDTO): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(updateData.password, 10);
    const user = new User({ ...updateData, password: hashedPassword });
    const savedUser = (await user.save()) as unknown as UserDocument;
    return this.convertToIUser(savedUser);
  }

  async update(
    id: string,
    updateData: Partial<IUser>,
    session?: mongoose.ClientSession
  ): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "image")) {
      if (updateData.image === undefined) {
        await User.findByIdAndUpdate(id, { $unset: { image: "" } });
        updateData.image = undefined;
      }
    }

    const options = {
      new: true,
      runValidators: true,
      ...(session ? { session } : {}),
    };

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      options
    ).exec();

    if (!user) return null;
    return this.convertToIUser(user as unknown as UserDocument);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    if (!email) return null;
    
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ 
        email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") }
    }).exec() as UserDocument | null;

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
    if (!searchTerm || searchTerm.trim() === "") {
      return this.findAll();
    }
  
    const sanitizedTerm = searchTerm.trim().toLowerCase();
    console.log(`Executando busca de usuários com termo: "${sanitizedTerm}"`);
  
    // Construir uma expressão regular para busca case-insensitive
    const searchRegex = new RegExp(sanitizedTerm, "i");
    
    // Verificar se o termo de busca é um CPF
    const isCpfSearch = /^\d+$/.test(sanitizedTerm);
    
    // Construir a query
    const query: any = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
      ]
    };
    
    // Adicionar busca por CPF se o termo parece ser um CPF (só números)
    if (isCpfSearch) {
      query.$or.push({ cpf: { $regex: sanitizedTerm } });
    }
    
    // Adicionar busca por outros campos relevantes
    query.$or.push({ address: searchRegex });
    query.$or.push({ phone: searchRegex });
  
    console.log("Query de busca construída:", JSON.stringify(query));
  
    const users = (await User.find(query).exec()) as unknown as UserDocument[];
    console.log(`Busca retornou ${users.length} usuários`);
  
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
