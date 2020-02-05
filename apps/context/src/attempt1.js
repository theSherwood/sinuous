import { html, o, computed, contextProvider, getContext } from '../../sinuous';

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

  return contextProvider(
    { key1: 'foo', key2: 'bar', key4: 'baz' },
    () => html`
      <${contextProvider} key1=${count} key2=${mirror} key3="I am context">
        ${() => html`
          <div>
            <h3>counter</h3>
            Counter ${count}
            <button onclick=${() => count(count() + 1)}>
              +
            </button>
            <${nested1} >
              <${nestedWithContextProvider} />
            <//>
            <button onclick=${switchNested}>Switch Nested Component</button>
            <${contextProvider} key3="I, too, am the contexts">
              ${() => (component() == 1 ? nested2() : nested3(undefined, nestedWithContextProvider))}
            <//>
          </div>

          <style>
            div {
              border: solid 2px black;
              padding: 15px;
              margin: 15px;
            }
          </style>
        `}
      <//>
    `
  )();
}

function nested1(props, ...children) {
  const count = o(0);
  let { key1, key2, key3 } = getContext();
  return html`
    <div>
      <h3>nested1 gets</h3>
      <table>
        <tr>
          <th>key1:</th>
          <td>${key1}</td>
        </tr>
        <tr>
          <th>key2:</th>
          <td>${key2}</td>
        </tr>
        <tr>
          <th>key3:</th>
          <td>${key3}</td>
        </tr>
      </table>
      ${children}
    </div>
  `;
}

function nested2() {
  let context = getContext('key3');
  return html`
    <div>
      <h3>nested2 gets:</h3>
      <table>
        <tr>
          <th>key3:</th>
          <td>${context}</td>
        </tr>
      </table>
    </div>
  `;
}

function nested3(props, ...children) {
  let { key1, key2, key3, key4 } = getContext();
  return html`
    <div>
      <h3>nested3 gets:</h3>
      <table>
        <tr>
          <th>key1:</th>
          <td>${key1}</td>
        </tr>
        <tr>
          <th>key2:</th>
          <td>${key2}</td>
        </tr>
        <tr>
          <th>key3:</th>
          <td>${key3}</td>
        </tr>
        <tr>
          <th>key4:</th>
          <td>${key4}</td>
        </tr>
      </table>
      ${children}
    </div>
  `;
}

function nestedWithContextProvider() {
  const context = { key1: o(100), key3: o(1000), key4: 'not baz' }
  return contextProvider(
    context,
    () => html`
      <div>
        <h3>nestedWithContextProvider provides:</h3>
        <table>
          <tr>
            <th>key1:</th>
            <td>${context.key1}</td>
          </tr>
          <tr>
            <th>key3:</th>
            <td>${context.key3}</td>
          </tr>
          <tr>
            <th>key4:</th>
            <td>${context.key4}</td>
          </tr>
        </table>

        <${nested3} />
      </div>
    `
  );
}

export default counter;
