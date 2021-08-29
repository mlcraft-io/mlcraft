import express from 'express';

import requestReceived from 'request-received';
import responseTime from 'response-time';
import requestId from 'express-request-id';

import logger from './src/utils/logger';
import hyphensToCamelCase from './src/utils/hyphensToCamelCase';

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = express();

// adds request received hrtime and date symbols to request object
// (which is used by Cabin internally to add `request.timestamp` to logs
app.use(requestReceived);

// adds `X-Response-Time` header to responses
app.use(responseTime());

// adds or re-uses `X-Request-Id` header
app.use(requestId());

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(logger.middleware);

app.post('/rpc/:method', async (req, res) => {
  const { method } = req.params;

  const { 
    session_variables: session,
    input,
  } = req.body;

  const modulePath = `./src/rpc/${hyphensToCamelCase(method)}`;
  const module = await import(modulePath);

  try {
    if (!module) {
      return {};
    }

    const data = module.default(session, input);

    if (data) {
      return res.json(data);
    }

    return res.status(400).json({
      code: 'method_has_no_output',
      message: `No output from the method "${method}". Check the script`,
    });
  } catch(err) {
    logger.error(`Error in module "${modulePath}"`);
    logger.error(err.stack || err);

    return res.status(500).json({
      code: 'method_has_error',
      message: `Errors found in "${method}" module. Check the server logs`,
    });
  }
});

app.listen(port);

if (dev) {
  logger.log('Development mode: ON')
}

logger.log(`Express server is running, go to http://localhost:${port}`);
