import {html, o} from '../../sinuous'

const counter = () => {
  const count = o(0);

  return html`
    <div>
      Counter ${count}
      <button onclick=${() => count(count() + 1)}>+</button>
    </div>
  `;
};

document.body.append(counter());