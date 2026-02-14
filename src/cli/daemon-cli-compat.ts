export const LEGACY_DAEMON_CLI_EXPORTS = [
  "registerDaemonCli",
  "runDaemonInstall",
  "runDaemonRestart",
  "runDaemonStart",
  "runDaemonStatus",
  "runDaemonStop",
  "runDaemonUninstall",
] as const;

type LegacyDaemonCliExport = (typeof LEGACY_DAEMON_CLI_EXPORTS)[number];

const EXPORT_SPEC_RE = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/;
const REGISTER_CONTAINER_RE =
  /(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\/\*[\s\S]*?\*\/\s*)?__exportAll\(\{\s*registerDaemonCli\s*:\s*\(\)\s*=>\s*registerDaemonCli\s*\}\)/;

// Pattern to find minified export container: var _e=e({registerDaemonCli:()=>ge})
const MINIFIED_CONTAINER_RE =
  /(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*[A-Za-z_$][\w$]*\(\{([^}]+)\}\)/g;

function parseExportAliases(bundleSource: string): Map<string, string> | null {
  const matches = [...bundleSource.matchAll(/export\s*\{([^}]+)\}\s*;?/g)];
  if (matches.length === 0) {
    return null;
  }
  const last = matches.at(-1);
  const body = last?.[1];
  if (!body) {
    return null;
  }

  const aliases = new Map<string, string>();
  for (const chunk of body.split(",")) {
    const spec = chunk.trim();
    if (!spec) {
      continue;
    }
    const parsed = spec.match(EXPORT_SPEC_RE);
    if (!parsed) {
      return null;
    }
    const original = parsed[1];
    const alias = parsed[2] ?? original;
    aliases.set(original, alias);
  }
  return aliases;
}

function findRegisterContainerSymbol(bundleSource: string): string | null {
  return bundleSource.match(REGISTER_CONTAINER_RE)?.[1] ?? null;
}

function findMinifiedExports(bundleSource: string): Record<string, string> | null {
  // Look for minified patterns like: var _e=e({registerDaemonCli:()=>ge});export{...,_e as t}
  // First, find the export aliases map
  const exportAliases = parseExportAliases(bundleSource);
  if (!exportAliases) {
    return null;
  }

  // Look for container variable that has registerDaemonCli
  const containerMatches = [...bundleSource.matchAll(MINIFIED_CONTAINER_RE)];
  for (const match of containerMatches) {
    const containerVar = match[1];
    const containerBody = match[2];

    // Check if this container has registerDaemonCli
    if (!containerBody.includes("registerDaemonCli")) {
      continue;
    }

    // Find what this container is exported as
    const exportedAs = exportAliases.get(containerVar);
    if (!exportedAs) {
      continue;
    }

    // Parse the function mappings inside the container
    // Pattern: functionName:()=>actualName
    const functionMap: Record<string, string> = {};
    const functionMatches = containerBody.matchAll(
      /([A-Za-z_$][\w$]*)\s*:\s*\(\)\s*=>\s*([A-Za-z_$][\w$]*)/g,
    );

    for (const fnMatch of functionMatches) {
      const exportName = fnMatch[1];
      const actualName = fnMatch[2];
      functionMap[exportName] = actualName;
    }

    // Check if we have registerDaemonCli
    if (!functionMap.registerDaemonCli) {
      continue;
    }

    const registerImplName = functionMap.registerDaemonCli;

    // Now find the registerDaemonCli function implementation to extract function calls
    // Pattern: function registerImplName(e){...}
    const funcDefMatch = bundleSource.match(
      new RegExp(
        `function ${registerImplName}\\([^)]*\\)\\{[\\s\\S]*?\\}(?=var |async |function |export|$)`,
        "m",
      ),
    );

    if (!funcDefMatch) {
      return null;
    }

    const registerImpl = funcDefMatch[0];

    // Extract function calls in .action() calls to map minified names to original exports
    // Patterns like: .action(async e=>{await J(e)}) or .action(async e=>{await $({...})})
    const result: Record<string, string> = {
      registerDaemonCli: `${exportedAs}.registerDaemonCli`,
    };

    // Map command names to expected export names
    const commandMap: Record<string, string> = {
      install: "runDaemonInstall",
      uninstall: "runDaemonUninstall",
      start: "runDaemonStart",
      stop: "runDaemonStop",
      restart: "runDaemonRestart",
      status: "runDaemonStatus",
    };

    // Find .command("xxx")...action(async e=>{await FuncName(
    for (const [cmdName, exportName] of Object.entries(commandMap)) {
      // Pattern: .command(`cmdName`)...action(async e=>{await FuncName(
      const commandPattern = new RegExp(
        `\\.command\\(\`${cmdName}\`\\)[\\s\\S]*?\\.action\\(async [a-z]=>\\{await ([A-Za-z_$][\\w$]*)\\(`,
        "m",
      );
      const cmdMatch = registerImpl.match(commandPattern);
      if (cmdMatch) {
        const minifiedFuncName = cmdMatch[1];
        const exportAlias = exportAliases.get(minifiedFuncName);
        if (exportAlias) {
          result[exportName] = exportAlias;
        }
      }
    }

    // Check if we have all required exports
    const hasAllExports = LEGACY_DAEMON_CLI_EXPORTS.every((name) => result[name]);
    if (hasAllExports) {
      return result;
    }
  }

  return null;
}

export function resolveLegacyDaemonCliAccessors(
  bundleSource: string,
): Record<LegacyDaemonCliExport, string> | null {
  // First try minified export detection (for production builds)
  const minifiedExports = findMinifiedExports(bundleSource);
  if (minifiedExports) {
    // Verify all required exports are present
    const hasAllExports = LEGACY_DAEMON_CLI_EXPORTS.every((name) => minifiedExports[name]);
    if (hasAllExports) {
      return minifiedExports as Record<LegacyDaemonCliExport, string>;
    }
  }

  // Fallback to non-minified export detection (for dev builds)
  const aliases = parseExportAliases(bundleSource);
  if (!aliases) {
    return null;
  }

  const registerContainer = findRegisterContainerSymbol(bundleSource);
  const registerContainerAlias = registerContainer ? aliases.get(registerContainer) : undefined;
  const registerDirectAlias = aliases.get("registerDaemonCli");

  const runDaemonInstall = aliases.get("runDaemonInstall");
  const runDaemonRestart = aliases.get("runDaemonRestart");
  const runDaemonStart = aliases.get("runDaemonStart");
  const runDaemonStatus = aliases.get("runDaemonStatus");
  const runDaemonStop = aliases.get("runDaemonStop");
  const runDaemonUninstall = aliases.get("runDaemonUninstall");
  if (
    !(registerContainerAlias || registerDirectAlias) ||
    !runDaemonInstall ||
    !runDaemonRestart ||
    !runDaemonStart ||
    !runDaemonStatus ||
    !runDaemonStop ||
    !runDaemonUninstall
  ) {
    return null;
  }

  return {
    registerDaemonCli: registerContainerAlias
      ? `${registerContainerAlias}.registerDaemonCli`
      : registerDirectAlias!,
    runDaemonInstall,
    runDaemonRestart,
    runDaemonStart,
    runDaemonStatus,
    runDaemonStop,
    runDaemonUninstall,
  };
}
