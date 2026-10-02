// Discriminated unions with exhaustive switch.
export type Circle = { readonly kind: "circle"; readonly radius: number };
export type Square = { readonly kind: "square"; readonly side: number };
export type Rect = { readonly kind: "rect"; readonly w: number; readonly h: number };
export type Shape = Circle | Square | Rect;

export function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius * shape.radius;
    case "square":
      return shape.side * shape.side;
    case "rect":
      return shape.w * shape.h;
    default: {
      const done: never = shape;
      return done;
    }
  }
}

export type ApiResponse =
  | { readonly status: "ok"; readonly items: string[] }
  | { readonly status: "empty" }
  | { readonly status: "failed"; readonly reason: string };

export function countItems(res: ApiResponse): number {
  switch (res.status) {
    case "ok":
      return res.items.length;
    case "empty":
      return 0;
    case "failed":
      return 0;
    default: {
      const done: never = res;
      return done;
    }
  }
}

export type TaskState =
  | { readonly phase: "idle" }
  | { readonly phase: "running"; readonly startedAt: number }
  | { readonly phase: "done"; readonly result: string };

// Describe the current task phase.
export function describeTask(t: TaskState): string {
  switch (t.phase) {
    case "idle":
      return "waiting";
    case "running":
      return "started at " + String(t.startedAt);
    case "done":
      return "got " + t.result;
    default: {
      const done: never = t;
      return done;
    }
  }
}
