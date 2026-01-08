import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

/**
 * Decorator pour extraire l'utilisateur authentifié depuis la requête
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 * ```
 *
 * @example Extraire uniquement l'ID
 * ```typescript
 * @Get('documents')
 * @UseGuards(JwtAuthGuard)
 * async getDocuments(@CurrentUser('id') userId: string) {
 *   return this.documentService.findByUserId(userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): AuthenticatedUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Si un champ spécifique est demandé (ex: @CurrentUser('id'))
    if (data) {
      return user[data];
    }

    // Sinon retourner l'objet user complet
    return user;
  },
);
