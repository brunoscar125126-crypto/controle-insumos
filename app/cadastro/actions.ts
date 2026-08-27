"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function criarContaComSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const nome = String(formData.get("nome") ?? "").trim() || null;

  if (!EMAIL_REGEX.test(email)) throw new Error("Digite um e-mail válido.");
  if (senha.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");

  const existente = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existente) {
    // De propósito NÃO deixa "assumir" uma conta existente só por digitar
    // o e-mail dela aqui — isso seria um jeito fácil de sequestrar a conta
    // (e a loja) de outra pessoa só sabendo o e-mail. Quem já tem conta
    // (ex: criada via Google) define a senha logado, em Perfil > Senha de
    // acesso — aí sim é seguro, porque só quem já provou dono da conta
    // consegue mexer nela.
    throw new Error(
      "Já existe uma conta com esse e-mail. Entre com o Google e defina uma senha em Perfil > Senha de acesso."
    );
  }

  const hash = await bcrypt.hash(senha, 10);
  await prisma.user.create({ data: { email, password: hash, name: nome } });

  try {
    await signIn("credentials", { email, password: senha, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error("Conta criada, mas não deu pra entrar automaticamente. Tenta fazer login.");
    }
    throw error;
  }
}
