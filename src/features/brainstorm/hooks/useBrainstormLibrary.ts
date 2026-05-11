import { useCallback, useEffect, useMemo, useState } from "react";
import { EMPTY, EMPTY_LIBRARY } from "../constants";
import {
  createBrainstormDoc,
  loadBrainstormLibrary,
  nextAvailableBrainstormTitle,
  normalizeTitleValue,
  saveBrainstormLibrary,
} from "../storage";
import type { BrainstormLibrary, BrainstormState } from "../types";

type UseBrainstormLibraryOptions = {
  showNotice: (message: string) => void;
  onDocumentChange: () => void;
  onNewDocument: () => void;
};

export function useBrainstormLibrary({
  showNotice,
  onDocumentChange,
  onNewDocument,
}: UseBrainstormLibraryOptions) {
  const [library, setLibrary] = useState<BrainstormLibrary>(EMPTY_LIBRARY);
  const [hydrated, setHydrated] = useState(false);

  const state = useMemo(
    () =>
      library.brainstorms.find((brainstorm) => brainstorm.id === library.activeId) ??
      library.brainstorms[0] ??
      EMPTY_LIBRARY.brainstorms[0],
    [library],
  );

  const setState = useCallback(
    (update: BrainstormState | ((current: BrainstormState) => BrainstormState)) => {
      setLibrary((current) => {
        const activeDoc =
          current.brainstorms.find((brainstorm) => brainstorm.id === current.activeId) ??
          current.brainstorms[0] ??
          createBrainstormDoc();
        const nextState = typeof update === "function" ? update(activeDoc) : update;
        const nextDoc = {
          ...activeDoc,
          ...nextState,
          version: 3 as const,
          id: activeDoc.id,
          updatedAt: Date.now(),
        };
        const hasActive = current.brainstorms.some((brainstorm) => brainstorm.id === activeDoc.id);
        return {
          version: 4,
          activeId: activeDoc.id,
          brainstorms: hasActive
            ? current.brainstorms.map((brainstorm) =>
                brainstorm.id === activeDoc.id ? nextDoc : brainstorm,
              )
            : [...current.brainstorms, nextDoc],
        };
      });
    },
    [],
  );

  const activateBrainstorm = useCallback(
    (id: string) => {
      setLibrary((current) => ({
        ...current,
        activeId: current.brainstorms.some((brainstorm) => brainstorm.id === id)
          ? id
          : current.activeId,
      }));
      onDocumentChange();
    },
    [onDocumentChange],
  );

  const addBrainstormFromState = useCallback(
    (nextState: BrainstormState, message?: string) => {
      const doc = createBrainstormDoc(nextState);
      setLibrary((current) => ({
        version: 4,
        activeId: doc.id,
        brainstorms: [doc, ...current.brainstorms],
      }));
      onNewDocument();
      if (message) showNotice(message);
    },
    [onNewDocument, showNotice],
  );

  const createNewBrainstorm = useCallback(() => {
    setLibrary((current) => {
      const doc = createBrainstormDoc({
        ...EMPTY,
        title: nextAvailableBrainstormTitle(
          EMPTY.title,
          current.brainstorms.map((brainstorm) => brainstorm.title),
        ),
      });

      return {
        version: 4,
        activeId: doc.id,
        brainstorms: [doc, ...current.brainstorms],
      };
    });
    onNewDocument();
    showNotice("New brainstorm ready");
  }, [onNewDocument, showNotice]);

  const duplicateBrainstorm = useCallback(() => {
    addBrainstormFromState(
      {
        ...state,
        title: normalizeTitleValue(`${state.title || "Brainstorm"} copy`),
        ideas: state.ideas.map((idea) => ({ ...idea })),
      },
      "Brainstorm duplicated",
    );
  }, [addBrainstormFromState, state]);

  const deleteActiveBrainstorm = useCallback(() => {
    setLibrary((current) => {
      if (current.brainstorms.length <= 1) {
        const doc = createBrainstormDoc();
        return { version: 4, activeId: doc.id, brainstorms: [doc] };
      }
      const nextBrainstorms = current.brainstorms.filter(
        (brainstorm) => brainstorm.id !== current.activeId,
      );
      return {
        version: 4,
        activeId: nextBrainstorms[0].id,
        brainstorms: nextBrainstorms,
      };
    });
    onDocumentChange();
    showNotice("Brainstorm deleted");
  }, [onDocumentChange, showNotice]);

  const updateBrainstormMeta = useCallback(
    (id: string, meta: { emoji?: string; accent?: string }) => {
      setLibrary((current) => ({
        ...current,
        brainstorms: current.brainstorms.map((brainstorm) =>
          brainstorm.id === id
            ? { ...brainstorm, ...meta, updatedAt: Date.now() }
            : brainstorm,
        ),
      }));
    },
    [],
  );

  useEffect(() => {
    const loaded = loadBrainstormLibrary();
    setLibrary(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveBrainstormLibrary(library);
  }, [library, hydrated]);

  return {
    library,
    hydrated,
    state,
    setState,
    activateBrainstorm,
    addBrainstormFromState,
    createNewBrainstorm,
    duplicateBrainstorm,
    deleteActiveBrainstorm,
    updateBrainstormMeta,
  };
}
