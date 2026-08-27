import Link from "next/link";
import { Package } from "lucide-react";
import LoginButton from "@/components/LoginButton";
import FormularioLogin from "@/components/auth/FormularioLogin";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-800 flex items-center justify-center mx-auto mb-5">
          <Package size={24} className="text-white" />
        </div>
        <h1 className="text-lg font-medium text-stone-900 mb-1">Controle de Insumos</h1>
        <p className="text-sm text-stone-500 mb-8">
          Entre pra gerenciar o estoque de insumos da sua loja.
        </p>

        <LoginButton />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400">ou</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <FormularioLogin />

        <p className="text-xs text-stone-500 mt-5">
          Ainda não tem senha cadastrada?{" "}
          <Link href="/cadastro" className="text-emerald-700 hover:underline">
            Criar conta com e-mail
          </Link>
        </p>
      </div>
    </div>
  );
}
