import { getChildrenDeep } from './utils.js';

const EMPTY_ARR = [];
let tracking;
let queue;

/**
 * Returns true if there is an active observer.
 * @return {boolean}
 */
export function isListening() {
  return !!tracking;
}

/**
 * Creates a root and executes the passed function that can contain computations.
 * The executed function receives an `unsubscribe` argument which can be called to
 * unsubscribe all inner computations.
 *
 * @param  {Function} fn
 * @return {*}
 */
export function root(fn) {
  // console.log('-root-')
  const prevTracking = tracking;
  const rootUpdate = () => {};
  tracking = rootUpdate;
  resetUpdate(rootUpdate);
  const result = fn(() => {
    _unsubscribe(rootUpdate);
    tracking = undefined;
  });
  tracking = prevTracking;
  return result;
}

/**
 * Sample the current value of an observable but don't create a dependency on it.
 *
 * @example
 * S(() => { if (foo()) bar(sample(bar) + 1); });
 *
 * @param  {Function} fn
 * @return {*}
 */
export function sample(fn) {
  const prevTracking = tracking;
  tracking = undefined;
  const value = fn();
  tracking = prevTracking;
  return value;
}

/**
 * Creates a transaction in which an observable can be set multiple times
 * but only trigger a computation once.
 * @param  {Function} fn
 * @return {*}
 */
export function transaction(fn) {
  queue = [];
  const result = fn();
  let q = queue;
  queue = undefined;
  q.forEach(data => {
    if (data._pending !== EMPTY_ARR) {
      const pending = data._pending;
      data._pending = EMPTY_ARR;
      data(pending);
    }
  });
  return result;
}

let count = 0;
/**
 * Creates a new observable, returns a function which can be used to get
 * the observable's value by calling the function without any arguments
 * and set the value by passing one argument of any type.
 *
 * @param  {*} value - Initial value.
 * @return {Function}
 */
function observable(value) {
  // Tiny indicator that this is an observable function.
  data.$c = count++;
  data.$o = true;
  data._observers = new Set();
  // The 'not set' value must be unique, so `nullish` can be set in a transaction.
  data._pending = EMPTY_ARR;

  function data(nextValue) {
    console.log('data-' + data.$c + '... ', tracking, tracking && [...Object.entries(tracking)])
    if (tracking && tracking.context) {
      console.log('context: ', tracking.context)
    }


    // console.log(
    //   nextValue
    //     ? data.$c + '__' + nextValue + '__start'
    //     : data.$c + '__' + null + '__start'
    // );
    // console.log('o/start: ', 
    // 'nextValue: ', nextValue || null, 
    // 'observers: ', data._observers, 
    // 'pending: ', data._pending,
    // 'tracking: ', tracking)
    // console.table({
    //   nextValue: nextValue || null,
    //   observers: data._observers,
    //   pending: data._pending,
    //   tracking: tracking
    // });
    // console.log('o/tracking: ', tracking, tracking && [...Object.entries(tracking)])
    // console.log('o/tracking observables: ', tracking && [...tracking._observables])
    // console.log('o/tracking children: ', tracking && [...tracking._children])
    // console.log('o/tracking cleanups: ', tracking && [...tracking._cleanups])
    // console.log('o/tracking fresh: ', tracking && tracking._fresh)
    // console.log('o/_observers: ', data._observers)

    if (arguments.length === 0) {
      if (tracking && !data._observers.has(tracking)) {
        data._observers.add(tracking);
        // console.log('data._observables before push: ', [...tracking._observables])
        tracking._observables.push(data);
        // console.log('data._observables after push: ', [...tracking._observables])
      }
      // console.log(
      //   nextValue
      //     ? data.$c + '__' + nextValue + '__length'
      //     : data.$c + '__' + null + '__length'
      // );
      return value;
    }

    if (queue) {
      // console.log('o/queue: ', [...queue]);
      if (data._pending === EMPTY_ARR) {
        queue.push(data);
      }
      data._pending = nextValue;
      // console.log(
      //   nextValue
      //     ? data.$c + '__' + nextValue + '__queue'
      //     : data.$c + '__' + null + '__queue'
      // );
      return nextValue;
    }
    
    value = nextValue;

    // Clear `tracking` otherwise a computed triggered by a set
    // in another computed is seen as a child of that other computed.
    const clearedUpdate = tracking;
    tracking = undefined;

    // Update can alter data._observers, make a copy before running.
    data._runObservers = new Set(data._observers);
    data._runObservers.forEach(observer => (observer._fresh = false));
    data._runObservers.forEach(observer => {
      if (!observer._fresh) observer();
    });

    tracking = clearedUpdate;
    // console.log(
    //   nextValue
    //     ? data.$c + '__' + nextValue + '__end'
    //     : data.$c + '__' + null + '__end'
    // );
    return value;
  }

  return data;
}

/**
 * @namespace
 * @borrows observable as o
 */
export { observable, observable as o };

export function getContext() {
  console.log('getContext... ', tracking, tracking && [...Object.entries(tracking)]);
  if (tracking && tracking.context) {
    console.log(tracking.context)
    return tracking.context
  }
}

export function createContext(observer, value, context) {
  observer._update = updateContext;

  // if (tracking == null) {
  //   console.warn(
  //     'computations created without a root or parent will never be disposed'
  //   );
  // }

  resetUpdate(updateContext);
  updateContext();

  function updateContext() {
    console.log('createContext running...')
    const prevTracking = tracking;
    if (tracking) {
      tracking._children.push(updateContext);
    }

    const prevChildren = updateContext._children;
    _unsubscribe(updateContext);
    updateContext._fresh = true;
    updateContext.context = context
    tracking = updateContext;
    value = observer(value);

    // If any children computations were removed mark them as fresh.
    // Check the diff of the children list between pre and post updateContext.
    prevChildren.forEach(u => {
      if (updateContext._children.indexOf(u) === -1) {
        u._fresh = true;
      }
    });

    // If any children were marked as fresh remove them from the run lists.
    const allChildren = getChildrenDeep(updateContext._children);
    allChildren.forEach(removeFreshChildren);

    tracking = prevTracking;
    return value;
  }

  // Tiny indicator that this is an observable function.
  data.$o = true;

  function data() {
    if (updateContext._fresh) {
      updateContext._observables.forEach(o => o());
    } else {
      value = updateContext();
    }
    return value;
  }

  return data;
}

/**
 * Creates a new computation which runs when defined and automatically re-runs
 * when any of the used observable's values are set.
 *
 * @param {Function} observer
 * @param {*} value - Seed value.
 * @return {Function} Computation which can be used in other computations.
 */
function computed(observer, value) {
  // console.log('computed/value: ', value)
  observer._update = update;

  if (tracking == null) {
    console.warn("computations created without a root or parent will never be disposed");
  }

  resetUpdate(update);
  update();

  function update() {
    console.log('computed/udpate/tracking: ', tracking, tracking && [
      ...Object.entries(tracking)
    ]);
    // console.log('update/value: ', value);
    // console.log('update/observer ', observer, observer.toString());
    // console.log('update._children: ', [...update._children])
    const prevTracking = tracking;
    if (tracking) {
      tracking._children.push(update);
    }

    const prevChildren = update._children;
    _unsubscribe(update);
    update._fresh = true;
    const context = tracking && tracking.context
    tracking = update;
    tracking.context = context
    value = observer(value);

    // If any children computations were removed mark them as fresh.
    // Check the diff of the children list between pre and post update.
    prevChildren.forEach(u => {
      if (update._children.indexOf(u) === -1) {
        u._fresh = true;
      }
    });

    // If any children were marked as fresh remove them from the run lists.
    const allChildren = getChildrenDeep(update._children);
    allChildren.forEach(removeFreshChildren);

    tracking = prevTracking;
    return value;
  }

  // Tiny indicator that this is an observable function.
  data.$o = true;

  function data() {
    // console.log('data/value start: ', value);
    if (update._fresh) {
      // console.log('update._observables: ', [...update._observables]);
      update._observables.forEach(o => o());
    } else {
      // console.log('value=update()')
      value = update();
    }
    // console.log('data/value end: ', value);
    return value;
  }

  return data;
}

function removeFreshChildren(u) {
  if (u._fresh) {
    // console.log('children._observables: ', u._observables);
    u._observables.forEach(o => {
      if (o._runObservers) {
        o._runObservers.delete(u);
      }
    });
  }
}

/**
 * @namespace
 * @borrows computed as S
 */
export { computed, computed as S };

/**
 * Run the given function just before the enclosing computation updates
 * or is disposed.
 * @param  {Function} fn
 * @return {Function}
 */
export function cleanup(fn) {
  if (tracking) {
    tracking._cleanups.push(fn);
  }
  return fn;
}

/**
 * Subscribe to updates of an observable.
 * @param  {Function} observer
 * @return {Function}
 */
export function subscribe(observer) {
  // console.log('subscribe', observer)
  let c = computed(observer);
  // console.log('subscribe-computed: ', c)
  return () => _unsubscribe(observer._update);
}

/**
 * Unsubscribe from an observer.
 * @param  {Function} observer
 */
export function unsubscribe(observer) {
  // console.log('unsubscribe', observer);
  _unsubscribe(observer._update);
}

function _unsubscribe(update) {
  // console.log('_unsubscribe', update);
  update._children.forEach(_unsubscribe);
  // console.log('unsubscribe._observables: ', update._observables);
  update._observables.forEach(o => {
    o._observers.delete(update);
    if (o._runObservers) {
      o._runObservers.delete(update);
    }
  });
  update._cleanups.forEach(c => {
    // console.log('--cleanup--');
    return c()
  });
  resetUpdate(update);
}

function resetUpdate(update) {
  // Keep track of which observables trigger updates. Needed for unsubscribe.
  // console.log('reset._observables: ', update._observables);
  update._observables = [];
  update._children = [];
  update._cleanups = [];
}
