import { useMemo } from "react";
import type { BrainstormLibrary } from "./types";

export type BrainstormSearchResult = {
  brainstormId: string;
  ideaId: string | null;
  label: string;
  context: string;
};

export function getTotalIdeaCount(library: BrainstormLibrary) {
  return library.brainstorms.reduce((count, brainstorm) => count + brainstorm.ideas.length, 0);
}

export function searchBrainstorms(
  library: BrainstormLibrary,
  searchQuery: string,
): BrainstormSearchResult[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return [];
  return library.brainstorms.flatMap((brainstorm) => {
    const titleMatch = brainstorm.title.toLowerCase().includes(query)
      ? [
          {
            brainstormId: brainstorm.id,
            ideaId: null,
            label: brainstorm.title,
            context: "Title",
          },
        ]
      : [];
    const ideaMatches = brainstorm.ideas
      .filter((idea) => idea.text.toLowerCase().includes(query))
      .slice(0, 8)
      .map((idea) => ({
        brainstormId: brainstorm.id,
        ideaId: idea.id,
        label: idea.text,
        context: brainstorm.title,
      }));
    return [...titleMatch, ...ideaMatches];
  });
}

export function useBrainstormSearch(library: BrainstormLibrary, searchQuery: string) {
  const totalIdeaCount = useMemo(() => getTotalIdeaCount(library), [library]);
  const searchResults = useMemo(
    () => searchBrainstorms(library, searchQuery),
    [library, searchQuery],
  );

  return { totalIdeaCount, searchResults };
}
