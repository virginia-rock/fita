export type AuthErrors = {
  email: string;
  password: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(email: string, password: string): AuthErrors {
  return {
    email: EMAIL_PATTERN.test(email.trim()) ? "" : "Informe um e-mail válido.",
    password: password.length >= 8 ? "" : "A senha precisa ter pelo menos 8 caracteres.",
  };
}

export function validateSignup(email: string, password: string, confirmPassword: string): AuthErrors {
  return {
    ...validateLogin(email, password),
    confirmPassword:
      password === confirmPassword ? "" : "As senhas precisam ser iguais.",
  };
}

export function hasAuthErrors(errors: AuthErrors) {
  return Object.values(errors).some(Boolean);
}
