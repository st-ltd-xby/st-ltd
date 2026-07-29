import 'express';

declare module 'express-serve-static-core' {
  interface Params {
    [key: string]: string;
  }
}
