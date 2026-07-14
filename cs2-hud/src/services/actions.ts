/**
 * Tiny action bus that fans out LHM keybind / panel actions
 * ("toggleStats", "toggleVeto", ...) to any interested component.
 */
type ActionHandler = () => void;

class ActionBus {
  private handlers = new Map<string, Set<ActionHandler>>();

  on(action: string, handler: ActionHandler): () => void {
    if (!this.handlers.has(action)) this.handlers.set(action, new Set());
    this.handlers.get(action)!.add(handler);
    return () => this.handlers.get(action)?.delete(handler);
  }

  dispatch(action: string): void {
    this.handlers.get(action)?.forEach(fn => fn());
  }
}

export const actions = new ActionBus();
