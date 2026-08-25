"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LogOut, Package, Plus, Search, Settings2, ShoppingCart, Store } from "lucide-react";
import SortableCardInsumo from "./SortableCardInsumo";
import ModalInsumo from "./ModalInsumo";
import ModalPerfil from "@/components/perfil/ModalPerfil";
import ModalCategorias from "@/components/categorias/ModalCategorias";
import ModalListasCompras from "@/components/listas/ModalListasCompras";
import {
  alterarQuantidade,
  atualizarInsumo,
  criarInsumo,
  removerInsumo,
  reordenarInsumos,
} from "@/app/(app)/insumos/actions";
import { atualizarCores, removerCategoria } from "@/app/(app)/actions";
import { criarListaCompras, removerListaCompras } from "@/app/(app)/listas-compras/actions";
import type { Categoria, InsumoComCategoria, ListaCompras } from "@/lib/types";

interface Estabelecimento {
  id: string;
  nome: string;
  logoUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
}

interface Props {
  estabelecimento: Estabelecimento;
  categoriasIniciais: Categoria[];
  insumosIniciais: InsumoComCategoria[];
  listasComprasIniciais: ListaCompras[];
}

function LogoOuIniciais({ estabelecimento }: { estabelecimento: Estabelecimento }) {
  if (estabelecimento.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={estabelecimento.logoUrl}
        alt={estabelecimento.nome}
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white"
      />
    );
  }
  const iniciais = estabelecimento.nome
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center font-medium text-sm flex-shrink-0">
      {iniciais || <Store size={18} />}
    </div>
  );
}

export default function TelaControleInsumos({
  estabelecimento,
  categoriasIniciais,
  insumosIniciais,
  listasComprasIniciais,
}: Props) {
  const router = useRouter();

  // Espelha as props vindas do servidor em state local, pra permitir updates
  // otimistas (quantidade, remoção, reordenar) sem esperar o round-trip.
  // Sempre que o Server Component reenvia props novas (após
  // router.refresh()), o state local é resincronizado — ajustado durante a
  // renderização, e não em um efeito, seguindo o padrão recomendado pelo
  // React pra "resetar state quando uma prop muda" (evita o render em
  // cascata de um useEffect).
  const [categoriasPropsAnteriores, setCategoriasPropsAnteriores] = useState(categoriasIniciais);
  const [categorias, setCategorias] = useState(categoriasIniciais);
  if (categoriasIniciais !== categoriasPropsAnteriores) {
    setCategoriasPropsAnteriores(categoriasIniciais);
    setCategorias(categoriasIniciais);
  }

  const [insumosPropsAnteriores, setInsumosPropsAnteriores] = useState(insumosIniciais);
  const [insumos, setInsumos] = useState(insumosIniciais);
  if (insumosIniciais !== insumosPropsAnteriores) {
    setInsumosPropsAnteriores(insumosIniciais);
    setInsumos(insumosIniciais);
  }

  const [listasComprasPropsAnteriores, setListasComprasPropsAnteriores] = useState(listasComprasIniciais);
  const [listasCompras, setListasCompras] = useState(listasComprasIniciais);
  if (listasComprasIniciais !== listasComprasPropsAnteriores) {
    setListasComprasPropsAnteriores(listasComprasIniciais);
    setListasCompras(listasComprasIniciais);
  }

  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState<InsumoComCategoria | null>(null);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [categoriasAberto, setCategoriasAberto] = useState(false);
  const [listasComprasAberto, setListasComprasAberto] = useState(false);

  // Arrastar pra reordenar só faz sentido (e só reflete uma ordem global
  // sem ambiguidade) quando a lista completa está sendo exibida — sem
  // busca nem filtro de categoria ativos.
  const arrastavelHabilitado = busca === "" && categoriaAtiva === "Todos";

  const insumosFiltrados = insumos.filter((i) => {
    const bateBusca = i.nome.toLowerCase().includes(busca.toLowerCase());
    const bateCategoria = categoriaAtiva === "Todos" || i.categoriaNome === categoriaAtiva;
    return bateBusca && bateCategoria;
  });

  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setInsumos((prev) => {
      const indiceAntigo = prev.findIndex((i) => i.id === active.id);
      const indiceNovo = prev.findIndex((i) => i.id === over.id);
      if (indiceAntigo === -1 || indiceNovo === -1) return prev;

      const reordenados = arrayMove(prev, indiceAntigo, indiceNovo);
      reordenarInsumos(reordenados.map((i) => i.id)).catch(() => router.refresh());
      return reordenados;
    });
  }

  async function handleAlterarQuantidade(id: string, delta: number) {
    setInsumos((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i))
    );
    try {
      await alterarQuantidade(id, delta);
    } catch {
      router.refresh(); // reconcilia com o servidor se a ação falhar
    }
  }

  async function handleRemover(id: string) {
    const anterior = insumos;
    setInsumos((prev) => prev.filter((i) => i.id !== id));
    try {
      await removerInsumo(id);
    } catch {
      setInsumos(anterior);
    }
  }

  async function handleSalvarNovoInsumo(formData: FormData) {
    await criarInsumo(formData);
    setModalAberto(false);
    router.refresh();
  }

  async function handleSalvarEdicao(formData: FormData) {
    if (!insumoEditando) return;
    await atualizarInsumo(insumoEditando.id, formData);
    setInsumoEditando(null);
    router.refresh();
  }

  async function handleSalvarCores(formData: FormData) {
    await atualizarCores(formData);
    setPerfilAberto(false);
    router.refresh();
  }

  async function handleRemoverCategoria(categoriaId: string) {
    await removerCategoria(categoriaId);
    router.refresh();
  }

  async function handleCriarListaCompras(formData: FormData) {
    // Sem router.refresh() de propósito: a lista criada já volta pronta da
    // Server Action, e o modal muda de modo ("nova" -> "lista") logo em
    // seguida — se essas duas coisas acontecessem juntas (refresh do
    // Router + o modal trocando de estado), o React reclamava de "setState
    // num componente enquanto outro renderiza".
    const novaLista = await criarListaCompras(formData);
    setListasCompras((prev) => [novaLista, ...prev]);
  }

  async function handleRemoverListaCompras(listaId: string) {
    const anterior = listasCompras;
    setListasCompras((prev) => prev.filter((l) => l.id !== listaId));
    try {
      await removerListaCompras(listaId);
    } catch (e) {
      setListasCompras(anterior);
      throw e;
    }
  }

  const totalCritico = insumos.filter((i) => i.quantidade <= 3).length;
  const nomesCategorias = categorias.map((c) => c.nome);

  return (
    <div className="max-w-sm mx-auto bg-stone-50 min-h-screen relative">
      <div className="px-4 pt-4 pb-6" style={{ backgroundColor: "var(--cor-primaria)" }}>
        <div className="flex items-center justify-between gap-2.5 mb-4">
          <button
            onClick={() => setPerfilAberto(true)}
            aria-label="Perfil do estabelecimento — editar cores do app"
            title="Perfil"
            className="flex items-center gap-2.5 min-w-0 rounded-lg hover:bg-white/10 transition p-1 -m-1"
          >
            <LogoOuIniciais estabelecimento={estabelecimento} />
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{estabelecimento.nome}</p>
              <p className="text-xs text-white/70">Controle de insumos</p>
            </div>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sair"
            title="Sair"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition flex-shrink-0"
          >
            <LogOut size={17} />
          </button>
        </div>
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-white/70 mb-0.5">Insumos cadastrados</p>
            <p className="text-xl font-medium text-white">{insumos.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70 mb-0.5">Estoque baixo</p>
            <p className="text-xl font-medium text-white">{totalCritico}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 h-9 mb-3">
          <Search size={15} className="text-stone-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar insumos..."
            className="flex-1 text-sm outline-none placeholder:text-stone-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {["Todos", ...nomesCategorias].map((c) => {
            const ativa = categoriaAtiva === c;
            return (
              <button
                key={c}
                onClick={() => setCategoriaAtiva(c)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                  ativa ? "text-white" : "border-stone-300 text-stone-600 hover:bg-stone-100"
                }`}
                style={ativa ? { backgroundColor: "var(--cor-primaria)", borderColor: "var(--cor-primaria)" } : undefined}
              >
                {c}
              </button>
            );
          })}
          <button
            onClick={() => setCategoriasAberto(true)}
            aria-label="Gerenciar categorias"
            title="Gerenciar categorias"
            className="flex-shrink-0 w-7 h-7 rounded-full border border-stone-300 text-stone-500 hover:bg-stone-100 flex items-center justify-center"
          >
            <Settings2 size={13} />
          </button>
        </div>
        {!arrastavelHabilitado && insumos.length > 1 && (
          <p className="text-[11px] text-stone-400 mt-1.5">
            Limpa a busca e escolha &quot;Todos&quot; pra poder arrastar e reordenar.
          </p>
        )}
      </div>

      <div className="px-4 py-3 space-y-2 pb-24">
        {insumosFiltrados.length === 0 && insumos.length > 0 && (
          <p className="text-sm text-stone-500 text-center py-10">Nenhum insumo encontrado.</p>
        )}

        {insumos.length === 0 && (
          <div className="flex flex-col items-center text-center pt-12">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--cor-primaria)" }}
            >
              <Package size={24} className="text-white" />
            </div>
            <p className="text-base font-medium text-stone-900 mb-1">Comece seu estoque</p>
            <p className="text-sm text-stone-500 mb-5 max-w-[240px]">
              Adicione seu primeiro insumo para começar a controlar o estoque da loja.
            </p>
            <button
              onClick={() => setModalAberto(true)}
              className="text-white text-sm px-4 h-9 rounded-lg flex items-center gap-1.5"
              style={{ backgroundColor: "var(--cor-primaria)" }}
            >
              <Plus size={15} /> Adicionar insumo
            </button>
          </div>
        )}

        {/* id fixo: sem isso, o dnd-kit gera um aria-describedby com contador
            incremental que diverge entre o HTML do servidor e o do client
            (o client já tinha renderizado esse DndContext antes por causa de
            navegação/refresh), disparando erro de hydration mismatch. */}
        <DndContext
          id="lista-insumos"
          sensors={sensores}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={insumosFiltrados.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {insumosFiltrados.map((insumo) => (
              <SortableCardInsumo
                key={insumo.id}
                insumo={insumo}
                arrastavel={arrastavelHabilitado}
                onEditar={setInsumoEditando}
                onAlterarQuantidade={handleAlterarQuantidade}
                onRemover={handleRemover}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {insumos.length > 0 && (
        <div className="fixed bottom-6 right-1/2 translate-x-[152px] sm:translate-x-0 sm:absolute flex items-center gap-3">
          <button
            onClick={() => setListasComprasAberto(true)}
            aria-label="Lista de compras"
            title="Lista de compras"
            className="w-11 h-11 rounded-full bg-white border border-stone-200 text-stone-700 flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <ShoppingCart size={19} />
          </button>
          <button
            onClick={() => setModalAberto(true)}
            aria-label="Adicionar insumo"
            className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 transition"
            style={{ backgroundColor: "var(--cor-primaria)" }}
          >
            <Plus size={22} />
          </button>
        </div>
      )}

      {modalAberto && (
        <ModalInsumo
          categorias={categorias}
          onFechar={() => setModalAberto(false)}
          onSalvar={handleSalvarNovoInsumo}
        />
      )}

      {insumoEditando && (
        <ModalInsumo
          categorias={categorias}
          insumoParaEditar={insumoEditando}
          onFechar={() => setInsumoEditando(null)}
          onSalvar={handleSalvarEdicao}
        />
      )}

      {perfilAberto && (
        <ModalPerfil
          corPrimariaAtual={estabelecimento.corPrimaria}
          corSecundariaAtual={estabelecimento.corSecundaria}
          onFechar={() => setPerfilAberto(false)}
          onSalvar={handleSalvarCores}
        />
      )}

      {categoriasAberto && (
        <ModalCategorias
          categorias={categorias}
          onFechar={() => setCategoriasAberto(false)}
          onRemover={handleRemoverCategoria}
        />
      )}

      {listasComprasAberto && (
        <ModalListasCompras
          insumos={insumos}
          listas={listasCompras}
          onFechar={() => setListasComprasAberto(false)}
          onCriar={handleCriarListaCompras}
          onRemover={handleRemoverListaCompras}
        />
      )}
    </div>
  );
}
