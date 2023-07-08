import { Immediate } from "./immediate";

class Counter extends Immediate {
  count = 0;
  view(){
    return this.html`
      <button @click=${() => this.count++}>${this.count}</button>
    `
  }
}
customElements.define("counter-comp", Counter);
