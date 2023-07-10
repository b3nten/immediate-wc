import { deepEqual } from "fast-equals";
import { html as lithtml, LitElement } from "lit";

function compareTwo(a: any, b: any): boolean {
  // check if both are functions -> if so, we don't care (prevents inline functions from causing renders)
  if (typeof a === "function" && typeof b === "function") return true;
  // check strict equality
  if (a !== b) {
    // if both are objects
    if (typeof a === "object" && typeof b === "object") {
      // if they are a lit template result
      if ("_$litType$" in a && "_$litType$" in b) {
        // compare the values of the template result
        if (!compare(a.values, b.values)) return false;
        return true;
      }
      // check deep equality
      if (!deepEqual(a, b)) return false;
      return true;
    }
    // not objects, thus return false
    return false;
  }
  // they're equal, return true
  return true;
}
function compare(a: any[], b: any[], cache?: number) {
  // unequal lengths, return false early
  if (a.length !== b.length) return false;
  // check the most commonly changing index
  if (typeof cache === "number") {
    if (!compareTwo(a[cache], b[cache])) return false;
  }
  // check values
  for (let i = 0; i < a.length; i++) {
    if (!compareTwo(a[i], b[i])) {
      // cache the value to check first next time
      cache = i;
      return false;
    }
  }
  return true;
}

export class Immediate extends LitElement {
  // Values returned from this.html
  #__renderValues: any[] = [];
  #isVisible = true;

  // constructor
  constructor() {
    super();
    // create update function and start frameloop
    let previous, cache = 0;
    const update = () => {
      // check memo and effect values
      // TODO: check memo and effect values
      // check if visible
      if (!this.#isVisible) return requestAnimationFrame(update);
      // check if render values have changed
      previous = this.#__renderValues;
      this.render();
      if (!compare(previous, this.#__renderValues, cache)) {
        console.log("rerendering");
        this.requestUpdate();
      }
      requestAnimationFrame(update);
    };
    // start frameloop
    requestAnimationFrame(update);
  }

  // declare lifecycle methods and events
  mount?(): void;
  unmount?(): void;

  #mountCallbacks = new Set<() => void>();
  #unmountCallbacks = new Set<() => void>();

  protected onMount = (callback: () => void) => {
    this.#mountCallbacks.add(callback);
    return () => {
      this.#mountCallbacks.delete(callback);
    };
  };
  protected onUnmount = (callback: () => void) => {
    this.#unmountCallbacks.add(callback);
    return () => {
      this.#unmountCallbacks.delete(callback);
    };
  };

  #intersectionObserver: IntersectionObserver | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.#mountCallbacks.forEach((callback) => callback());
    this.mount?.();
    // add intersection observers to all direct children. If any intersect, we should console.log.
    setTimeout(() => {
      if (this.shadowRoot?.host) {
        this.#intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.#isVisible = true;
            } else {
              this.#isVisible = false;
            }
          });
        }, {
          rootMargin: "100px",
        });
        this.#intersectionObserver.observe(this.shadowRoot.host);
      }
    }, 100);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#unmountCallbacks.forEach((callback) => callback());
    this.unmount?.();
    this.#intersectionObserver?.disconnect();
  }

  // custom html function that sets #__renderValues
  protected html = (strings: TemplateStringsArray, ...values: unknown[]) => {
    this.#__renderValues = values;
    return lithtml(strings, ...values);
  };
}
