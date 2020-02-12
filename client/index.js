const axios = require("axios");
const initJaegerTracer = require("jaeger-client").initTracer;

const tracer = initTracer("hello-world");
const assert = require("assert");

function initTracer(serviceName) {
  const config = {
    serviceName: serviceName,
    sampler: {
      type: "const",
      param: 1
    },
    reporter: {
      logSpans: true
    }
  };
  const options = {
    logger: {
      info(msg) {
        console.log("INFO ", msg);
      },
      error(msg) {
        console.log("ERROR", msg);
      }
    }
  };
  return initJaegerTracer(config, options);
}

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const httpPost = async (port, body) => {
  const { data } = await axios.post(`http://localhost:${port}`, body);
  return data;
};

const formatString = async (rootSpan, helloTo) => {
  const span = tracer.startSpan("formatString", { childOf: rootSpan });
  const helloStr = `Hello, ${helloTo}!`;
  span.log({
    event: "string-format",
    value: helloStr
  });
  await sleep(1000);
  span.finish();
  return helloStr;
};

const printHello = async (rootSpan, helloStr) => {
  const span = tracer.startSpan("printHello", { childOf: rootSpan });
  await sleep(2000);
  console.log(helloStr);
  span.log({ event: "print-string" });
  span.finish();
};

const sayHello = async helloTo => {
  const span = tracer.startSpan("say-hello");
  span.setTag("hello-to", helloTo);
  await sleep(1000);
  const helloStr = await formatString(span, helloTo);
  await sleep(3000);
  await printHello(span, helloStr);
  span.finish();
};

const go = async () => {
  await sayHello(helloTo);
  wtf.dump();
};

assert(process.argv.length == 3, "Expecting one argument");
const helloTo = process.argv[2];

go().then(() => {
  tracer.close(() => {
    process.exit(1);
  });
});
