const app = require('./app');
const http = require('http');
const logger = require('./utils/logger');
const { startAgentJobs } = require('./jobs/agentJobs');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  startAgentJobs();
});
