// Base types
export interface Point {
  x: number;
  y: number;
}

export interface DrawableObject {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'freehand' | 'text';
  color: string;
  strokeWidth: number;
}

export interface RectangleShape extends DrawableObject {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends DrawableObject {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface TriangleShape extends DrawableObject {
  type: 'triangle';
  point1: Point;
  point2: Point;
  point3: Point;
}

export interface FreehandShape extends DrawableObject {
  type: 'freehand';
  points: Point[];
}

export interface TextShape extends DrawableObject {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
}

export type Shape = RectangleShape | CircleShape | TriangleShape | FreehandShape | TextShape;

export interface CanvasObject {
  shapes: Shape[];
}

export interface ShapeEraseMessage {
  id: string;
  type: 'ERASE';
}
