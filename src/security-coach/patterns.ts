// ---------------------------------------------------------------------------
// Security Coach – Threat Pattern Library
// ---------------------------------------------------------------------------
// A comprehensive set of regex and function-based matchers that flag risky
// tool calls, shell commands, network activity, and social-engineering
// attempts.  Think "Little Snitch meets Clippy" – friendly, educational,
// and opinionated about keeping the user safe.
// ---------------------------------------------------------------------------

export type ThreatSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ThreatCategory =
  | "data-exfiltration"
  | "privilege-escalation"
  | "destructive-operation"
  | "network-suspicious"
  | "credential-exposure"
  | "social-engineering"
  | "code-injection"
  | "persistence-mechanism"
  | "reconnaissance";

export type ThreatPattern = {
  id: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  /** Short label shown in the popup title */
  title: string;
  /** Regex or function matcher for the tool/command/content */
  match: RegExp | ((input: ThreatMatchInput) => boolean);
  /** Friendly coaching message explaining the risk to the user */
  coaching: string;
  /** What the user should do instead */
  recommendation: string;
  /** Tags for filtering */
  tags: string[];
};

export type ThreatMatchInput = {
  toolName?: string;
  command?: string;
  content?: string;
  url?: string;
  filePath?: string;
  params?: Record<string, unknown>;
  /** Channel the message arrived on (e.g. "whatsapp", "slack", "discord"). */
  channelId?: string;
  /** Sender identifier (phone number, user ID). */
  senderId?: string;
  /** Sender display name. */
  senderName?: string;
  /** Message direction — "inbound" for received, "outbound" for sent. */
  direction?: "inbound" | "outbound";
};

export type ThreatMatch = {
  pattern: ThreatPattern;
  input: ThreatMatchInput;
  matchedAt: number;
  context?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Combine all text fields from the input into a single searchable blob. */
function inputText(input: ThreatMatchInput): string {
  const raw = [
    input.toolName ?? "",
    input.command ?? "",
    input.content ?? "",
    input.url ?? "",
    input.filePath ?? "",
    JSON.stringify(input.params ?? {}),
  ].join("\n");
  // Cap input length to prevent excessive regex processing.
  return raw.length > 50_000 ? raw.slice(0, 50_000) : raw;
}

// ---------------------------------------------------------------------------
// Severity ordering (used when sorting matches)
// ---------------------------------------------------------------------------

const SEVERITY_SORT_ORDER: Record<ThreatSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

export const THREAT_PATTERNS: ThreatPattern[] = [
  // ===== DESTRUCTIVE OPERATIONS ===========================================

  {
    id: "destruct-rm-root",
    category: "destructive-operation",
    severity: "critical",
    title: "Recursive delete of root filesystem",
    match: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+\/(\s|$|;|&&|\|)/,
    coaching:
      "Whoa there! This command would attempt to wipe your entire root filesystem. " +
      "This is almost certainly not what you intended and could permanently destroy " +
      "your operating system and all data on the disk.",
    recommendation:
      "Use a specific path instead of `/`. Double-check the path before running destructive " +
      "commands. Consider using `trash` to move files to the trash instead of permanent deletion.",
    tags: ["rm", "root", "filesystem", "wipe"],
  },

  {
    id: "destruct-rm-home",
    category: "destructive-operation",
    severity: "critical",
    title: "Recursive delete of home directory",
    match: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+(~|\/home\/|\$HOME)/,
    coaching:
      "Whoa there! This command would wipe your entire home directory. Even experienced " +
      "developers have accidentally run this and lost years of work. Let me help you " +
      "target just the files you actually want to remove.",
    recommendation:
      "Use specific file paths instead of wildcards. Consider using `trash` or `rm -i` for " +
      "interactive confirmation. Always double-check paths before recursive deletion.",
    tags: ["rm", "home", "wipe"],
  },

  {
    id: "destruct-rm-wildcard",
    category: "destructive-operation",
    severity: "high",
    title: "Recursive delete with wildcard",
    match: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\s+\*/,
    coaching:
      "This command recursively deletes everything matching `*` in the current directory. " +
      "If you are in the wrong directory, this could erase important files with no way " +
      "to recover them.",
    recommendation:
      "Run `pwd` first to confirm you are in the right directory. List the files with " +
      "`ls` before deleting. Use `rm -ri *` for interactive mode, or use `trash`.",
    tags: ["rm", "wildcard", "recursive"],
  },

  {
    id: "destruct-mkfs",
    category: "destructive-operation",
    severity: "critical",
    title: "Filesystem format command",
    match: /\bmkfs(\.[a-z0-9]+)?\s+/,
    coaching:
      "This creates a brand-new filesystem on a device, which will destroy all existing " +
      "data on it. Make absolutely sure you have the right device identifier -- formatting " +
      "the wrong partition can be catastrophic.",
    recommendation:
      "Triple-check the target device with `lsblk` or `diskutil list`. " +
      "Ensure you have a backup before formatting any disk.",
    tags: ["mkfs", "format", "disk"],
  },

  {
    id: "destruct-dd-zero",
    category: "destructive-operation",
    severity: "critical",
    title: "Disk wipe with dd",
    match: /\bdd\s+.*if=\/dev\/(zero|urandom|random)\s+.*of=/,
    coaching:
      "This `dd` command writes zeros (or random data) directly to a device or file. " +
      "If the target is a disk or partition, all data on it will be irrecoverably destroyed.",
    recommendation:
      "Verify the `of=` target is exactly what you intend. Use `lsblk` to confirm device names. " +
      "Consider using higher-level tools like `diskutil` on macOS or `wipefs` on Linux.",
    tags: ["dd", "zero", "wipe", "disk"],
  },

  {
    id: "destruct-drop-table",
    category: "destructive-operation",
    severity: "high",
    title: "SQL DROP TABLE statement",
    match: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i,
    coaching:
      "This SQL statement permanently removes an entire table, database, or schema. " +
      "In production this could take down your application and lose data that cannot be " +
      "recovered without a backup.",
    recommendation:
      "Make sure you have a recent backup. Use `DROP TABLE IF EXISTS` to avoid errors, " +
      "and consider renaming the table first (e.g., `_old_<name>`) so you can recover if needed.",
    tags: ["sql", "drop", "database"],
  },

  {
    id: "destruct-delete-no-where",
    category: "destructive-operation",
    severity: "high",
    title: "SQL DELETE without WHERE clause",
    match: (input: ThreatMatchInput): boolean => {
      const text = inputText(input).toUpperCase();
      // Match DELETE FROM <table> that is NOT followed by a WHERE clause
      const deleteMatch = /\bDELETE\s+FROM\s+\w+/i.exec(text);
      if (!deleteMatch) {
        return false;
      }
      const afterDelete = text.slice(deleteMatch.index + deleteMatch[0].length).trim();
      // If the remaining text is just a semicolon or empty, that's a
      // DELETE FROM <table>; with no WHERE — flag it.
      if (/^;?\s*$/.test(afterDelete)) {
        return true;
      }
      // Otherwise flag if WHERE does not appear after the DELETE.
      return !/^WHERE\b/.test(afterDelete);
    },
    coaching:
      "This DELETE statement does not include a WHERE clause, which means it will remove " +
      "every single row from the table. That is rarely what you want!",
    recommendation:
      "Add a WHERE clause to limit the deletion. Run a SELECT with the same WHERE first to " +
      "preview which rows will be affected. Always work inside a transaction so you can ROLLBACK.",
    tags: ["sql", "delete", "database"],
  },

  {
    id: "destruct-git-force-push-main",
    category: "destructive-operation",
    severity: "high",
    title: "Force push to main/master branch",
    match: /\bgit\s+push\s+.*--force(-with-lease)?\b.*\b(main|master)\b/,
    coaching:
      "Force-pushing to the main (or master) branch rewrites shared history. This can " +
      "cause data loss for every other contributor and break CI pipelines.",
    recommendation:
      "Use `--force-with-lease` at minimum, which prevents overwriting work that others " +
      "have pushed since your last fetch. Better yet, push to a feature branch and open a PR.",
    tags: ["git", "force-push", "main", "master"],
  },

  // ===== DATA EXFILTRATION ================================================

  {
    id: "exfil-curl-post-file",
    category: "data-exfiltration",
    severity: "high",
    title: "Uploading a file via curl POST",
    match:
      /\bcurl\b.{0,500}?(-X\s*POST|--data|--data-binary|-d\s|--upload-file|-F\s).{0,500}?(@|<)/,
    coaching:
      "This command appears to be uploading a local file to a remote server using curl. " +
      "If the file contains sensitive data (credentials, source code, personal info), it " +
      "could be exfiltrated to an untrusted endpoint.",
    recommendation:
      "Verify the destination URL is a service you trust. Inspect the file contents before " +
      "uploading. Avoid sending credentials, `.env` files, or private keys over the network.",
    tags: ["curl", "upload", "post", "exfiltration"],
  },

  {
    id: "exfil-wget-post",
    category: "data-exfiltration",
    severity: "high",
    title: "Uploading data via wget POST",
    match: /\bwget\b.*--post-(data|file)/,
    coaching:
      "This wget command is POSTing data to a remote server. Double-check that you are not " +
      "inadvertently sending sensitive information to an untrusted host.",
    recommendation:
      "Review the data being sent and confirm the destination URL is legitimate. " +
      "Prefer well-known APIs and authenticated endpoints.",
    tags: ["wget", "post", "exfiltration"],
  },

  {
    id: "exfil-netcat-outbound",
    category: "data-exfiltration",
    severity: "high",
    title: "Netcat outbound connection",
    match: /\b(nc|ncat|netcat)\s+(-[a-zA-Z]*\s+)*[^-\s]+\s+\d+/,
    coaching:
      "Netcat is opening a raw TCP connection to a remote host. While legitimate uses exist " +
      "(debugging, file transfers between your own machines), this is also a classic " +
      "exfiltration and reverse-shell vector.",
    recommendation:
      "If you need to transfer files, consider using `scp` or `rsync` over SSH instead. " +
      "If you are debugging, make sure the target IP belongs to you.",
    tags: ["netcat", "nc", "tcp", "exfiltration"],
  },

  {
    id: "exfil-pipe-to-network",
    category: "data-exfiltration",
    severity: "high",
    title: "Piping sensitive file to network command",
    match: (input: ThreatMatchInput): boolean => {
      const cmd = input.command ?? "";
      const sensitiveFiles =
        /(\.(env|pem|key|p12|pfx|crt)|\/\.ssh\/|credentials|secret|token|password)/i;
      const networkCmd = /\|\s*(curl|wget|nc|ncat|netcat|scp|rsync|ftp|tftp)\b/;
      return sensitiveFiles.test(cmd) && networkCmd.test(cmd);
    },
    coaching:
      "It looks like a file containing credentials or secrets is being piped directly to a " +
      "network command. This is a common exfiltration technique -- even if you are doing it " +
      "intentionally, it is risky.",
    recommendation:
      "Avoid piping credential files through the network. If you need to transfer secrets, " +
      "use encrypted channels (e.g., `scp` over SSH) and delete the remote copy afterward.",
    tags: ["pipe", "sensitive", "network", "exfiltration"],
  },

  {
    id: "exfil-base64-send",
    category: "data-exfiltration",
    severity: "medium",
    title: "Base64-encoding data for transmission",
    match: (input: ThreatMatchInput): boolean => {
      const cmd = input.command ?? "";
      return /base64/.test(cmd) && /\|\s*(curl|wget|nc|ncat|netcat)\b/.test(cmd);
    },
    coaching:
      "Base64-encoding data and piping it to a network command is a well-known exfiltration " +
      "technique. Attackers use Base64 to sneak binary or multi-line secrets past naive " +
      "content filters.",
    recommendation:
      "If you need to transmit binary data, use purpose-built tools like `scp` or authenticated " +
      "APIs. Make sure the destination is a server you control.",
    tags: ["base64", "encoding", "exfiltration"],
  },

  {
    id: "exfil-scp-unknown",
    category: "data-exfiltration",
    severity: "medium",
    title: "SCP/rsync to remote host",
    match: /\b(scp|rsync)\s+.*\S+@\S+:/,
    coaching:
      "This command copies files to a remote host. Ensure the destination is a machine you " +
      "trust and that you are not inadvertently transferring sensitive data.",
    recommendation:
      "Double-check the remote hostname and path. Avoid transferring files that contain " +
      "credentials or secrets unless the channel is encrypted and the host is trusted.",
    tags: ["scp", "rsync", "remote", "exfiltration"],
  },

  // ===== CREDENTIAL EXPOSURE ==============================================

  {
    id: "cred-read-env-file",
    category: "credential-exposure",
    severity: "medium",
    title: "Reading .env or credentials file",
    match: /\b(cat|less|more|head|tail|bat|view)\s+.*\.(env|env\.\w+|credentials|netrc|pgpass)/,
    coaching:
      "This command reads a file that commonly contains secrets (API keys, database passwords, " +
      "tokens). Displaying it in the terminal risks leaking those values into logs and " +
      "scroll-back history.",
    recommendation:
      "Use `grep` to extract only the specific variable you need, or use a secrets manager " +
      "to access values programmatically. Avoid printing entire credential files.",
    tags: ["env", "credentials", "secrets", "cat"],
  },

  {
    id: "cred-read-ssh-keys",
    category: "credential-exposure",
    severity: "high",
    title: "Reading SSH private keys",
    match: /\b(cat|less|more|head|tail|bat|view)\s+.*\/\.ssh\/(id_|.*_key)/,
    coaching:
      "You are about to display an SSH private key. If this content appears in a log, " +
      "a shared terminal, or is captured by any tool, an attacker could use it to access " +
      "every server that trusts that key.",
    recommendation:
      "Never display private keys in the terminal. If you need to copy a public key, use " +
      "`cat ~/.ssh/id_*.pub` instead. Use `ssh-add` to add keys to the agent.",
    tags: ["ssh", "private-key", "credentials"],
  },

  {
    id: "cred-etc-shadow",
    category: "credential-exposure",
    severity: "critical",
    title: "Reading /etc/shadow or /etc/passwd",
    match: /\b(cat|less|more|head|tail|bat|view)\s+\/etc\/(shadow|passwd)/,
    coaching:
      "The `/etc/shadow` file contains hashed passwords for all system accounts. Reading it " +
      "is a classic step in privilege-escalation attacks. Even `/etc/passwd` reveals user " +
      "account information.",
    recommendation:
      "If you need to check which users exist, use `getent passwd` or `id <username>` instead. " +
      "Never read `/etc/shadow` unless you are performing a sanctioned security audit.",
    tags: ["shadow", "passwd", "system", "credentials"],
  },

  {
    id: "cred-keychain-access",
    category: "credential-exposure",
    severity: "high",
    title: "Accessing system keychain or credential store",
    match:
      /\b(security\s+find-(generic|internet)-password|credential-manager|secret-tool|kwallet|gnome-keyring)/,
    coaching:
      "This command queries the operating system's credential store. While sometimes necessary, " +
      "it can expose passwords for other applications and services.",
    recommendation:
      "Only access keychain items that belong to your application. Avoid dumping all stored " +
      "credentials. Make sure no other tool is recording the output.",
    tags: ["keychain", "credential-store", "passwords"],
  },

  {
    id: "cred-print-tokens",
    category: "credential-exposure",
    severity: "medium",
    title: "Printing API keys or tokens to stdout",
    match:
      /\b(echo|printf|print)\s+.*(\$\{?(API_KEY|SECRET|TOKEN|PASSWORD|AWS_SECRET|GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY)\}?)/,
    coaching:
      "This command prints a secret or API key to the terminal. Terminal output is often " +
      "logged, recorded by session managers, or captured by screen-sharing software.",
    recommendation:
      "Write secrets to a file with restrictive permissions (chmod 600) or pipe them " +
      "directly to the consuming command. Never echo secrets in CI logs or shared terminals.",
    tags: ["echo", "api-key", "token", "stdout"],
  },

  // ===== PRIVILEGE ESCALATION =============================================

  {
    id: "privesc-sudo",
    category: "privilege-escalation",
    severity: "medium",
    title: "Command running with sudo",
    match: /\bsudo\s+/,
    coaching:
      "This command runs with root privileges. While sometimes necessary (installing packages, " +
      "managing services), running arbitrary commands as root increases the blast radius of " +
      "any mistake or malicious action.",
    recommendation:
      "Only use `sudo` when absolutely required. Prefer user-level package managers " +
      "(e.g., `brew`, `nvm`, `pyenv`) when possible. Review the full command before confirming.",
    tags: ["sudo", "root", "privileges"],
  },

  {
    id: "privesc-chmod-777",
    category: "privilege-escalation",
    severity: "high",
    title: "Setting world-writable permissions (chmod 777)",
    match: /\bchmod\s+(\+[rwx]*a[rwx]*|777|0777)\s+/,
    coaching:
      "Setting permissions to 777 means every user on the system can read, write, and execute " +
      "the file. This is almost never the right permission model and opens the door to " +
      "tampering by any local process.",
    recommendation:
      "Use the most restrictive permissions that work. For scripts, `755` is usually fine. " +
      "For config files with secrets, use `600`. For shared directories, use `775` with a group.",
    tags: ["chmod", "permissions", "world-writable"],
  },

  {
    id: "privesc-setuid",
    category: "privilege-escalation",
    severity: "critical",
    title: "Setting setuid/setgid bit",
    match: /\bchmod\s+(\+s|[0-7]?[4-7][0-7]{2}|u\+s|g\+s)\s+/,
    coaching:
      "The setuid (or setgid) bit makes a program run with the file owner's privileges " +
      "regardless of who executes it. If the owner is root, any user can gain root access " +
      "through this binary -- a textbook privilege-escalation vector.",
    recommendation:
      "Avoid setuid/setgid unless you fully understand the implications. Use capabilities " +
      "(Linux) or entitlements (macOS) for fine-grained privilege grants instead.",
    tags: ["chmod", "setuid", "setgid", "privileges"],
  },

  {
    id: "privesc-write-system-dirs",
    category: "privilege-escalation",
    severity: "high",
    title: "Writing to system directories",
    match: (input: ThreatMatchInput): boolean => {
      const text = inputText(input);
      const systemPaths =
        /\b(\/etc\/|\/usr\/local\/bin\/|\/usr\/bin\/|\/usr\/sbin\/|\/sbin\/|\/boot\/|\/lib\/|\/var\/run\/)/;
      const writeCommands = /\b(cp|mv|tee|install|ln\s+-s|write|>|>>)\b/;
      return systemPaths.test(text) && writeCommands.test(text);
    },
    coaching:
      "This command writes to a system directory (`/etc`, `/usr`, `/sbin`, etc.). Modifying " +
      "system files can break your OS, affect other users, or introduce security vulnerabilities.",
    recommendation:
      "If you need to install software, use your system's package manager. If you need custom " +
      "config, prefer user-level dotfiles or XDG config directories.",
    tags: ["system", "etc", "usr", "write"],
  },

  {
    id: "privesc-chown-root",
    category: "privilege-escalation",
    severity: "high",
    title: "Changing file ownership to root",
    match: /\bchown\s+(root|0)(:|\.|\s)/,
    coaching:
      "Changing file ownership to root means only root can modify the file afterward. " +
      "This is sometimes appropriate for system services but can lock you out of your own files.",
    recommendation:
      "Make sure you actually need root ownership. For services, consider using a dedicated " +
      "service account instead of root.",
    tags: ["chown", "root", "ownership"],
  },

  // ===== CODE INJECTION ===================================================

  {
    id: "inject-eval-command",
    category: "code-injection",
    severity: "high",
    title: "Use of eval in shell command",
    match: /\beval\s+/,
    coaching:
      "The `eval` command interprets a string as a shell command. If any part of that string " +
      "comes from untrusted input, an attacker can inject arbitrary commands.",
    recommendation:
      "Avoid `eval` whenever possible. Use arrays for command arguments, or call the program " +
      "directly. If eval is truly needed, rigorously sanitize all inputs.",
    tags: ["eval", "injection", "shell"],
  },

  {
    id: "inject-curl-pipe-bash",
    category: "code-injection",
    severity: "critical",
    title: "Downloading and executing a script (curl | bash)",
    match: /\b(curl|wget)\s+.{0,500}?\|\s*(bash|sh|zsh|ksh|dash|python|ruby|perl|node)\b/,
    coaching:
      "This pipes a remote script directly into an interpreter without reviewing it first. " +
      "If the server is compromised, or if you have a typo in the URL, you will execute " +
      "whatever code the attacker provides -- with your full user permissions.",
    recommendation:
      "Download the script first (`curl -o script.sh <url>`), inspect it (`less script.sh`), " +
      "and only then execute it. Better yet, use a package manager.",
    tags: ["curl", "pipe", "bash", "remote-code-execution"],
  },

  {
    id: "inject-python-c-suspicious",
    category: "code-injection",
    severity: "medium",
    title: "Inline Python/Node execution with suspicious code",
    match: (input: ThreatMatchInput): boolean => {
      const cmd = input.command ?? "";
      const inlineExec = /\b(python[23]?|node)\s+-(c|e)\s+/.test(cmd);
      if (!inlineExec) {
        return false;
      }
      const suspicious =
        /(import\s+(os|subprocess|socket|http|urllib)|require\s*\(\s*["'](child_process|net|http|fs)["']\)|exec\(|spawn\(|__import__)/;
      return suspicious.test(cmd);
    },
    coaching:
      "This runs inline code that imports modules commonly used for system access, network " +
      "communication, or process execution. While sometimes legitimate, this pattern is " +
      "frequently used in attacks to download and run payloads.",
    recommendation:
      "Write the code to a file and review it before executing. Avoid one-liners that import " +
      "networking or subprocess modules from untrusted contexts.",
    tags: ["python", "node", "inline", "exec"],
  },

  {
    id: "inject-template-injection",
    category: "code-injection",
    severity: "medium",
    title: "Server-side template injection pattern",
    match:
      /(\{\{.*?(__|config|request|class|mro|subclasses).*?\}\}|<%.*?(Runtime|exec|system).*?%>)/,
    coaching:
      "This content contains patterns associated with server-side template injection (SSTI). " +
      "If rendered by a template engine, this could allow arbitrary code execution on the server.",
    recommendation:
      "Sanitize all user input before passing it to template engines. Use auto-escaping " +
      "and sandboxed template environments.",
    tags: ["template", "ssti", "injection"],
  },

  // ===== NETWORK SUSPICIOUS ===============================================

  {
    id: "net-reverse-shell",
    category: "network-suspicious",
    severity: "critical",
    title: "Reverse shell detected",
    match:
      /\/dev\/tcp\/|bash\s+-i\s+>&\s*\/dev\/tcp\/|mkfifo\s+.*\bnc\b|python.{0,500}?socket.{0,500}?connect.{0,500}?exec|ncat.*-e\s+\/bin\/(ba)?sh/,
    coaching:
      "This is a reverse-shell pattern -- it opens an interactive shell session back to a " +
      "remote attacker. This is one of the most dangerous things that can appear in a " +
      "command and is a hallmark of active exploitation.",
    recommendation:
      "Do not run this command. If you found it in a script or suggestion, treat the source " +
      "as compromised. If you intentionally need remote shell access, use SSH.",
    tags: ["reverse-shell", "backdoor", "exploitation"],
  },

  {
    id: "net-dns-tunnel",
    category: "network-suspicious",
    severity: "high",
    title: "DNS tunneling pattern",
    match: /\b(iodine|dns2tcp|dnscat|dnsmasq.*--txt|dig\s+.*TXT\s+.*\.\w+\.\w+\.\w+\.\w+)/,
    coaching:
      "This command pattern is associated with DNS tunneling -- a technique that encodes " +
      "data inside DNS queries to bypass firewalls and exfiltrate information covertly.",
    recommendation:
      "If you are not performing authorized penetration testing, do not use DNS tunneling " +
      "tools. Monitor DNS traffic for unusually long subdomain labels or high query volumes.",
    tags: ["dns", "tunnel", "covert-channel"],
  },

  {
    id: "net-crypto-mining",
    category: "network-suspicious",
    severity: "high",
    title: "Crypto mining activity",
    match:
      /\b(xmrig|minerd|cgminer|bfgminer|cpuminer|stratum\+tcp:\/\/|pool\.(minergate|nanopool|hashvault))/i,
    coaching:
      "This looks like cryptocurrency mining software or a connection to a mining pool. " +
      "Unauthorized mining consumes your CPU/GPU, increases your electricity bill, and is " +
      "a common payload in compromised systems.",
    recommendation:
      "If you are not intentionally mining, terminate this process immediately and investigate " +
      "how the mining software was installed. Check for other signs of compromise.",
    tags: ["crypto", "mining", "resource-abuse"],
  },

  {
    id: "net-suspicious-ip-rfc5737",
    category: "network-suspicious",
    severity: "medium",
    title: "Connection to documentation/test IP range",
    match: (input: ThreatMatchInput): boolean => {
      const text = inputText(input);
      // RFC 5737 documentation ranges, commonly used as examples in attack tutorials
      // Also match common private ranges being accessed by public-facing commands
      const suspiciousRanges = /\b(198\.51\.100\.\d+|203\.0\.113\.\d+|192\.0\.2\.\d+)\b/;
      return suspiciousRanges.test(text);
    },
    coaching:
      "The IP address in this command belongs to an RFC 5737 documentation range. These " +
      "addresses should never appear in real traffic. Their presence may indicate a " +
      "copy-pasted attack tutorial or misconfigured command.",
    recommendation:
      "Replace the placeholder IP with the actual server address you intend to reach. " +
      "If you copied this command from a tutorial, double-check every parameter.",
    tags: ["ip", "rfc5737", "documentation", "placeholder"],
  },

  // ===== SOCIAL ENGINEERING ===============================================

  {
    id: "social-impersonate-admin",
    category: "social-engineering",
    severity: "high",
    title: "Message impersonating system administrator",
    match: (input: ThreatMatchInput): boolean => {
      const content = (input.content ?? "").toLowerCase();
      const impersonation =
        /(system\s*admin|it\s*department|security\s*team|helpdesk|tech\s*support)/;
      const urgentAction =
        /(immediately|urgent|right\s*now|asap|within\s*\d+\s*(hour|minute)|account\s*will\s*be\s*(locked|suspended|disabled))/;
      const credential =
        /(password|credential|log\s*in|authenticate|verify\s*(your|account)|confirm\s*your\s*(identity|account))/;
      return (
        impersonation.test(content) && (urgentAction.test(content) || credential.test(content))
      );
    },
    coaching:
      "This message claims to be from an authority figure (system admin, IT department) and " +
      "is asking for urgent action involving credentials. This is a classic social-engineering " +
      "pattern. Real IT departments rarely ask for passwords via chat.",
    recommendation:
      "Do not provide your password or credentials. Contact your IT department through an " +
      "official channel (phone, verified email, ticketing system) to confirm the request.",
    tags: ["phishing", "impersonation", "social-engineering"],
  },

  {
    id: "social-verify-password",
    category: "social-engineering",
    severity: "high",
    title: "Urgent password verification request",
    match:
      /(verify|confirm|validate|update)\s+(your\s+)?(password|credentials|account\s+details).*\b(immediately|urgent|now|expire|suspend)/i,
    coaching:
      "This looks like a phishing attempt. Legitimate services almost never ask you to " +
      "'verify your password' through a chat message, especially with urgency language.",
    recommendation:
      "Ignore this message. Go directly to the service's website (type the URL yourself, " +
      "do not click links) and check your account status there.",
    tags: ["phishing", "password", "urgency"],
  },

  {
    id: "social-phishing-url",
    category: "social-engineering",
    severity: "medium",
    title: "Potential phishing URL",
    match: (input: ThreatMatchInput): boolean => {
      const text = inputText(input);
      // Look for lookalike domains, suspicious URL patterns
      const phishingPatterns = [
        /https?:\/\/[^/]*\b(login|signin|verify|secure|account|update)\b[^/]*\.[^/]*\.[^/]*\//i,
        /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}[:/]/,
        /https?:\/\/[^/]*(g00gle|micr0soft|amaz0n|paypa1|app1e)\./i,
        /https?:\/\/[^/]*@[^/]+\//,
      ];
      return phishingPatterns.some((p) => p.test(text));
    },
    coaching:
      "This URL has characteristics commonly seen in phishing attacks: a lookalike domain, " +
      "raw IP address, or embedded credentials. It may be trying to trick you into visiting " +
      "a malicious site that looks like a legitimate one.",
    recommendation:
      "Do not visit the URL. If you expected a link from this service, navigate to it " +
      "directly by typing the known-good URL. Check the domain name character by character.",
    tags: ["phishing", "url", "lookalike-domain"],
  },

  // ===== PERSISTENCE MECHANISMS ===========================================

  {
    id: "persist-crontab",
    category: "persistence-mechanism",
    severity: "medium",
    title: "Crontab modification",
    match: /\bcrontab\s+(-[a-zA-Z]*e|-[a-zA-Z]*l|-[a-zA-Z]*r|\S+\.cron)|echo\s+.*\|\s*crontab/,
    coaching:
      "This command modifies the cron schedule, which runs tasks automatically in the " +
      "background on a timer. Attackers use crontab to ensure their malware runs again " +
      "even if the current process is killed.",
    recommendation:
      "Review the cron entry carefully before installing it. Use `crontab -l` to list current " +
      "jobs. Make sure you understand what the scheduled command does and when it will run.",
    tags: ["cron", "scheduled-task", "persistence"],
  },

  {
    id: "persist-startup-script",
    category: "persistence-mechanism",
    severity: "high",
    title: "Modification of startup/init scripts",
    match:
      /\b(>>?\s*\/etc\/(rc\.local|init\.d\/|systemd\/|cron\.d\/)|install\s+.*\.service|systemctl\s+enable)/,
    coaching:
      "This command installs or modifies system startup scripts or services. This is a common " +
      "persistence technique -- once added, the code will run automatically every time the " +
      "system boots.",
    recommendation:
      "Review the script or service file line by line before installing it. Use `systemctl` " +
      "commands to manage services rather than manually editing init files.",
    tags: ["startup", "init", "systemd", "persistence"],
  },

  {
    id: "persist-shell-rc-network",
    category: "persistence-mechanism",
    severity: "high",
    title: "Shell RC file modification with network call",
    match: (input: ThreatMatchInput): boolean => {
      const cmd = input.command ?? "";
      const rcFile = /\.(bashrc|bash_profile|zshrc|zprofile|profile|zshenv)/;
      const networkCall = /(curl|wget|nc|ncat|python.*http|ruby.*net|fetch|\/dev\/tcp)/;
      const writeOp = /(>>|tee\s+-a|echo\s+.*>>|printf\s+.*>>)/;
      return rcFile.test(cmd) && networkCall.test(cmd) && writeOp.test(cmd);
    },
    coaching:
      "This command appends a network call to your shell startup file (.bashrc, .zshrc, etc.). " +
      "Every time you open a terminal, the network call will execute silently in the " +
      "background -- a stealthy persistence and exfiltration technique.",
    recommendation:
      "Do not add network commands to shell RC files. If you need something to run at " +
      "startup, use a dedicated service or launchd/systemd unit that is easy to audit.",
    tags: ["bashrc", "zshrc", "profile", "network", "persistence"],
  },

  {
    id: "persist-launchd",
    category: "persistence-mechanism",
    severity: "medium",
    title: "macOS LaunchAgent/LaunchDaemon creation",
    match: /\b(LaunchAgents|LaunchDaemons)\/.*\.plist\b|launchctl\s+(load|bootstrap|enable)/,
    coaching:
      "This command creates or loads a macOS launch agent or daemon, which runs automatically " +
      "at login or boot. This is the macOS equivalent of a startup service and is a common " +
      "persistence vector.",
    recommendation:
      "Review the .plist file to confirm the ProgramArguments, RunAtLoad, and KeepAlive " +
      "settings are what you expect. Remove any launch agents you do not recognize with " +
      "`launchctl unload`.",
    tags: ["launchd", "macos", "plist", "persistence"],
  },

  // ===== RECONNAISSANCE ===================================================

  {
    id: "recon-port-scan",
    category: "reconnaissance",
    severity: "medium",
    title: "Port scanning activity",
    match: /\b(nmap|masscan|zmap|unicornscan)\s+/,
    coaching:
      "This command runs a network port scanner. Port scanning is a standard reconnaissance " +
      "step used to discover open services on a target. Scanning hosts you do not own may be " +
      "illegal in many jurisdictions.",
    recommendation:
      "Only scan networks and hosts you are authorized to test. If you are doing a security " +
      "assessment, ensure you have written permission. Use `-T2` or lower for polite scan rates.",
    tags: ["nmap", "port-scan", "reconnaissance"],
  },

  {
    id: "recon-network-enum",
    category: "reconnaissance",
    severity: "low",
    title: "Network enumeration",
    match:
      /\b(arp\s+-a|ip\s+neigh|netstat\s+-[a-z]*[tlnp]|ss\s+-[a-z]*[tlnp]|ifconfig\b|ip\s+addr)/,
    coaching:
      "This command enumerates network interfaces, connections, or neighbors. While often used " +
      "for legitimate troubleshooting, it is also a reconnaissance step in lateral-movement attacks.",
    recommendation:
      "This is usually safe when run on your own machine. Be cautious if a script is " +
      "collecting this data automatically and sending it somewhere.",
    tags: ["network", "enumeration", "arp", "netstat"],
  },

  {
    id: "recon-sysinfo-chain",
    category: "reconnaissance",
    severity: "low",
    title: "System information gathering chain",
    match: (input: ThreatMatchInput): boolean => {
      const cmd = input.command ?? "";
      const infoCommands = [
        /\buname\b/,
        /\bhostname\b/,
        /\bwhoami\b/,
        /\bid\b/,
        /\bcat\s+\/etc\/(os-release|issue|lsb-release)/,
        /\bsw_vers\b/,
        /\bsystem_profiler\b/,
      ];
      const matchCount = infoCommands.filter((re) => re.test(cmd)).length;
      // Flag when multiple info-gathering commands appear together (chained)
      return matchCount >= 3;
    },
    coaching:
      "Multiple system-information-gathering commands are being run together. Individually, " +
      "each is harmless, but as a chain they build a detailed profile of your system -- a " +
      "typical first step when an attacker lands on a new machine.",
    recommendation:
      "If you are running these yourself for debugging, that is fine. If they appeared " +
      "in a script from an untrusted source, investigate why the script needs your system profile.",
    tags: ["uname", "whoami", "sysinfo", "reconnaissance"],
  },

  {
    id: "recon-mass-ping",
    category: "reconnaissance",
    severity: "low",
    title: "Mass ping sweep",
    match: /\b(fping|ping)\s+.*(-c\s*\d{3,}|-w\s*1\s.*\d+\.\d+\.\d+\.\d+\/\d+|(\d+\.){3}0\/\d+)/,
    coaching:
      "This command performs a ping sweep across a network range, which discovers which hosts " +
      "are alive. This is useful for network administration but is also a reconnaissance " +
      "technique.",
    recommendation:
      "Only scan networks you own or have authorization to test. On corporate networks, " +
      "coordinate with your network team first.",
    tags: ["ping", "sweep", "network", "reconnaissance"],
  },

  // ===== ADDITIONAL PATTERNS =============================================

  {
    id: "destruct-truncate-logs",
    category: "destructive-operation",
    severity: "medium",
    title: "Truncating or deleting log files",
    match: /\b(truncate|>\s*\/var\/log\/|rm\s+.*\/var\/log\/|shred\s+.*\/var\/log\/)/,
    coaching:
      "This command clears or deletes system log files. Attackers do this to cover their " +
      "tracks after a compromise. Legitimate log rotation should be handled by `logrotate`.",
    recommendation:
      "Use `logrotate` for managing log file sizes. If you need to clear a specific log " +
      "for debugging, take a backup first and note why you cleared it.",
    tags: ["logs", "truncate", "anti-forensics"],
  },

  {
    id: "exfil-curl-external-with-env",
    category: "data-exfiltration",
    severity: "high",
    title: "Sending environment variables to external URL",
    match: (input: ThreatMatchInput): boolean => {
      const cmd = input.command ?? "";
      return (
        /\b(curl|wget|http)\b/.test(cmd) &&
        /\$\{?(ENV|API_KEY|SECRET|TOKEN|PASSWORD|DATABASE_URL|PRIVATE_KEY)\}?/.test(cmd)
      );
    },
    coaching:
      "This command sends environment variable values (which often contain secrets) to an " +
      "external URL. This is a direct credential-exfiltration technique.",
    recommendation:
      "Never include raw secret values in URLs or request bodies sent to external services. " +
      "Use a secrets manager and scoped, short-lived tokens instead.",
    tags: ["curl", "env", "secrets", "exfiltration"],
  },

  {
    id: "inject-python-reverse-shell",
    category: "code-injection",
    severity: "critical",
    title: "Python reverse shell",
    match: /python[23]?\s+-(c|e)\s+.{0,500}?socket.{0,500}?connect.{0,500}?dup2.{0,500}?exec/,
    coaching:
      "This is a Python-based reverse shell. It creates a socket connection to a remote host " +
      "and binds it to a shell, giving an attacker full interactive access to your machine.",
    recommendation:
      "Do not run this. If you found this in a script, the script is malicious. If you need " +
      "remote access, use SSH with key-based authentication.",
    tags: ["python", "reverse-shell", "socket", "exploitation"],
  },

  {
    id: "net-suspicious-outbound-port",
    category: "network-suspicious",
    severity: "medium",
    title: "Connection to uncommon outbound port",
    match: (input: ThreatMatchInput): boolean => {
      const text = inputText(input);
      // Flag connections to ports commonly used by C2 frameworks and backdoors
      const c2Ports =
        /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[\w.-]+)\s*[: ]\s*(4444|5555|6666|1337|31337|8888|9999|12345|54321)\b/;
      return c2Ports.test(text);
    },
    coaching:
      "This connection targets a port number commonly associated with backdoors, C2 frameworks " +
      "(like Metasploit on 4444), or other attack tools. While not proof of malice, it " +
      "warrants extra scrutiny.",
    recommendation:
      "Verify that the destination host and port are legitimate services you intend to reach. " +
      "If this appeared in a script from an untrusted source, treat it as suspicious.",
    tags: ["port", "c2", "backdoor", "network"],
  },

  {
    id: "cred-aws-credentials-file",
    category: "credential-exposure",
    severity: "high",
    title: "Accessing AWS credentials file",
    match: /\b(cat|less|more|head|tail|bat|cp|mv|scp|rsync)\s+.*\/\.aws\/(credentials|config)/,
    coaching:
      "This command accesses your AWS credentials file, which typically contains your access " +
      "key ID and secret access key. Exposing these values gives an attacker full access to " +
      "your AWS account.",
    recommendation:
      "Use `aws configure list` to check which profile is active without exposing secrets. " +
      "Use IAM roles and temporary credentials instead of long-lived access keys.",
    tags: ["aws", "credentials", "cloud"],
  },

  {
    id: "persist-authorized-keys",
    category: "persistence-mechanism",
    severity: "high",
    title: "SSH authorized_keys modification",
    match: />>?\s*~?\/?(\.ssh\/authorized_keys|\.ssh\/authorized_keys2)/,
    coaching:
      "This command adds or replaces entries in your SSH authorized_keys file. An attacker " +
      "who adds their public key here gains persistent SSH access to your account without " +
      "needing a password.",
    recommendation:
      "Review the key being added. Use `ssh-keygen -l -f` to inspect keys. Regularly audit " +
      "your authorized_keys file and remove any entries you do not recognize.",
    tags: ["ssh", "authorized-keys", "persistence"],
  },

  // ===== CHANNEL / INTEGRATION — INBOUND MESSAGE THREATS =================

  {
    id: "channel-advance-fee-scam",
    category: "social-engineering",
    severity: "high",
    title: "Advance fee / inheritance scam",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const scamSignals = [
        /\b(inheritance|beneficiary|next of kin|unclaimed funds|dormant account)\b/,
        /\b(million|billion)\s+(dollars|usd|euros|gbp|pounds)\b/,
        /\b(nigerian?\s+prince|foreign\s+dignitary|diplomat|barrister)\b/,
        /\b(processing\s+fee|transfer\s+fee|clearance\s+fee|handling\s+charge)\b/,
      ];
      const matchCount = scamSignals.filter((re) => re.test(text)).length;
      return matchCount >= 2;
    },
    coaching:
      "This message has multiple indicators of an advance-fee scam (sometimes called '419 fraud'). " +
      "These messages promise a large sum of money in exchange for a small upfront payment. " +
      "The money never arrives — the scammer just keeps asking for more fees.",
    recommendation:
      "Do not reply or send any money. Block the sender. If it came from a contact you know, " +
      "their account may be compromised — reach out through a different channel to verify.",
    tags: ["scam", "advance-fee", "419", "inbound"],
  },

  {
    id: "channel-lottery-prize-scam",
    category: "social-engineering",
    severity: "high",
    title: "Lottery / prize notification scam",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const won = /\b(congratulations|you\s+(have\s+)?(won|been\s+selected|been\s+chosen))\b/.test(
        text,
      );
      const prize = /\b(lottery|sweepstake|prize|jackpot|raffle|giveaway|lucky\s+winner)\b/.test(
        text,
      );
      const claim = /\b(claim|collect|redeem|contact\s+us|send\s+(your|us))\b/.test(text);
      return won && prize && claim;
    },
    coaching:
      "This looks like a lottery or prize scam. You cannot win a lottery you never entered. " +
      "These messages try to get you to share personal information or pay a 'processing fee' " +
      "to claim a non-existent prize.",
    recommendation:
      "Ignore and delete the message. Legitimate lotteries never notify winners via " +
      "WhatsApp, Telegram, or other messaging apps. Never share personal details or pay fees to 'claim' winnings.",
    tags: ["scam", "lottery", "prize", "inbound"],
  },

  {
    id: "channel-otp-solicitation",
    category: "social-engineering",
    severity: "critical",
    title: "OTP / verification code solicitation",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const otpMention =
        /\b(otp|verification\s+code|security\s+code|one.?time\s+(password|code|pin)|6.?digit\s+code|sms\s+code)\b/.test(
          text,
        );
      const request = /\b(send|share|forward|give|tell)\s+(me|us|it|the)\b/.test(text);
      return otpMention && request;
    },
    coaching:
      "Someone is asking you to share an OTP or verification code. This is a classic account " +
      "takeover technique — the attacker triggered a code to YOUR phone/email and now needs you " +
      "to hand it over so they can log in as you.",
    recommendation:
      "NEVER share OTPs or verification codes with anyone, even people who claim to be from " +
      "the service. No legitimate company will ever ask for your verification code via chat.",
    tags: ["otp", "verification", "account-takeover", "inbound"],
  },

  {
    id: "channel-crypto-investment-scam",
    category: "social-engineering",
    severity: "high",
    title: "Cryptocurrency investment scam",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const crypto =
        /\b(bitcoin|btc|ethereum|eth|crypto|usdt|tether|binance|coinbase|wallet\s+address)\b/.test(
          text,
        );
      const profit =
        /\b(guaranteed\s+(returns?|profit)|(\d+)x\s+returns?|daily\s+(returns?|profit|earnings)|passive\s+income|investment\s+opportunity)\b/.test(
          text,
        );
      const urgency =
        /\b(limited\s+(time|slots?|spots?)|act\s+now|don'?t\s+miss|last\s+chance|hurry)\b/.test(
          text,
        );
      return crypto && (profit || urgency);
    },
    coaching:
      "This message promotes a cryptocurrency 'investment opportunity' with guaranteed returns. " +
      "Legitimate investments never guarantee returns. This is very likely a scam designed to " +
      "steal your money or cryptocurrency.",
    recommendation:
      "Do not send cryptocurrency to anyone promising guaranteed returns. Research any platform " +
      "independently before investing. If it sounds too good to be true, it is.",
    tags: ["scam", "crypto", "investment", "inbound"],
  },

  {
    id: "channel-package-delivery-scam",
    category: "social-engineering",
    severity: "medium",
    title: "Fake package delivery notification",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const delivery = /\b(package|parcel|shipment|delivery|order)\b/.test(text);
      const action =
        /\b(track|confirm|reschedule|update\s+(your|delivery)|pay.*customs|customs\s+fee)\b/.test(
          text,
        );
      const link = /https?:\/\//.test(text);
      return delivery && action && link;
    },
    coaching:
      "This message claims to be about a package delivery and includes a link. Fake delivery " +
      "notifications are one of the most common phishing attacks — the link leads to a site " +
      "that steals your login credentials or payment info.",
    recommendation:
      "Do not click the link. Go directly to the carrier's official website or app to check " +
      "your delivery status. Legitimate carriers rarely send tracking links via chat apps.",
    tags: ["phishing", "delivery", "package", "inbound"],
  },

  {
    id: "channel-bank-impersonation",
    category: "social-engineering",
    severity: "critical",
    title: "Bank / financial institution impersonation",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const bank =
        /\b(bank|account\s+(suspended|locked|frozen|compromised|unusual\s+activity)|transaction\s+(declined|blocked|flagged)|credit\s+card|debit\s+card)\b/.test(
          text,
        );
      const action =
        /\b(verify|confirm|update|click|call|reply\s+with|provide\s+(your|account))\b/.test(text);
      const urgency =
        /\b(immediately|urgent|within\s+\d+\s+(hour|minute)|asap|suspended|will\s+be\s+(closed|locked|frozen))\b/.test(
          text,
        );
      return bank && action && urgency;
    },
    coaching:
      "This message impersonates a bank or financial institution, claiming your account has a " +
      "problem and demanding urgent action. Banks do NOT contact customers this way. This is " +
      "a phishing attack designed to steal your banking credentials.",
    recommendation:
      "Do not click any links or call any numbers in this message. Contact your bank directly " +
      "using the number on the back of your card or on their official website.",
    tags: ["phishing", "bank", "financial", "impersonation", "inbound"],
  },

  {
    id: "channel-job-scam",
    category: "social-engineering",
    severity: "medium",
    title: "Too-good-to-be-true job offer",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const job =
        /\b(job\s+offer|work\s+from\s+home|remote\s+(job|work|position)|hiring\s+(now|immediately)|earn\s+\$?\d+.*per\s+(day|hour|week))\b/.test(
          text,
        );
      const tooGood =
        /\b(no\s+experience|easy\s+money|guaranteed\s+(income|salary)|part.?time.*\$\d{3,}|flexible\s+hours.*\$\d{3,})\b/.test(
          text,
        );
      return job && tooGood;
    },
    coaching:
      "This message offers a job that seems too good to be true — high pay for little or no " +
      "experience. Job scams often lead to identity theft (they ask for your SSN/ID 'for HR'), " +
      "advance-fee fraud, or money laundering schemes.",
    recommendation:
      "Research the company independently. Never pay upfront fees for a job. Be skeptical of " +
      "unsolicited offers with unrealistic pay. Verify through official company websites.",
    tags: ["scam", "job", "employment", "inbound"],
  },

  {
    id: "channel-account-takeover-attempt",
    category: "social-engineering",
    severity: "critical",
    title: "Account takeover / WhatsApp hijack attempt",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const accountRef = /\b(whatsapp|telegram|signal|account|profile)\b/.test(text);
      const takeover =
        /\b(re.?register|re.?verify|new\s+device|lost\s+access|help\s+me\s+(get|regain)|sent\s+(you\s+)?a\s+code\s+by\s+mistake|accidentally\s+sent)\b/.test(
          text,
        );
      return accountRef && takeover;
    },
    coaching:
      "Someone is trying to get access to your messaging account. A common tactic: the attacker " +
      "initiates a re-registration of YOUR number, then asks you to 'forward the code they " +
      "accidentally sent.' Once you share it, they take over your account.",
    recommendation:
      "Never forward verification codes. Enable two-step verification (2FA PIN) on all your " +
      "messaging apps. If someone claims they sent you a code by mistake, it's a scam.",
    tags: ["account-takeover", "whatsapp", "hijack", "inbound"],
  },

  {
    id: "channel-romance-scam",
    category: "social-engineering",
    severity: "medium",
    title: "Potential romance / relationship scam",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const romance =
        /\b(love\s+you|my\s+(dear|darling|love)|soul\s*mate|destiny|meant\s+to\s+be)\b/.test(text);
      const money =
        /\b(send\s+(me\s+)?money|wire\s+transfer|western\s+union|moneygram|gift\s+card|itunes\s+card|google\s+play\s+card|need\s+(financial|money)\s+help|medical\s+(emergency|bills?)|stranded|stuck\s+(in|at))\b/.test(
          text,
        );
      return romance && money;
    },
    coaching:
      "This message combines romantic language with a request for money — a hallmark of romance " +
      "scams. Scammers build emotional connections then fabricate emergencies requiring financial " +
      "help. Victims lose billions of dollars annually to this type of fraud.",
    recommendation:
      "Never send money to someone you have not met in person. Be especially wary of requests " +
      "for wire transfers, gift cards, or cryptocurrency. Discuss with a trusted friend or family member.",
    tags: ["scam", "romance", "money", "inbound"],
  },

  {
    id: "channel-charity-scam",
    category: "social-engineering",
    severity: "medium",
    title: "Fake charity or donation solicitation",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const charity =
        /\b(donate|donation|charity|humanitarian|relief\s+fund|disaster\s+(fund|relief)|orphan|refugee)\b/.test(
          text,
        );
      const payment =
        /\b(bitcoin|btc|wallet|wire\s+transfer|western\s+union|gift\s+card|zelle|venmo|cashapp|paypal\.me)\b/.test(
          text,
        );
      const urgency =
        /\b(urgent|immediately|every\s+(dollar|cent)\s+counts|time\s+is\s+running|limited\s+time)\b/.test(
          text,
        );
      return charity && (payment || urgency);
    },
    coaching:
      "This message solicits donations for a cause but uses suspicious payment methods (crypto, " +
      "gift cards, wire transfer) or extreme urgency. Fake charities exploit emotions around " +
      "disasters and crises to steal money.",
    recommendation:
      "Donate through established charity websites directly (not via links in messages). " +
      "Check charity legitimacy at charitynavigator.org or give.org. Legitimate charities " +
      "never demand gift cards or cryptocurrency.",
    tags: ["scam", "charity", "donation", "inbound"],
  },

  {
    id: "channel-tech-support-scam",
    category: "social-engineering",
    severity: "high",
    title: "Tech support scam",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const techSupport =
        /\b(tech\s*support|customer\s*(support|service)|help\s*desk|microsoft|apple|google)\b/.test(
          text,
        );
      const problem =
        /\b(virus|malware|hacked|compromised|infected|security\s+(breach|alert|warning)|suspicious\s+activity)\b/.test(
          text,
        );
      const action =
        /\b(call\s+(us|this\s+number|now)|remote\s+access|teamviewer|anydesk|install|download)\b/.test(
          text,
        );
      return techSupport && problem && action;
    },
    coaching:
      "This message claims to be from tech support warning about a security problem and asking " +
      "you to call a number or install remote access software. Real tech companies do not reach " +
      "out via chat apps to warn about viruses. This is a tech support scam.",
    recommendation:
      "Do not call the number or install any software. Real companies never contact you this way. " +
      "If you are concerned about your device's security, contact the company through their " +
      "official website or phone number.",
    tags: ["scam", "tech-support", "remote-access", "inbound"],
  },

  // ===== CHANNEL / INTEGRATION — OUTBOUND MESSAGE THREATS ================

  {
    id: "channel-outbound-pii-ssn",
    category: "credential-exposure",
    severity: "critical",
    title: "Social Security Number in outbound message",
    match: (input: ThreatMatchInput): boolean => {
      const text = input.content ?? "";
      // SSN pattern: 3 digits, separator, 2 digits, separator, 4 digits
      // Only flag in message content, not commands
      if (!input.channelId && !input.direction) {
        return false;
      }
      return /\b\d{3}[-.\s]\d{2}[-.\s]\d{4}\b/.test(text);
    },
    coaching:
      "This message appears to contain a Social Security Number. Sending SSNs over messaging " +
      "platforms is extremely risky — messages can be intercepted, stored on servers, and " +
      "accessed by platform employees or through data breaches.",
    recommendation:
      "Never send SSNs via chat. Use encrypted email or a secure document-sharing service. " +
      "If someone legitimately needs your SSN, provide it in person or over the phone.",
    tags: ["pii", "ssn", "outbound", "channel"],
  },

  {
    id: "channel-outbound-credit-card",
    category: "credential-exposure",
    severity: "critical",
    title: "Credit card number in outbound message",
    match: (input: ThreatMatchInput): boolean => {
      const text = input.content ?? "";
      if (!input.channelId && !input.direction) {
        return false;
      }
      // Common card number patterns (Visa, Mastercard, Amex)
      return /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{1,4}\b/.test(
        text,
      );
    },
    coaching:
      "This message contains what looks like a credit or debit card number. Sending card " +
      "numbers over messaging apps exposes you to fraud — anyone with access to the " +
      "conversation (or the platform's servers) can use your card.",
    recommendation:
      "Never share credit card numbers via chat. Use secure payment links, in-app payment " +
      "features, or communicate card details over the phone if absolutely necessary.",
    tags: ["pii", "credit-card", "financial", "outbound", "channel"],
  },

  {
    id: "channel-outbound-password-sharing",
    category: "credential-exposure",
    severity: "high",
    title: "Password sharing in message",
    match: (input: ThreatMatchInput): boolean => {
      const text = (input.content ?? "").toLowerCase();
      if (!input.channelId && !input.direction) {
        return false;
      }
      const passwordLabel = /\b(password|passwd|pwd|passcode|pin)\s*(is|:|\s)\s*/i.test(text);
      const hasValue = /\b(password|passwd|pwd|passcode|pin)\s*(is|:|\s)\s*\S{4,}/i.test(
        input.content ?? "",
      );
      return passwordLabel && hasValue;
    },
    coaching:
      "You appear to be sharing a password or PIN in a message. Chat messages are stored on " +
      "servers, backed up to cloud storage, and visible to anyone with access to the conversation. " +
      "Shared passwords are a leading cause of account compromises.",
    recommendation:
      "Use a password manager's secure sharing feature (1Password, Bitwarden, etc.) instead. " +
      "If you must share a credential, use a self-destructing message service and change the " +
      "password immediately after the other person has used it.",
    tags: ["password", "credentials", "outbound", "channel"],
  },

  {
    id: "channel-outbound-api-key",
    category: "credential-exposure",
    severity: "high",
    title: "API key or token in outbound message",
    match: (input: ThreatMatchInput): boolean => {
      const text = input.content ?? "";
      if (!input.channelId && !input.direction) {
        return false;
      }
      // Common API key patterns
      const patterns = [
        /\b(sk|pk)[-_](live|test)[-_][a-zA-Z0-9]{20,}\b/, // Stripe
        /\bghp_[a-zA-Z0-9]{36}\b/, // GitHub PAT
        /\bxoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+\b/, // Slack bot token
        /\bAIza[a-zA-Z0-9_-]{35}\b/, // Google API key
        /\bsk-[a-zA-Z0-9]{40,}\b/, // OpenAI
        /\bAKIA[A-Z0-9]{16}\b/, // AWS access key
        /\b(api[_-]?key|api[_-]?token|secret[_-]?key)\s*[:=]\s*["']?[a-zA-Z0-9_-]{20,}/i,
      ];
      return patterns.some((p) => p.test(text));
    },
    coaching:
      "This message contains what appears to be an API key or access token. Sharing API keys " +
      "via messaging platforms is dangerous — tokens can be scraped from message histories, " +
      "backups, or leaked through platform vulnerabilities.",
    recommendation:
      "Never share API keys via chat. Use environment variables, secret managers (Vault, AWS " +
      "Secrets Manager), or your platform's secure credential sharing. Rotate the key immediately " +
      "if it was already shared.",
    tags: ["api-key", "token", "credentials", "outbound", "channel"],
  },

  {
    id: "channel-outbound-private-key",
    category: "credential-exposure",
    severity: "critical",
    title: "Private key material in outbound message",
    match: (input: ThreatMatchInput): boolean => {
      const text = input.content ?? "";
      if (!input.channelId && !input.direction) {
        return false;
      }
      return (
        /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/.test(text) ||
        /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/.test(text) ||
        /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/.test(text)
      );
    },
    coaching:
      "You are about to send a private key through a messaging channel. Private keys give " +
      "complete access to encrypted resources — servers, signing certificates, cryptocurrency " +
      "wallets. Once shared in a chat, it's effectively compromised forever.",
    recommendation:
      "NEVER send private keys via chat. Transfer them via `scp` over SSH or use a secrets " +
      "manager. If a key has been shared in a message, consider it compromised and generate " +
      "a new one immediately.",
    tags: ["private-key", "credentials", "outbound", "channel"],
  },

  {
    id: "channel-outbound-internal-url",
    category: "data-exfiltration",
    severity: "medium",
    title: "Internal/private URL shared externally",
    match: (input: ThreatMatchInput): boolean => {
      const text = input.content ?? "";
      if (!input.channelId && !input.direction) {
        return false;
      }
      const internalPatterns = [
        /https?:\/\/localhost[:/]/,
        /https?:\/\/127\.0\.0\.\d+[:/]/,
        /https?:\/\/10\.\d+\.\d+\.\d+[:/]/,
        /https?:\/\/192\.168\.\d+\.\d+[:/]/,
        /https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+[:/]/,
        /https?:\/\/[^/]*\.(internal|local|corp|intranet|private)\b/,
      ];
      return internalPatterns.some((p) => p.test(text));
    },
    coaching:
      "This message contains an internal network URL (localhost, private IP, or internal domain). " +
      "Sharing internal URLs in external channels reveals your network topology and could help " +
      "an attacker target specific internal services.",
    recommendation:
      "Remove internal URLs before sharing. If someone needs access to an internal service, " +
      "set up proper VPN access or use a public-facing proxy with authentication.",
    tags: ["internal-url", "network", "data-leakage", "outbound", "channel"],
  },

  {
    id: "channel-malicious-shortened-url",
    category: "social-engineering",
    severity: "medium",
    title: "Suspicious shortened URL in message",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = input.content ?? "";
      const shorteners =
        /https?:\/\/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|v\.gd|shorte\.st|adf\.ly|bc\.vc|j\.mp)\/[^\s]+/i;
      const urgency =
        /\b(click\s+(here|now|immediately)|open\s+this|check\s+this|look\s+at\s+this|verify|confirm|urgent)\b/i;
      return shorteners.test(text) && urgency.test(text);
    },
    coaching:
      "This message combines a URL shortener with urgency language. Shortened URLs hide the " +
      "real destination and are commonly used in phishing attacks. You cannot tell where the " +
      "link will take you until you click it.",
    recommendation:
      "Do not click shortened URLs from unknown senders. Use a URL expander service " +
      "(e.g., checkshorturl.com) to preview the real destination. If the message is from a " +
      "contact, verify through another channel that they actually sent it.",
    tags: ["phishing", "url-shortener", "inbound"],
  },

  {
    id: "channel-suspicious-attachment-request",
    category: "social-engineering",
    severity: "medium",
    title: "Request to open suspicious attachment or file",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const fileRef =
        /\b(open|download|install|run|execute|extract)\b.*\b(file|attachment|document|zip|rar|exe|apk|dmg|pkg|msi|bat|scr|js)\b/.test(
          text,
        );
      const urgency =
        /\b(urgent|important|invoice|receipt|resume|contract|payment|order|delivery)\b/.test(text);
      return fileRef && urgency;
    },
    coaching:
      "This message asks you to open a file or attachment with urgency. Malicious attachments " +
      "are one of the top infection vectors — they can contain malware, ransomware, or exploits " +
      "that activate the moment you open them.",
    recommendation:
      "Do not open unexpected attachments, especially executables (.exe, .apk, .dmg, .bat). " +
      "Verify with the sender through a different channel. Scan files with antivirus before opening.",
    tags: ["malware", "attachment", "phishing", "inbound"],
  },

  {
    id: "channel-whatsapp-gold-scam",
    category: "social-engineering",
    severity: "high",
    title: "Fake app upgrade / premium version scam",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const fakeApp =
        /\b(whatsapp\s+(gold|premium|pro|plus)|telegram\s+premium\s+(free|crack)|signal\s+pro)\b/.test(
          text,
        );
      const install = /\b(download|install|upgrade|update|activate|get\s+it\s+now)\b/.test(text);
      return fakeApp && install;
    },
    coaching:
      "This message promotes a fake 'premium' or 'gold' version of a messaging app. These " +
      "fake apps are malware in disguise — they steal your messages, contacts, credentials, " +
      "and can take full control of your phone.",
    recommendation:
      "Only install apps from official app stores (Google Play, Apple App Store). There is no " +
      "'WhatsApp Gold' or 'Telegram Premium crack.' Report and block the sender.",
    tags: ["scam", "malware", "fake-app", "inbound"],
  },

  {
    id: "channel-forwarded-chain-message",
    category: "social-engineering",
    severity: "low",
    title: "Chain message / misinformation forward",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const chain =
        /\b(forward\s+(this|to)\s+\d+\s+(people|contacts|friends|groups)|share\s+with\s+everyone|spread\s+the\s+word|send\s+this\s+to)\b/.test(
          text,
        );
      const urgency =
        /\b(warning|urgent|danger|breaking|confirmed\s+by|government\s+announced|doctors?\s+say)\b/.test(
          text,
        );
      return chain && urgency;
    },
    coaching:
      "This looks like a chain message asking you to forward it to others. Chain messages " +
      "are a primary vector for misinformation, scam links, and social engineering. Even " +
      "well-meaning chains waste people's time and erode trust.",
    recommendation:
      "Do not forward chain messages. Check claims on fact-checking sites (Snopes, Reuters Fact " +
      "Check) before believing or sharing. Break the chain — it almost certainly contains " +
      "misinformation.",
    tags: ["misinformation", "chain-message", "forwarding", "inbound"],
  },

  {
    id: "channel-government-impersonation",
    category: "social-engineering",
    severity: "high",
    title: "Government agency impersonation",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const gov =
        /\b(irs|fbi|cia|dhs|customs|immigration|social\s+security\s+(admin|office)|tax\s+(department|authority|office)|police|interpol|federal)\b/.test(
          text,
        );
      const threat =
        /\b(arrest\s+warrant|legal\s+action|lawsuit|fine|penalty|criminal\s+charges|deportation|tax\s+(debt|owed|lien))\b/.test(
          text,
        );
      const action = /\b(call|pay|settle|transfer|send|contact\s+us\s+immediately)\b/.test(text);
      return gov && threat && action;
    },
    coaching:
      "This message impersonates a government agency and threatens legal consequences unless " +
      "you take immediate action (usually paying money). Government agencies do NOT threaten " +
      "people via messaging apps. This is a scam.",
    recommendation:
      "Do not respond or pay anything. Government agencies communicate through official mail " +
      "and verified portals, never through WhatsApp or Telegram. Report the message.",
    tags: ["scam", "impersonation", "government", "inbound"],
  },

  {
    id: "channel-qr-code-scam",
    category: "social-engineering",
    severity: "high",
    title: "Suspicious QR code sharing",
    match: (input: ThreatMatchInput): boolean => {
      if (input.direction !== "inbound") {
        return false;
      }
      const text = (input.content ?? "").toLowerCase();
      const qr = /\b(scan\s+(this\s+)?qr|qr\s+code)\b/.test(text);
      const action = /\b(payment|verify|login|activate|claim|receive|connect\s+your)\b/.test(text);
      return qr && action;
    },
    coaching:
      "This message asks you to scan a QR code for payment, verification, or login. Malicious " +
      "QR codes can redirect to phishing sites, initiate unauthorized payments, or connect your " +
      "account to an attacker's device (WhatsApp Web hijacking).",
    recommendation:
      "Only scan QR codes from sources you trust and can verify. Never scan a QR code sent " +
      "in a chat to 'verify' or 'log in.' For payments, use only official app features.",
    tags: ["qr-code", "phishing", "payment", "inbound"],
  },

  {
    id: "channel-outbound-medical-pii",
    category: "credential-exposure",
    severity: "high",
    title: "Medical / health information in message",
    match: (input: ThreatMatchInput): boolean => {
      const text = (input.content ?? "").toLowerCase();
      if (!input.channelId && !input.direction) {
        return false;
      }
      const medical =
        /\b(diagnosis|prescription|medical\s+record|patient\s+id|health\s+insurance|policy\s+number|blood\s+type|hiv|std|mental\s+health|therapy\s+session)\b/.test(
          text,
        );
      const identifier =
        /\b(\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|mrn\s*[:=]|patient\s*#|dob\s*[:=])\b/i.test(text);
      return medical && identifier;
    },
    coaching:
      "This message contains medical information combined with identifying details. Sharing " +
      "health data over messaging channels may violate HIPAA (US) or GDPR (EU) regulations " +
      "and exposes sensitive personal information.",
    recommendation:
      "Use secure, HIPAA-compliant messaging for medical information. Never share patient " +
      "records, diagnoses, or health insurance numbers via regular chat apps.",
    tags: ["pii", "medical", "hipaa", "outbound", "channel"],
  },
];

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

/**
 * Run all threat patterns against the provided input and return any matches,
 * sorted from most severe to least severe.
 *
 * NOTE: This is the baseline implementation. For optimized matching,
 * import matchThreatsOptimized from ./patterns-optimized.js or use
 * the SecurityCoachEngine with useCache/useWorkerThreads enabled.
 */
export function matchThreats(input: ThreatMatchInput): ThreatMatch[] {
  return matchThreatsLegacy(input);
}

/**
 * Legacy pattern matcher (original implementation).
 * Preserved for backward compatibility and A/B testing.
 */
export function matchThreatsLegacy(input: ThreatMatchInput): ThreatMatch[] {
  const now = Date.now();
  const blob = inputText(input);
  const matches: ThreatMatch[] = [];
  const startMs = Date.now();

  for (const pattern of THREAT_PATTERNS) {
    // Time budget: bail if matching takes too long (DoS protection).
    if (Date.now() - startMs > 500) {
      break;
    }

    let matched = false;
    let context: string | undefined;

    if (pattern.match instanceof RegExp) {
      const m = pattern.match.exec(blob);
      if (m) {
        matched = true;
        context = m[0].slice(0, 120);
      }
    } else {
      matched = pattern.match(input);
    }

    if (matched) {
      matches.push({
        pattern,
        input,
        matchedAt: now,
        context,
      });
    }
  }

  // Sort by severity (critical first, info last)
  matches.sort(
    (a, b) => SEVERITY_SORT_ORDER[a.pattern.severity] - SEVERITY_SORT_ORDER[b.pattern.severity],
  );

  return matches;
}
