export interface SessionUser {
  id: string;
  fullName: string;
  roleId: string;
  roleName: string;
}

export interface SessionResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}
