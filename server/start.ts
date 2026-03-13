import { app, AI_SERVER_PORT } from './aiServer';

const server = app.listen(AI_SERVER_PORT, () => {
  console.log(`AI server ready at http://localhost:${AI_SERVER_PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${AI_SERVER_PORT} is already in use. Run: npx kill-port ${AI_SERVER_PORT}`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
