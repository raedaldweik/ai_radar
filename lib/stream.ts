import type { VercelResponse } from '@vercel/node';
import type { AgentStreamEvent } from '../types';

// Server Sent Events writer. Each agent endpoint uses this to push progress
// to the frontend in real time, so users watch the agent think rather than waiting.
export function startEventStream(res: VercelResponse) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering on Vercel
  res.flushHeaders?.();

  const send = (event: AgentStreamEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const close = () => {
    res.end();
  };

  return { send, close };
}