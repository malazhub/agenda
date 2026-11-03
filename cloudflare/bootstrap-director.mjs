import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const interactive = Boolean(process.stdin.isTTY && process.stdin.setRawMode);

async function prompt(question) {
  const input = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await input.question(question)) || '';
  } finally {
    input.close();
  }
}

async function promptPassword(label) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    let password = '';
    let settled = false;
    process.stdout.write(label);
    input.setEncoding('utf8');
    input.setRawMode(true);
    input.resume();

    const finish = (error) => {
      if (settled) return;
      settled = true;
      input.removeListener('data', onData);
      input.removeListener('end', onEnd);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(password);
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003' || character === '\u0004') {
          finish(new Error('Director bootstrap cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          const characters = [...password];
          characters.pop();
          password = characters.join('');
          continue;
        }
        if (character >= ' ') {
          password += character;
        }
      }
    };

    const onEnd = () => finish(new Error('Interactive input is unavailable; set DIRECTOR_USERNAME and DIRECTOR_PASSWORD.'));
    input.on('data', onData);
    input.once('end', onEnd);
    if (input.readableEnded) onEnd();
  });
}

let username = process.env.DIRECTOR_USERNAME?.trim().toLowerCase();
let password = process.env.DIRECTOR_PASSWORD;

if (interactive && !username) {
  username = (await prompt('Director username: ')).trim().toLowerCase();
}
if (interactive && !password) {
  password = await promptPassword('Director password (input hidden): ');
  const confirmation = await promptPassword('Confirm director password: ');
  if (password !== confirmation) {
    console.error('Passwords do not match.');
    process.exit(1);
  }
}

if (!username || !/^[a-z0-9._-]{3,32}$/.test(username)) {
  console.error('Provide DIRECTOR_USERNAME or enter a 3–32 character username using letters, numbers, ".", "_" or "-".');
  process.exit(1);
}
if (!password || password.length < 12) {
  console.error('Provide DIRECTOR_PASSWORD or enter a password with at least 12 characters.');
  process.exit(1);
}

const iterations = 100000;
const salt = randomBytes(16);
const digest = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const encode = (buffer) => buffer.toString('base64url');
const passwordHash = `pbkdf2_sha256$${iterations}$${encode(salt)}$${encode(digest)}`;
const escapeSql = (value) => `'${value.replace(/'/g, "''")}'`;
const command = [
  'INSERT INTO accounts (id, username, password_hash, role, full_name, email, activated, paid)',
  `VALUES (lower(hex(randomblob(16))), ${escapeSql(username)}, ${escapeSql(passwordHash)}, 'director', 'Director', '', 1, 1)`,
  'ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash WHERE accounts.role = \'director\'',
  ';',
].join(' ');

const tempDir = await mkdtemp(join(tmpdir(), 'agenda-director-bootstrap-'));
const sqlFile = join(tempDir, 'bootstrap.sql');
const wranglerCli = join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const { DIRECTOR_PASSWORD: _password, ...childEnv } = process.env;
const location = process.argv.includes('--local') ? '--local' : '--remote';

try {
  await writeFile(sqlFile, command, { encoding: 'utf8', mode: 0o600 });
  const result = spawnSync(
    process.execPath,
    [wranglerCli, 'd1', 'execute', 'agenda-db', location, '--config', 'cloudflare/wrangler.toml', '--file', sqlFile],
    { stdio: 'inherit', env: childEnv },
  );
  if (result.error) {
    console.error('Could not run Wrangler. Install project dependencies and authenticate with Cloudflare first.');
    process.exitCode = 1;
  } else if (result.status !== 0) {
    process.exitCode = result.status || 1;
  } else {
    console.log('Director account bootstrapped. Clear DIRECTOR_USERNAME and DIRECTOR_PASSWORD from the shell environment.');
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
