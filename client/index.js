const express = require("express");
const bodyParser = require("body-parser");
const jaegerClient = require("jaeger-client");
const opentracing = require("opentracing");

const app = express();

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
  return jaegerClient.initTracer(config, options);
}

const axios = require("axios");
const jaegerClient = require("jaeger-client");
const opentracing = require("opentracing");

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const httpPost = async (port, body, rootSpan) => {
  const headers = {};
  const span = tracer.startSpan(`request:${port}`, { childOf: rootSpan });
  tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, headers);
  // console.log(headers);
  try {
    const { data } = await axios.post(`http://localhost:${port}`, body, {
      headers
    });
    span.finish();
    return data;
  } catch (err) {
    span.setTag(opentracing.Tags.HTTP_STATUS_CODE, err.response.status);
    span.finish();
  }
};

const formatString = async (rootSpan, helloTo) => {
  const span = tracer.startSpan("formatString", { childOf: rootSpan });
  const { message: formatted } = await httpPost(3001, { name: helloTo }, span);
  console.log("formatted", formatted, helloTo);
  await sleep(1000);
  span.finish();
  return formatted;
};

const printHello = async (rootSpan, helloStr) => {
  const span = tracer.startSpan("printHello", { childOf: rootSpan });
  await httpPost(3000, { message: helloStr }, span);
  await sleep(2000);
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

const tracer = initTracer("client-service");
app.use(bodyParser.json());

app.use("/", async (req, res) => {
  const { name } = req.body;
  await sayHello(name);
  res.status(200).end("finished");
});

app.listen(3000, () => {
  console.log("Client-service listening on port 3000");
});
