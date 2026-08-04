import bcrypt from "bcrypt";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { jwtUtil } from "../../utils/jwt.util.js";
import { authRepository } from "./auth.repository.js";

// Business logic for authentication. Controllers call these functions and
// never touch bcrypt, JWT, or the repository directly.

function sanitizeUser(user) {
  // Never send passwordHash to the client.
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function issueToken(user) {
  return jwtUtil.sign({ sub: user.id, email: user.email });
}

export const authService = {
  register: async ({ fullName, email, password }) => {
    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const user = await authRepository.create({ fullName, email, passwordHash });

    const token = issueToken(user);
    return { user: sanitizeUser(user), token };
  },

  login: async ({ email, password }) => {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = issueToken(user);
    return { user: sanitizeUser(user), token };
  },

  getProfile: async (userId) => {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }
    return { user: sanitizeUser(user) };
  },
};
