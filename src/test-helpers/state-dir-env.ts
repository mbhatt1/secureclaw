type StateDirEnvSnapshot = {
  secureclawStateDir: string | undefined;
  clawdbotStateDir: string | undefined;
};

export function snapshotStateDirEnv(): StateDirEnvSnapshot {
  return {
    secureclawStateDir: process.env.SECURECLAW_STATE_DIR,
    clawdbotStateDir: process.env.CLAWDBOT_STATE_DIR,
  };
}

export function restoreStateDirEnv(snapshot: StateDirEnvSnapshot): void {
  if (snapshot.secureclawStateDir === undefined) {
    delete process.env.SECURECLAW_STATE_DIR;
  } else {
    process.env.SECURECLAW_STATE_DIR = snapshot.secureclawStateDir;
  }
  if (snapshot.clawdbotStateDir === undefined) {
    delete process.env.CLAWDBOT_STATE_DIR;
  } else {
    process.env.CLAWDBOT_STATE_DIR = snapshot.clawdbotStateDir;
  }
}

export function setStateDirEnv(stateDir: string): void {
  process.env.SECURECLAW_STATE_DIR = stateDir;
  delete process.env.CLAWDBOT_STATE_DIR;
}
