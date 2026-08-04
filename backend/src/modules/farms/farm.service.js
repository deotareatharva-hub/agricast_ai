import { ApiError } from "../../utils/ApiError.js";
import { farmRepository } from "./farm.repository.js";

function duplicateNameError() {
  return ApiError.conflict("You already have a farm with this name");
}

// Business logic for farm management. Controllers call these functions and
// never touch the repository or Drizzle directly. Every method takes the
// authenticated userId as its first argument so ownership is enforced at
// this layer, not left to the caller.
export const farmService = {
  createFarm: async (userId, payload) => {
    const existing = await farmRepository.findByNameForUser(
      userId,
      payload.farmName
    );
    if (existing) {
      throw duplicateNameError();
    }

    const farm = await farmRepository.create({ userId, ...payload });
    return { farm };
  },

  listFarms: async (userId, filters) => {
    const list = await farmRepository.findAllByUser(userId, filters);
    return { farms: list, count: list.length };
  },

  getFarm: async (userId, id) => {
    const farm = await farmRepository.findByIdForUser(id, userId);
    if (!farm) {
      throw ApiError.notFound("Farm not found");
    }
    return { farm };
  },

  updateFarm: async (userId, id, payload) => {
    const existingFarm = await farmRepository.findByIdForUser(id, userId);
    if (!existingFarm) {
      throw ApiError.notFound("Farm not found");
    }

    if (payload.farmName && payload.farmName !== existingFarm.farmName) {
      const duplicate = await farmRepository.findByNameForUser(
        userId,
        payload.farmName,
        id
      );
      if (duplicate) {
        throw duplicateNameError();
      }
    }

    const farm = await farmRepository.update(id, userId, payload);
    return { farm };
  },

  deleteFarm: async (userId, id) => {
    const existingFarm = await farmRepository.findByIdForUser(id, userId);
    if (!existingFarm) {
      throw ApiError.notFound("Farm not found");
    }

    await farmRepository.softDelete(id, userId);
    return { id };
  },
};
