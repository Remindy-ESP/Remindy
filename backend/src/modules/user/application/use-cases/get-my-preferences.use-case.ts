import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPreferencesRepository } from "../../infrastructure/repositories/user-preferences.repository";


@Injectable()
export class GetMyPreferencesUseCase {
  constructor(
    private readonly preferencesRepo: UserPreferencesRepository,
  ) {}

  async execute(userId: string) {
    const prefs = await this.preferencesRepo.findByUserId(userId);

    if (!prefs) {
      throw new NotFoundException('User preferences not found');
    }

    return prefs;
  }
}