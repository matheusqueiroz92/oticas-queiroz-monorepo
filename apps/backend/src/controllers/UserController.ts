import type { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { OrderService } from "../services/OrderService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import type { IUser } from "../interfaces/IUser";
import {
  ValidationError,
  AuthError,
  PermissionError,
  NotFoundError,
} from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";
import { userSchema, UserType } from "../validators/userValidators";

interface AuthRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
}

export class UserController {
  private userService: UserService;
  private orderService: OrderService;

  constructor() {
    this.userService = new UserService();
    this.orderService = new OrderService();
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {    
    try {
      const { role, search, cpf, serviceOrder } = req.query;
      
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
  

  
      let result: { users: IUser[]; total: number } = { users: [], total: 0 };
  
      // Detecta se há filtros avançados (excluindo role e search)
      const hasAdvancedFilters =
        req.query.purchaseRange ||
        req.query.salesRange ||
        req.query.totalSalesRange ||
        req.query.startDate ||
        req.query.endDate ||
        req.query.hasDebts;

      // Se há busca (search) ou filtros avançados, usar getAllUsers com filtros
      if (search || hasAdvancedFilters) {
        // Repassa todos os filtros para o service
        const filters = { ...req.query };
        
        // Garantir que o filtro de role seja aplicado
        if (role && !filters.role) {
          filters.role = role;
        }
        // Converter 'search' para 'searchTerm' para busca textual
        if (filters.search) {
          filters.searchTerm = filters.search;
          delete filters.search;
        }
        
        result = await this.userService.getAllUsers(page, limit, filters);
      }
      else if (serviceOrder) {
        const cleanServiceOrder = (serviceOrder as string).replace(/\D/g, '');
        if (cleanServiceOrder.length >= 4 && cleanServiceOrder.length <= 7) {
          const clientIds = await this.orderService.getClientsByServiceOrder(cleanServiceOrder);
          
          if (clientIds.length > 0) {
            const userPromises = clientIds.map(id => this.userService.getUserById(id));
            const users = await Promise.all(userPromises);
            result = { users, total: users.length };
          }
        } else {
          throw new ValidationError(
            "Número de OS inválido. Deve ter entre 4 e 7 dígitos.",
            ErrorCode.VALIDATION_ERROR
          );
        }
      }
      else if (cpf) {
        try {
          const user = await this.userService.getUserByCpf(cpf as string);
          result = { users: user ? [user] : [], total: user ? 1 : 0 };
        } catch (error) {
          if (error instanceof NotFoundError) {
            result = { users: [], total: 0 };
          } else {
            throw error;
          }
        }
      }

      else if (role) {
        // Verificar se role contém múltiplos valores (separados por vírgula)
        if (typeof role === 'string' && role.includes(',')) {
          const roles = role.split(',').map(r => r.trim());
          // Buscar usuários com qualquer um dos roles especificados
          const allUsers = await Promise.all(
            roles.map(r => this.userService.getUsersByRole(r, page, limit))
          );
          // Combinar resultados
          const combinedUsers = allUsers.flatMap(result => result.users);
          const total = allUsers.reduce((sum, result) => sum + result.total, 0);
          result = { users: combinedUsers, total };
        } else {
          result = await this.userService.getUsersByRole(role as string, page, limit);
        }
      }
      else {
        result = await this.userService.getAllUsers(page, limit);
      }
    
      if (serviceOrder && role === 'customer') {
        const filteredUsers = result.users.filter(user => user.role === 'customer');
        result = { users: filteredUsers, total: filteredUsers.length };
      }
    

    
      res.status(200).json({
        users: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ message: error.message });
        return;
      }
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const user = await this.userService.getUserById(req.params.id);
    
    // Remover senha da resposta
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  }

  async getUserByCpf(req: Request, res: Response): Promise<void> {
    const { cpf } = req.params;

    if (!cpf) {
      throw new ValidationError("CPF é obrigatório", ErrorCode.INVALID_CPF);
    }

    const user = await this.userService.getUserByCpf(cpf);
    res.status(200).json(user);
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    let userData: UserType;
    try {
      // Processar os dados do formulário multipart
      const processedBody = { ...req.body };
      
      // Transformar campos JSON stringificados de volta para objetos
      if (processedBody.purchases && typeof processedBody.purchases === 'string') {
        try {
          processedBody.purchases = JSON.parse(processedBody.purchases);
        } catch {
          // Se não conseguir fazer parse, manter como string para validação do Zod
        }
      }
      
      if (processedBody.sales && typeof processedBody.sales === 'string') {
        try {
          processedBody.sales = JSON.parse(processedBody.sales);
        } catch {
          // Se não conseguir fazer parse, manter como string para validação do Zod
        }
      }
      
      userData = userSchema.parse(processedBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Dados inválidos",
          ErrorCode.VALIDATION_ERROR,
          error.errors
        );
      }
      throw error;
    }

    if (req.file) {
      userData = {
        ...userData,
        image: `/images/users/${req.file.filename}`,
      };
    }

    if (req.user?.role === "employee" && userData.role) {
      throw new PermissionError(
        "Funcionários não podem alterar 'roles'",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    const targetUser = await this.userService.getUserById(req.params.id);
    if (req.user?.role === "employee" && targetUser.role !== "customer") {
      throw new PermissionError(
        "Funcionários só podem atualizar dados de clientes",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // O UserService já faz suas próprias validações e lança erros específicos
    // como "CPF já cadastrado", então não precisamos capturar aqui
    const user = await this.userService.updateUser(req.params.id, userData);
    res.status(200).json(user);
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    await this.userService.deleteUser(req.params.id);
    res.status(204).send();
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    const user = await this.userService.getUserById(req.user.id);

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    let validatedData: UserType;
    try {
      validatedData = userSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Dados inválidos",
          ErrorCode.VALIDATION_ERROR,
          error.errors
        );
      }
      throw error;
    }

    const userData = {
      ...validatedData,
      image: req.file
        ? `/images/users/${req.file.filename}`
        : validatedData.image,
    };

    const updatedUser = await this.userService.updateProfile(
      req.user.id,
      userData
    );
    res.status(200).json(updatedUser);
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError(
        "Senha atual e nova senha são obrigatórias",
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (newPassword.length < 6) {
      throw new ValidationError(
        "A nova senha deve ter pelo menos 6 caracteres",
        ErrorCode.INVALID_PASSWORD
      );
    }

    const isPasswordValid = await this.userService.verifyPassword(
      req.user.id,
      currentPassword
    );

    if (!isPasswordValid) {
      throw new ValidationError(
        "Senha atual incorreta",
        ErrorCode.INVALID_PASSWORD
      );
    }

    await this.userService.updatePassword(req.user.id, newPassword);

    res.status(200).json({ message: "Senha alterada com sucesso" });
  }
}
