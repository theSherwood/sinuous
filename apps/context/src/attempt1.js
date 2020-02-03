import {
  html,
  o,
  root,
  subscribe,
  computed,
  createContext,
  getContext
} from '../../sinuous';

function counter() {
  const count = o(0);
  const component = o(1);

  function switchNested() {
    if (component() === 1) {
      component(2);
    } else {
      component(1);
    }
  }

  return html`
    <${createContext} key="key1" value=${count}>
      ${() => html`
        <div>
          Counter ${count}
          <button onclick=${() => count(count() + 1)}>
            +
          </button>
          <${nested1} />
          <button onclick=${switchNested}>Switch Nested Component</button>
          <${createContext} key="key2" value="I, too, am the contexts">
            ${() => (component() == 1 ? nested2() : nested3())}
          <//>
        </div>
      `}
    <//>
  `;
}

function nested1() {
  const count = o(0);
  let context = getContext('key1');
  return html`
    <p>nested1 (key1) with context: ${context}</p>
    Count: ${count}
    <button onclick=${() => count(count() + 1)}>
      +
    </button>
    <p>end nested1</p>
  `;
}

function nested2() {
  let context = getContext('key2');
  return html`
    <p>nested2 (key2) with context: ${context}</p>
  `;
}

function nested3() {
  let context1 = getContext('key1');
  let context2 = getContext('key2');
  return html`
    <p>nested3 with context1: ${context1}</p>
    <p>nested3 with context2: ${context2}</p>
  `;
}

export default counter;
