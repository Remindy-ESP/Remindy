export abstract class UserRepository {
  abstract findById(id: string): Promise<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    timezone: string;
    language: string;
    photoR2Key: string | null;
  } | null>;

  abstract updateProfile(
    userId: string,
    data: Partial<{
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      timezone: string;
      language: string;
      photoR2Key: string | null;
    }>,
  ): Promise<void>;

  abstract softDelete(userId: string): Promise<void>;
}
