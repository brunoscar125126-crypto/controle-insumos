import Link from "next/link";
import { Store } from "lucide-react";
import FormularioCadastro from "@/components/auth/FormularioCadastro";

export default function CadastroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center mx-auto mb-5">
          <Store size={20} className="text-white" />
        </div>
        <h1 className="text-lg font-medium text-stone-900 mb-1 text-center">Criar conta</h1>
        <p className="text-sm text-stone-500 mb-6 text-center">
          Pra entrar com e-mail e senha, sem depender do Google.
        </p>

        <FormularioCadastro />

        <p className="text-xs text-stone-500 mt-5 text-center">
          Já tem conta?{" "}
          <Link href="/login" className="text-emerald-700 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
