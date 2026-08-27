"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { entrarComSenha } from "@/app/login/actions";

export default function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleEntrar() {
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    const formData = new FormData();
    formData.set("email", email.trim());
    formData.set("password", senha);

    setEntrando(true);
    setErro("");
    try {
      await entrarComSenha(formData);
      // sucesso navega sozinho (redirectTo dentro da Server Action)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
      setEntrando(false);
    }
  }

  return (
    <div className="space-y-3 text-left">
      <div>
        <label className="block text-xs text-stone-500 mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEntrar()}
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
          onKeyDown={(e) => e.key === "Enter" && handleEntrar()}
          placeholder="••••••••"
          className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={handleEntrar}
        disabled={entrando}
        className="w-full h-10 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {entrando && <Loader2 size={15} className="animate-spin" />}
        {entrando ? "Entrando..." : "Entrar com e-mail e senha"}
      </button>
    </div>
  );
}
