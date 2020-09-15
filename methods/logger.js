const log4js = require("log4js");
log4js.configure({
  appenders: {errLogs: { type: 'file', filename: 'logs/error.log' }, console: { type: 'console' }},
  categories: { default: { appenders: ['console', 'errLogs'], level: 'trace' }}
});
const logger = log4js.getLogger();

// logger.error('dsadsa',{hello:"hello"})

module.exports=logger
