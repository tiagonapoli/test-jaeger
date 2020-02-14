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

const tracer = initTracer("publisher");
app.use(bodyParser.json());

app.use("/", async (req, res) => {
  const { message } = req.body;
  const rootSpan = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
  const span = tracer.startSpan("formatter", { childOf: rootSpan });
  console.log(message);
  span.finish()
  res.status(200).end();
});

app.listen(3000, () => {
  console.log("Publisher listening on port 3000");
});
