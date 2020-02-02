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

  return createContext(
    () => html`
      <div>
        Counter ${count}
        <button
          onclick=${() => {
            // debugger;
            return count(count() + 1);
          }}
        >
          +
        </button>
        ${() => (component() == 1 ? nested1() : nested2())}
        <button onclick=${switchNested} >Switch Nested Component</button>
      </div>
    `,
    null,
    'I am some context, yo!'
  )();
}

function nested1() {
  let context = getContext();
  return html`
    <p>nested1 with context: "${context}"</p>
  `;
}

function nested2() {
  let context = getContext();
  return html`
    <p>nested2 with context: "${context}"</p>
  `;
}

export default counter;
