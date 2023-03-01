export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  isDraggable: boolean;
  i: string;
}

export interface Widget {
  id: string;
  config?: object;
  layout: WidgetLayout;
}
