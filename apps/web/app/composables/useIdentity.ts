import { v4 as uuidv4 } from "uuid";

const TOKEN_KEY = "flips_machine_token";

export function useIdentity() {
  function getOrCreateToken(): string {
    let token: string|null = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = uuidv4();
      localStorage.setItem(TOKEN_KEY, token)
    }
    return token
  }

  return { 
    getOrCreateToken,
  }
}