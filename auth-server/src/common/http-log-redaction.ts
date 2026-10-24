// Request/response metadata must never persist reusable credentials.
export const httpLogRedaction = {
  paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
  remove: true,
};
