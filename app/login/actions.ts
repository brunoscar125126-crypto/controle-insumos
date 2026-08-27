"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function entrarComSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) throw new Error("Preencha e-mail e senha.");

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    // signIn() com sucesso também "lança" internamente (é assim que o
    // redirect do Next funciona) — só trata como erro de verdade quando é
    // o AuthError do Auth.js; qualquer outra coisa (o redirect) precisa
    // continuar subindo, senão o login nunca navega pra lugar nenhum.
    if (error instanceof AuthError) {
      throw new Error("E-mail ou senha incorretos.");
    }
    throw error;
  }
}
