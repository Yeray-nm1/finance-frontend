export interface User {
  id: string;
  email: string;
  /** Nombre opcional para los correos; si falta se usa la parte local del email. */
  name: string | null;
  createdAt: string;
}
