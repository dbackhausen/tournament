import { Role } from './role.model';

export interface User {
  id: number;
  gender: string;
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  birthdate?: string | null;
  roles: Role[];
  performanceClass: number;
  active: boolean;
}
