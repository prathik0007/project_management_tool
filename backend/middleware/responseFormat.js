// Normalise every error response without changing successful API payloads.
const responseFormat = (req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400 && (!body || body.success === undefined)) {
      return sendJson({ success: false, message: body?.message || 'Request failed' });
    }
    return sendJson(body);
  };
  next();
};

export default responseFormat;
