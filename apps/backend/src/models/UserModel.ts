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
  role: "admin" | "employee" | "customer" | "institution";
  image?: string;
  address?: string;
  phone?: string;
  cpf?: number;
  cnpj?: number;
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

  async findByCnpj(cnpj: string): Promise<IUser | null> {
    const sanitizedCnpj = cnpj.replace(/[^\d]/g, "");
  
    const user = (await User.findOne({
      cnpj: sanitizedCnpj,
    }).exec()) as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    if (!this.isValidId(id)) return null;
    const user = (await User.findById(id).exec()) as UserDocument | null;
    return user ? this.convertToIUser(user) : null;
  }

  async findAll(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {}
  ): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    
    let query: any = {};
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { address: searchRegex }
      ];
      
      // Adicionar busca por CPF se o termo parece ser um CPF (só números)
      if (/^\d+$/.test(filters.search)) {
        query.$or.push({ cpf: { $regex: filters.search } });
      }
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      User.countDocuments(query)
    ]);
    
    return {
      users: users.map(user => this.convertToIUser(user as unknown as UserDocument)),
      total
    };
  }

  async search(searchTerm: string, paginationOptions: { page: number, limit: number }): Promise<IUser[]> {
    const sanitizedTerm = searchTerm.trim().toLowerCase();
    
    const searchRegex = new RegExp(sanitizedTerm, "i");
  
    const query: any = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { cpf: { $regex: sanitizedTerm } },
        { address: searchRegex },
        { phone: searchRegex }
      ]
    };
  
    const users = await User.find(query)
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit)
      .exec() as unknown as UserDocument[];
  
    return users.map((user) => this.convertToIUser(user));
  }

  async findByRole(role: string, paginationOptions: { page: number, limit: number }): Promise<IUser[]> {
    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    const limit = paginationOptions.limit;
  
    const users = await User.find({ role })
      .skip(skip)
      .limit(limit)
      .exec() as unknown as UserDocument[];
  
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
