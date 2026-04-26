export abstract class AbstractUserSessionRepository {
  abstract revokeAllForUser(userId: string): Promise<void>;
}
