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

const tracer = initTracer("formatter");

app.use(bodyParser.json());

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

app.use("/", async (req, res) => {
  const { name } = req.body;
  const rootSpan = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
  const span = tracer.startSpan("formatter", { childOf: rootSpan });
  span.log({ event: 'request received' })
  await sleep(1000);
  span.log({ event: 'sleep done' })
  span.finish();
  res.status(200).send({ message: `Hello ${name}!` });
});

app.listen(3001, () => {
  console.log("Formatter listening on port 3001");
});
