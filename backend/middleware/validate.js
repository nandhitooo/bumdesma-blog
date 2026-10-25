export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0].message });
    }

    req.validated ??= {};
    req.validated[source] = result.data;
    return next();
  };
}
