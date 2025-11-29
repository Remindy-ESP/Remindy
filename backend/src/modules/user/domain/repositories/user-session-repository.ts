export abstract class User_SessionRepository {
  abstract revokeAllForUser(userId: string): Promise<void>;
}