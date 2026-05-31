import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type VaiTro = 'admin' | 'giaovien';

export const Roles = (...roles: VaiTro[]) => SetMetadata(ROLES_KEY, roles);
