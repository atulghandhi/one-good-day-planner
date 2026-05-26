export type ShapeKey = "pill" | "boxy" | "blob";
export type LegacyShapeKey = ShapeKey | "rounded" | "hex";
export type IdeaKind = "idea" | "task" | "note" | "action";

export type Idea = {
  id: string;
  text: string;
  cx?: number;
  cy?: number;
  parentId?: string;
  kind?: IdeaKind;
  done?: boolean;
  collapsed?: boolean;
};

export type BrainstormState = {
  version: 3;
  title: string;
  ideas: Idea[];
  shape: ShapeKey;
};

export type BrainstormDoc = BrainstormState & {
  id: string;
  updatedAt: number;
};

export type BrainstormLibrary = {
  version: 4;
  activeId: string;
  brainstorms: BrainstormDoc[];
};

export type SketchMarker = {
  marker: string;
  markerDark: string;
  markerGlow: string;
  line: string;
};

export type SketchPalette = {
  paper: string;
  paperAccent: string;
  card: string;
  ink: string;
  doodle: string;
  marker: string;
  markerDark: string;
  markerGlow: string;
  ringHighlight: string;
  line: string;
  shadow: string;
  placeholder: string;
  textShadow: string;
  childMarkers: SketchMarker[];
};

export type Placed = { x: number; y: number; w: number; h: number };

export type ShapeTheme = {
  fontFamily: string;
  cardClassName: string;
  controlClassName: string;
  lineMode: "curve" | "orthogonal" | "sketch";
};

export type CanvasView = { x: number; y: number; zoom: number };
