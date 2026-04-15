'use strict';

module.exports = async ({ github, context, core }) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    core.notice(
      'Skipping: DISCORD_WEBHOOK_ARTIFACTS secret is not configured.'
    );
    return;
  }

  const { owner, repo } = context.repo;
  const run = context.payload.workflow_run;
  const runId = run.id;
  const baseUrl = `https://nightly.link/${owner}/${repo}/actions/runs/${runId}`;

  const {
    data: { artifacts }
  } = await github.rest.actions.listWorkflowRunArtifacts({
    owner,
    repo,
    run_id: runId,
    per_page: 100
  });

  const downloadable = artifacts.filter(
    a => !a.expired && a.name !== 'pr-number'
  );

  if (!downloadable.length) {
    core.notice('No downloadable artifacts found for this run.');
    return;
  }

  const formatSize = bytes => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size >= 10 || i === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[i]}`;
  };

  // Determine embed appearance based on build source.
  const pr = run.pull_requests?.[0];
  let title, color, sourceLine;

  if (pr) {
    title = `PR #${pr.number} artifacts ready`;
    color = 0x57f287;
    sourceLine = `**PR #${pr.number}** — ${pr.title}\nBranch: \`${run.head_branch}\` @ \`${run.head_sha.slice(0, 7)}\``;
  } else if (run.name === 'Build & Create Draft Release') {
    // This workflow only triggers on tag pushes, so head_branch is the tag name.
    const tag = run.head_branch || run.head_sha.slice(0, 7);
    title = `Release artifacts ready (${tag})`;
    color = 0xed4245;
    sourceLine = `Tag: \`${tag}\` @ \`${run.head_sha.slice(0, 7)}\``;
  } else if (run.event === 'schedule') {
    title = 'Nightly build artifacts ready';
    color = 0xfee75c;
    sourceLine = `Scheduled run on \`${run.head_branch || 'unknown'}\` @ \`${run.head_sha.slice(0, 7)}\``;
  } else if (run.event === 'workflow_dispatch') {
    title = 'Manual build artifacts ready';
    color = 0xfee75c;
    sourceLine = `Manual trigger on \`${run.head_branch || 'unknown'}\` @ \`${run.head_sha.slice(0, 7)}\``;
  } else {
    title = 'Build artifacts ready';
    color = 0x5865f2;
    sourceLine = `Push to \`${run.head_branch || 'unknown'}\` @ \`${run.head_sha.slice(0, 7)}\``;
  }

  const artifactLines = downloadable
    .slice(0, 10)
    .map(
      a =>
        `[${a.name}](${baseUrl}/${encodeURIComponent(a.name)}.zip) — ${formatSize(a.size_in_bytes)}`
    );
  if (downloadable.length > 10) {
    artifactLines.push(`...and ${downloadable.length - 10} more`);
  }

  const description = [
    sourceLine,
    '',
    artifactLines.join('\n'),
    '',
    `[View all artifacts](${baseUrl}) • [Workflow run](${run.html_url})`
  ].join('\n');

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Artifact Bot',
      embeds: [
        {
          title,
          description,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: `${owner}/${repo}` }
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    core.setFailed(
      `Discord webhook failed: ${response.status} ${response.statusText} — ${text}`
    );
  }
};
