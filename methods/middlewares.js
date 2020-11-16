let middlewares = {
  isMenteeAuthenticated: async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        type: "failure",
        error: "User not authenticated",
      });
    }
    next();
  },
  formFill: () => {},
};

module.exports = middlewares;
