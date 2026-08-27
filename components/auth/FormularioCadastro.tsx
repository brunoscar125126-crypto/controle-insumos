"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { criarContaComSenha } from "@/app/cadastro/actions";

export default function FormularioCadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCriar() {
    if (!email.trim()) {
      setErro("Digite seu e-mail.");
      return;
    }
    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    const formData = new FormData();
    formData.set("nome", nome.trim());
    formData.set("email", email.trim());
    formData.set("senha", senha);

    setCriando(true);
    setErro("");
    try {
      await criarContaComSenha(formData);
      // sucesso navega sozinho (redirectTo dentro da Server Action)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a conta.");
      setCriando(false);
    }
  }

  return (
    <div className="space-y-3 text-left">
      <div>
        <label className="block text-xs text-stone-500 mb-1">Nome (opcional)</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>
      <div>
        <label className="block text-xs text-stone-500 mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>
      <div>
        <label className="block text-xs text-stone-500 mb-1">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Pelo menos 8 caracteres"
          className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>
      <div>
        <label className="block text-xs text-stone-500 mb-1">Confirmar senha</label>
        <input
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCriar()}
          placeholder="Repete a senha"
          className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={handleCriar}
        disabled={criando}
        className="w-full h-10 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {criando && <Loader2 size={15} className="animate-spin" />}
        {criando ? "Criando..." : "Criar conta"}
      </button>
    </div>
  );
}
