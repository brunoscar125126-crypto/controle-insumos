"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import type { InsumoComCategoria, ListaCompras } from "@/lib/types";

interface Props {
  insumos: InsumoComCategoria[];
  listas: ListaCompras[];
  onFechar: () => void;
  onCriar: (formData: FormData) => Promise<void>;
  onRemover: (listaId: string) => Promise<void>;
}

function hoje() {
  const d = new Date();
  const semFuso = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return semFuso.toISOString().slice(0, 10);
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function ModalListasCompras({ insumos, listas, onFechar, onCriar, onRemover }: Props) {
  const [modo, setModo] = useState<"lista" | "nova">("lista");
  const [expandidaId, setExpandidaId] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [data, setData] = useState(hoje());
  const [selecionados, setSelecionados] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function alternarSelecionado(insumoId: string, marcado: boolean) {
    setSelecionados((prev) => {
      const novo = { ...prev };
      if (marcado) {
        novo[insumoId] = novo[insumoId] ?? "1";
      } else {
        delete novo[insumoId];
      }
      return novo;
    });
  }

  function abrirNovaLista() {
    const dataDeHoje = hoje();
    setNome(`Compras ${formatarData(dataDeHoje)}`);
    setData(dataDeHoje);
    setSelecionados({});
    setErro("");
    setModo("nova");
  }

  async function handleCriar() {
    const itens = Object.entries(selecionados)
      .map(([insumoId, quantidade]) => ({ insumoId, quantidade: Number(quantidade) }))
      .filter((i) => i.quantidade > 0);

    if (!nome.trim()) {
      setErro("Digite um nome pra lista.");
      return;
    }
    if (!data) {
      setErro("Escolha uma data.");
      return;
    }
    if (itens.length === 0) {
      setErro("Selecione ao menos um item e informe a quantidade.");
      return;
    }

    const formData = new FormData();
    formData.set("nome", nome.trim());
    formData.set("data", data);
    formData.set("itens", JSON.stringify(itens));

    setSalvando(true);
    setErro("");
    try {
      await onCriar(formData);
      setModo("lista");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra salvar a lista.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(listaId: string) {
    setRemovendoId(listaId);
    try {
      await onRemover(listaId);
      if (expandidaId === listaId) setExpandidaId(null);
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-stone-900">
            {modo === "nova" ? "Nova lista de compras" : "Listas de compras"}
          </h2>
          <button onClick={onFechar} aria-label="Fechar" className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        {modo === "lista" ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={abrirNovaLista}
              className="w-full h-9 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 flex items-center justify-center gap-1.5"
            >
              <Plus size={15} /> Nova lista
            </button>

            {listas.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-8">Nenhuma lista de compras ainda.</p>
            ) : (
              <div className="space-y-2">
                {listas.map((lista) => {
                  const expandida = expandidaId === lista.id;
                  return (
                    <div key={lista.id} className="rounded-lg border border-stone-200 overflow-hidden">
                      <div className="flex items-center gap-1 px-3 h-11">
                        <button
                          type="button"
                          onClick={() => setExpandidaId(expandida ? null : lista.id)}
                          className="flex-1 min-w-0 flex items-center gap-2 text-left"
                        >
                          {expandida ? (
                            <ChevronDown size={14} className="text-stone-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-stone-400 flex-shrink-0" />
                          )}
                          <span className="text-sm text-stone-900 truncate">{lista.nome}</span>
                          <span className="text-xs text-stone-400 flex-shrink-0 ml-auto">
                            {formatarData(lista.data)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemover(lista.id)}
                          disabled={removendoId === lista.id}
                          aria-label={`Excluir lista ${lista.nome}`}
                          className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-600 transition flex-shrink-0 disabled:opacity-60"
                        >
                          {removendoId === lista.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                      {expandida && (
                        <ul className="border-t border-stone-100 divide-y divide-stone-100">
                          {lista.itens.map((item) => (
                            <li key={item.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                              <span className="text-stone-700 truncate">{item.insumoNome}</span>
                              <span className="text-stone-500 flex-shrink-0 ml-2">
                                {item.quantidade} {item.unidade}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Nome da lista</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Compras da semana"
                className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">O que precisa comprar</label>
              {insumos.length === 0 ? (
                <p className="text-xs text-stone-400">Cadastre insumos primeiro pra poder montar uma lista.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto -mx-1 px-1">
                  {insumos.map((insumo) => {
                    const marcado = insumo.id in selecionados;
                    return (
                      <div
                        key={insumo.id}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 h-10 ${
                          marcado ? "border-emerald-300 bg-emerald-50" : "border-stone-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) => alternarSelecionado(insumo.id, e.target.checked)}
                          className="w-4 h-4 flex-shrink-0 accent-emerald-700"
                          aria-label={`Selecionar ${insumo.nome}`}
                        />
                        <span className="flex-1 min-w-0 text-sm text-stone-800 truncate">{insumo.nome}</span>
                        {marcado && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={selecionados[insumo.id]}
                              onChange={(e) =>
                                setSelecionados((prev) => ({ ...prev, [insumo.id]: e.target.value }))
                              }
                              aria-label={`Quantidade de ${insumo.nome} pra comprar`}
                              className="w-14 h-7 px-1.5 rounded border border-stone-300 text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                            <span className="text-xs text-stone-500 w-6">{insumo.unidade}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {erro && <p className="text-xs text-red-600">{erro}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModo("lista")}
                disabled={salvando}
                className="flex-1 h-9 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCriar}
                disabled={salvando}
                className="flex-1 h-9 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {salvando && <Loader2 size={14} className="animate-spin" />}
                {salvando ? "Salvando..." : "Salvar lista"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
