import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@libs/infrastructure';
import type { UserAccount } from '../../domain/entities/user-account.entity';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.interface';

const SELECT_ACTIVE = `
SELECT u.id, u.correo AS email, u.contrasena AS password_hash,
       r.id AS role_id, r.nombre AS role_name,
       trim(p.nombre || ' ' || p.apellidos) AS full_name
FROM usuario u
JOIN persona p ON p.id = u.id_persona
JOIN rol r ON r.id = u.id_rol
WHERE NOT u.borrado AND NOT p.borrado AND NOT r.borrado`;

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role_id: string;
  role_name: string;
  full_name: string;
}

/** Reads accounts from the cafeteria's `usuario`, `persona` and `rol` tables. */
@Injectable()
export class UserPostgresRepository implements IUserRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<UserAccount | null> {
    const { rows } = await this.pool.query<UserRow>(`${SELECT_ACTIVE} AND lower(u.correo) = lower($1)`, [email]);
    return rows[0] ? toAccount(rows[0]) : null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const { rows } = await this.pool.query<UserRow>(`${SELECT_ACTIVE} AND u.id = $1::uuid`, [id]);
    return rows[0] ? toAccount(rows[0]) : null;
  }
}

function toAccount(row: UserRow): UserAccount {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    roleId: row.role_id,
    roleName: row.role_name,
    passwordHash: row.password_hash,
  };
}
