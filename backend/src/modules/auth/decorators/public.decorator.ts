import { SetMetadata } from '@nestjs/common';

/**
 * Decorator pour marquer une route comme publique (pas d'authentification requise)
 *
 * @example
 * ```typescript
 * @Post('login')
 * @Public()
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);
