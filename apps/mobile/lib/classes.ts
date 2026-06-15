export interface Classroom {
  id: string;
  name: string;
  /** 6-digit join code. Hardcoded for now; will come from the backend. */
  code: string;
  /** Random cover image from a public source. */
  coverUrl: string;
  /** Member id of the assigned class representative, if any. */
  classRepId?: string;
}

/**
 * Placeholder 6-digit code generator. The real code will be issued by the
 * backend when a class is created.
 */
export function generateClassCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Stable random cover image keyed off the class id (Lorem Picsum). */
export function coverUrlFor(id: string): string {
  return `https://picsum.photos/seed/${id}/600/400`;
}

export function createClassroom(name: string): Classroom {
  const id = `${Date.now()}`;
  return {
    id,
    name: name.trim(),
    code: generateClassCode(),
    coverUrl: coverUrlFor(id),
  };
}
