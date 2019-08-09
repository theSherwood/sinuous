async function performance(page) {
  try {
    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );

    return extractDataFromPerformanceTiming(
      performanceTiming,
      'responseEnd',
      'domInteractive',
      'domContentLoadedEventEnd',
      'loadEventEnd'
    );
  } catch (err) {
    console.error(err);
  }
}

const extractDataFromPerformanceTiming = (timing, ...dataNames) => {
  const navigationStart = timing.navigationStart;
  const extractedData = {};
  dataNames.forEach(name => {
    extractedData[name] = timing[name] - navigationStart;
  });
  return extractedData;
};

async function metrics(page, testFunction) {
  try {
    await page._client.send('Performance.enable');

    await page._client.send('HeapProfiler.collectGarbage');
    const start = await page._client.send('Performance.getMetrics');

    // console.time('metric');
    await testFunction.apply(null, arguments);
    //console.timeEnd('metric');

    await page._client.send('HeapProfiler.collectGarbage');
    const end = await page._client.send('Performance.getMetrics');
    const time = getMetric(end, 'Timestamp') - getMetric(start, 'Timestamp');

    return {
      time
    };
  } catch (err) {
    console.error(err);
  }
}

const getMetric = (metrics, name) =>
  metrics.metrics.find(x => x.name === name).value * 1000;

function randomNoRepeats(array) {
  var copy = array.slice(0);
  return function() {
    if (copy.length < 1) {
      copy = array.slice(0);
    }
    var index = Math.floor(Math.random() * copy.length);
    var item = copy[index];
    copy.splice(index, 1);
    return item;
  };
}

function pairwise(a, b) {
  var pairs = [];
  for (var i = 0; i < a.length; i++) {
    for (var j = 0; j < b.length; j++) {
      pairs.push([a[i], b[j]]);
    }
  }
  return pairs;
}

async function testTextContains(page, path, value) {
  const elHandle = await page.waitForXPath(path);
  return page.waitFor(
    (el, value) => el && el.textContent.includes(value),
    {},
    elHandle,
    value
  );
}

async function getTextByXPath(page, path) {
  const elHandle = await page.waitForXPath(path);
  return page.evaluate(el => el && el.textContent, elHandle);
}

async function clickElementByXPath(page, path) {
  const elHandle = await page.waitForXPath(path);
  return page.evaluate(el => el && el.click(), elHandle);
}

async function testClassContains(page, path, value) {
  const elHandle = await page.waitForXPath(path);
  return page.evaluate(
    (el, value) => el && el.className.includes(value),
    elHandle,
    value
  );
}

module.exports = {
  performance,
  metrics,
  randomNoRepeats,
  pairwise,
  testTextContains,
  getTextByXPath,
  clickElementByXPath,
  testClassContains
};
