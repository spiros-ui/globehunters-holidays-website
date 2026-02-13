#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i += 2) {
  flags[args[i].replace('--', '')] = args[i + 1];
}
const statusPath = path.join(__dirname, '..', 'public', 'deployment-status.json');
const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
const agentId = parseInt(flags.agent);
const checkpointId = flags.checkpoint;
const cpStatus = flags.status || 'pass';
const notes = flags.notes || '';
const evidence = flags.evidence || '';
const agent = status.agents.find(a => a.id === agentId);
if (agent) {
  if (agent.status === 'pending') { agent.status = 'running'; agent.startedAt = new Date().toISOString(); }
  status.currentAgent = `Agent ${agentId} — ${agent.name}`;
  const cp = agent.checkpoints.find(c => c.id === checkpointId);
  if (cp) { cp.status = cpStatus; cp.timestamp = new Date().toISOString(); cp.notes = notes; cp.evidence = evidence; }
  if (agent.checkpoints.every(c => c.status === 'pass')) { agent.status = 'complete'; agent.completedAt = new Date().toISOString(); }
}
const totalCPs = status.agents.reduce((sum, a) => sum + a.checkpoints.length, 0);
const passedCPs = status.agents.reduce((sum, a) => sum + a.checkpoints.filter(c => c.status === 'pass').length, 0);
status.overallProgress = Math.round((passedCPs / totalCPs) * 100);
status.lastUpdated = new Date().toISOString();
fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
console.log(`Updated ${checkpointId} to ${cpStatus} (${status.overallProgress}% complete)`);
