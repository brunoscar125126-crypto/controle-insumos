import { Package } from "lucide-react";
import LoginButton from "@/components/LoginButton";

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
      </div>
    </div>
  );
}
