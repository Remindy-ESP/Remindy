import 'express';

declare module 'express' {
  interface User {
    userId: string;
  }

  interface Request {
    user?: User;
  }
}