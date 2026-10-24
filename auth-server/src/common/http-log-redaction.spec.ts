import pino from 'pino';
import { Writable } from 'node:stream';
import { httpLogRedaction } from './http-log-redaction.js';

describe('HTTP credential log redaction', () => {
  it('removes bearer tokens and both cookie headers while retaining useful metadata', () => {
    let output = '';
    const stream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    const logger = pino({ redact: httpLogRedaction }, stream);
    logger.info({
      req: {
        headers: {
          authorization: 'Bearer private-access-token',
          cookie: 'refresh_token=private-refresh-token',
          host: 'localhost',
        },
      },
      res: {
        headers: { 'set-cookie': 'refresh_token=private-new-token; HttpOnly', 'content-type': 'application/json' },
      },
    });
    expect(output).not.toContain('private-');
    expect(output).not.toContain('refresh_token');
    expect(output).toContain('localhost');
    expect(output).toContain('application/json');
  });
});
