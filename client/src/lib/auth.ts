import { apiRequest } from "@/lib/queryClient";
import { type LoginRequest, type User } from "@shared/schema";

interface AuthResponse {
  user: User;
  entity: any;
}

let currentUser: AuthResponse | null = null;

export const auth = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data = await response.json();
    currentUser = data;
    localStorage.setItem("franchise_user", JSON.stringify(data));
    return data;
  },

  logout(): void {
    currentUser = null;
    localStorage.removeItem("franchise_user");
  },

  getCurrentUser(): AuthResponse | null {
    if (currentUser) return currentUser;
    
    const stored = localStorage.getItem("franchise_user");
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        return currentUser;
      } catch {
        localStorage.removeItem("franchise_user");
      }
    }
    
    return null;
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.user.role === role;
  },
};
