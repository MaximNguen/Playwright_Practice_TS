export type UserRole = 'admin' | 'manager' | 'employee';

export interface TestUser {
  readonly email: string;
  readonly role: UserRole;
}

export const ADMIN: TestUser = { email: 'admin@party.ru', role: 'admin' };
export const MANAGER: TestUser = { email: 'manager1@party.ru', role: 'manager' };
export const EMPLOYEE: TestUser = { email: 'emp1_1@party.ru', role: 'employee' };

export const ROLES: readonly TestUser[] = [
  ADMIN,
  MANAGER,
  { email: 'manager2@party.ru', role: 'manager' },
  { email: 'manager3@party.ru', role: 'manager' },
  EMPLOYEE,
];
