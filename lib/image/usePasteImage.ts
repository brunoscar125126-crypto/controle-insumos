"use client";

import { useEffect, useRef } from "react";

/**
 * Escuta Ctrl+V na página inteira e chama `onImagem` quando o que foi
 * colado é uma imagem. Passe `ativo=false` quando o formulário/modal que
 * usa isso não estiver visível, pra não capturar paste de outro lugar.
 */
export function usePasteImage(onImagem: (arquivo: File) => void, ativo = true) {
  // Ref pra sempre chamar a versão mais recente do callback sem precisar
  // recriar o listener a cada render (o caller não precisa memoizar nada).
  // Atualizada num efeito (não durante o render) pra não mexer num ref fora
  // de evento/efeito.
  const callbackRef = useRef(onImagem);
  useEffect(() => {
    callbackRef.current = onImagem;
  });

  useEffect(() => {
    if (!ativo) return;

    function handlePaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (!item) return;
      const arquivo = item.getAsFile();
      if (!arquivo) return;
      e.preventDefault();
      callbackRef.current(arquivo);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [ativo]);
}
