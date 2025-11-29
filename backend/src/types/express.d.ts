import 'express';

declare module 'express' {
  interface User {
    id: string;
  }

  interface Request {
    user?: User;
  }
}