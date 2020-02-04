import { html, o, computed, createContext, getContext } from '../../sinuous';

function counter() {
  const count = o(0);
  const mirror = computed(() => count() ** 2);
  const component = o(1);

  function switchNested() {
    if (component() === 1) {
      component(2);
    } else {
      component(1);
    }
  }

  const view = html`
    <${createContext} key1=${count} key2=${mirror} key3="I am context">
      ${() => html`
        <div>
          Counter ${count}
          <button onclick=${() => count(count() + 1)}>
            +
          </button>
          <${nested1} />
          <button onclick=${switchNested}>Switch Nested Component</button>
          <${createContext} key3="I, too, am the contexts">
            ${() => (component() == 1 ? nested2() : nested3())}
          <//>
        </div>
      `}
    <//>
  `;

  return createContext({ key1: 'foo', key2: 'bar', key4: 'baz' }, () => view)();
}

function nested1() {
  const count = o(0);
  let { key1, key2, key3 } = getContext();
  return html`
    <p>
      nested1 (key1, key2, key3) with context: "${key1}", "${key2}", "${key3}"
    </p>
    Count: ${count}
    <button onclick=${() => count(count() + 1)}>
      +
    </button>
    <p>end nested1</p>
  `;
}

function nested2() {
  let context = getContext('key3');
  return html`
    <p>nested2 (key3) with context: ${context}</p>
  `;
}

function nested3() {
  let { key1, key2, key3, key4 } = getContext();
  return html`
    <p>
      nested3 (key1, key2, key3, key4) with context: "${key1}", "${key2}",
      "${key3}", "${key4}"
    </p>
  `;
}

export default counter;
