import { deepEqual } from "fast-equals";
import { html, render } from "lit-html"

function compareArrays(a: any[], b: any[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if(typeof a[i] === "function" && typeof b[i] === "function") continue
    if (a[i] !== b[i]) {
      if(typeof a[i] === "object" && typeof b[i] === "object"){
        if("_$litType$" in a[i] && "_$litType$" in b[i]){
          if(!compareArrays(a[i].values, b[i].values)) return false
          continue
        }
        if(!deepEqual(a[i], b[i])) return false
        continue
      }
      return false;
    }
  }
  return true;
}

export abstract class Immediate extends HTMLElement {
	#__previousValues: any[] = [];
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
		const mount = this.view();
		render(mount, this.shadowRoot!);
		const update = () => {
      const values = this.view().values;
      if (!compareArrays(values, this.#__previousValues)) {
        this.#__previousValues = values;
				render(this.view(), this.shadowRoot!);
      }
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
	protected html = html;
  abstract view(): any

  mount?(): void;
  unmount?(): void;

  #mountCallbacks = new Set<() => void>();
  #unmountCallbacks = new Set<() => void>();

  protected onMount = (callback: () => void) => {
    this.#mountCallbacks.add(callback);
    return () => {
      this.#mountCallbacks.delete(callback);
    }
  }
  protected onUnmount = (callback: () => void) => {
    this.#unmountCallbacks.add(callback);
    return () => {
      this.#unmountCallbacks.delete(callback);
    }
  }
  connectedCallback() {
    this.#mountCallbacks.forEach((callback) => callback());
    this.mount?.();
  }
  disconnectedCallback() {
    this.#unmountCallbacks.forEach((callback) => callback());
    this.unmount?.();
  }

  #effects = new Set<[() => void, any[]]>();
  protected effect = (callback: () => (() => void) | void, deps: any[]) => {
    this.#effects.add([callback, deps]);
  }
};


