// ---------------------------------------------------------------------------
// Security Coach Persona — "Shield"
//
// Defines the security coach's personality and generates coaching messages.
// Think Clippy meets a friendly cybersecurity mentor: helpful, educational,
// never condescending.
// ---------------------------------------------------------------------------

import type { CoachAlertLevel } from "./engine.js";

// ---------------------------------------------------------------------------
// Personality
// ---------------------------------------------------------------------------

export type CoachPersonality = {
  name: string;
  greeting: string;
  /** Emoji/icon for the character */
  avatar: string;
};

export const COACH_PERSONALITY: CoachPersonality = {
  name: "Shield",
  greeting:
    "Hey! I'm Shield, your security sidekick. I keep an eye on things so you don't have to worry.",
  avatar: "\u{1F6E1}\uFE0F", // shield emoji
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Pick a random element from an array. */
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/**
 * Interpolate `{key}` placeholders in a template string.
 */
function interpolate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

// ---------------------------------------------------------------------------
// Threat types used by the engine
// ---------------------------------------------------------------------------

/**
 * Minimal shape of a ThreatMatch that this module needs.
 *
 * We intentionally avoid importing from `./patterns.js` to prevent a
 * circular dependency — `patterns.ts` may not exist yet and the engine
 * already imports us.
 */
type ThreatMatchLike = {
  patternId?: string;
  category: string;
  severity: string;
  title: string;
  coaching?: string;
};

// ---------------------------------------------------------------------------
// Coach message generation
// ---------------------------------------------------------------------------

const CRITICAL_TEMPLATES: readonly string[] = [
  "Hold up! I spotted something that could cause serious damage. {title} \u2014 let me explain what this does and why it's risky.",
  "Whoa, stop right there! {title}. This one needs your attention before we go any further.",
  "Red alert! {title}. I want to make sure you understand what's happening here before anything proceeds.",
  "Heads up \u2014 {title} is a serious concern. Let's take a beat and talk through this.",
];

const HIGH_TEMPLATES: readonly string[] = [
  "Heads up! {title}. This is the kind of thing that catches people off guard. Here's what you should know\u2026",
  "Worth pausing on this one \u2014 {title}. I've seen this cause trouble before.",
  "Hey, quick flag on {title}. Not a crisis, but definitely something to be aware of.",
  "Attention needed: {title}. Let me walk you through why this raised my antenna.",
];

const MEDIUM_TEMPLATES: readonly string[] = [
  "Quick note about {title}. Not necessarily dangerous, but worth being aware of.",
  "Something to keep an eye on: {title}. Just want to make sure you're in the loop.",
  "FYI \u2014 {title}. Probably fine, but I like to keep you informed.",
  "Noticed something about {title}. Nothing alarming, just thought you'd want to know.",
];

const LOW_TEMPLATES: readonly string[] = [
  "Just FYI \u2014 {title}. Everything's probably fine, but I thought you'd want to know.",
  "Tiny note: {title}. No action needed, just keeping you in the picture.",
  "For the record: {title}. Consider this a gentle heads-up.",
  "Minor observation: {title}. Filing this under 'good to know'.",
];

const INFO_TEMPLATES: readonly string[] = [
  "Here's an interesting tidbit: {title}.",
  "Did you know? {title}. Just sharing for your awareness.",
  "Quick learning moment: {title}.",
];

const SEVERITY_TEMPLATES: Record<string, readonly string[]> = {
  critical: CRITICAL_TEMPLATES,
  high: HIGH_TEMPLATES,
  medium: MEDIUM_TEMPLATES,
  low: LOW_TEMPLATES,
  info: INFO_TEMPLATES,
};

const RECOMMENDATION_BY_LEVEL: Record<string, readonly string[]> = {
  block: [
    "I'd strongly recommend denying this. If you're sure it's safe, you can allow it \u2014 but please double-check first.",
    "My advice: block this and investigate. Better to be cautious here.",
    "I've blocked this for now. Take a look and decide if it should proceed.",
  ],
  warn: [
    "Take a moment to review before allowing this. When in doubt, deny and ask questions.",
    "I'd suggest checking the details before proceeding. You can always allow it once you're comfortable.",
    "Worth a second look \u2014 review the details and make the call you're comfortable with.",
  ],
  inform: [
    "No action needed from you \u2014 just keeping you informed.",
    "This is just informational. Feel free to continue what you were doing.",
    "Nothing to worry about right now. I'll keep watching.",
  ],
};

/**
 * Generate a coaching message for detected threats.
 *
 * This is the primary entry point used by the `SecurityCoachEngine` when
 * building alerts.  It accepts the matched threats and the computed alert
 * level and returns `{ title, message, recommendation }`.
 */
export function generateCoachMessage(
  threats: ThreatMatchLike[],
  level: CoachAlertLevel,
): { title: string; message: string; recommendation: string } {
  // Use the first (highest-severity) threat to drive the message.
  const top = threats[0];
  if (!top) {
    return {
      title: "Security check",
      message: "Something caught my attention, but I couldn't determine the details.",
      recommendation: pick(RECOMMENDATION_BY_LEVEL["inform"]!),
    };
  }

  const severity = top.severity;
  const templates = SEVERITY_TEMPLATES[severity] ?? MEDIUM_TEMPLATES;
  const title = buildTitle(threats);
  const message = interpolate(pick(templates), {
    title,
    category: top.category,
    command: undefined,
    toolName: undefined,
  });

  const recommendation = pick(
    RECOMMENDATION_BY_LEVEL[level] ?? RECOMMENDATION_BY_LEVEL["inform"]!,
  );

  return { title, message, recommendation };
}

/**
 * Build a human-readable title from one or more threat matches.
 */
function buildTitle(threats: ThreatMatchLike[]): string {
  if (threats.length === 0) {
    return "Security check";
  }
  if (threats.length === 1) {
    return threats[0]!.title;
  }
  // Multiple threats: lead with the first, mention the count.
  return `${threats[0]!.title} (+${threats.length - 1} more)`;
}

// ---------------------------------------------------------------------------
// Celebration messages
// ---------------------------------------------------------------------------

const CELEBRATION_MESSAGES: Record<string, readonly string[]> = {
  deny: [
    "Good call blocking that. Better safe than sorry!",
    "Smart move! Blocking suspicious activity is always the right instinct.",
    "Denied and done. Your future self thanks you.",
    "Nice one. That's exactly the kind of caution that keeps systems safe.",
  ],
  "allow-once": [
    "Got it, allowing this one time. I'll keep an eye on it.",
    "One-time pass granted. I'll flag it again if it comes up.",
    "Allowing this once. You're the boss, but I'm still watching!",
  ],
  "allow-always": [
    "Got it, I'll remember that one. If you change your mind, check your rules.",
    "Rule saved! I won't bug you about this again unless you tell me to.",
    "Permanently allowed. You can always update this in your security rules.",
    "Noted! This is now on the trusted list. Revisit your rules anytime.",
  ],
  "learn-more": [
    "Knowledge is power! Let me tell you more about this\u2026",
    "Great question! Understanding threats is the first step to staying safe.",
    "Curious minds stay secure. Here's what you should know\u2026",
    "Love the curiosity! Let's dig into the details together.",
  ],
};

/**
 * Generate a celebration message when the user makes a good security decision.
 */
export function generateCelebration(decision: string): string {
  const messages = CELEBRATION_MESSAGES[decision];
  if (!messages || messages.length === 0) {
    return "Thanks for making a decision. I'm here if you need me!";
  }
  return pick(messages);
}

// ---------------------------------------------------------------------------
// Educational tips
// ---------------------------------------------------------------------------

const TIPS_BY_CATEGORY: Record<string, readonly string[]> = {
  "data-exfiltration": [
    "Did you know? Data exfiltration is the #1 way sensitive info leaks. Always verify where your data is going.",
    "Pro tip: watch out for commands that pipe data to external URLs. If you didn't initiate it, question it.",
    "Keep an eye on outbound network requests. Legitimate tools shouldn't be sending data to unexpected places.",
  ],
  "privilege-escalation": [
    "Principle of least privilege: only use sudo when you absolutely need it.",
    "Running things as root? Make sure you trust the source. Elevated privileges mean elevated risk.",
    "If a tool asks for admin access unexpectedly, that's worth investigating before granting.",
  ],
  "destructive-operation": [
    "Pro tip: always use `ls` before `rm` to preview what you're about to delete.",
    "Destructive commands can't be undone. When in doubt, make a backup first.",
    "Consider using `rm -i` for interactive deletion \u2014 it asks before each file is removed.",
    "Version control is your safety net. Commit before running destructive operations.",
  ],
  "credential-access": [
    "Never hardcode secrets in source files. Use environment variables or a secrets manager instead.",
    "Rotate credentials regularly. If you suspect a leak, rotate immediately.",
    "Watch for commands that read or copy credential files \u2014 that's a common attack vector.",
  ],
  "network-suspicious": [
    "Unexpected outbound connections? That could be a sign of a compromised tool.",
    "DNS and network traffic can reveal a lot. If a process is phoning home to a weird domain, investigate.",
    "Stick to HTTPS. Unencrypted HTTP traffic can be intercepted and modified.",
  ],
  "code-injection": [
    "Be wary of `eval()` and dynamic code execution. It's a common entry point for attacks.",
    "Sanitize all inputs \u2014 even ones that seem safe. Injection attacks exploit assumptions.",
    "Code that builds commands from user input is risky. Use parameterized approaches instead.",
  ],
  "file-system": [
    "Watch for unexpected file permission changes. `chmod 777` is almost never the right answer.",
    "Sensitive files (.env, private keys) should have strict permissions \u2014 600 or 400.",
    "If a process is modifying system files, make sure you understand why.",
  ],
  "social-engineering": [
    "If a message creates a sense of urgency and asks for money or credentials, it's almost certainly a scam.",
    "Scammers impersonate banks, government agencies, and tech companies. Always verify through official channels.",
    "Never share OTPs or verification codes with anyone \u2014 not even people claiming to be from the service.",
    "Romance scams cost victims billions annually. Be wary of online contacts who ask for money.",
    "Chain messages and 'forward to 10 friends' requests are how misinformation and scam links spread.",
  ],
  "credential-exposure": [
    "Never share passwords, API keys, or private keys through messaging apps. Use a password manager instead.",
    "If you accidentally shared a credential in a chat, rotate it immediately \u2014 consider it compromised.",
    "Credit card numbers, SSNs, and other PII should never be sent via chat. Use secure channels.",
    "Enable two-factor authentication on all accounts \u2014 it's your best defense against credential theft.",
  ],
};

const GENERIC_TIPS: readonly string[] = [
  "Security is a habit, not a one-time thing. Small, consistent checks make a big difference.",
  "When something feels off, trust your instincts. It's always okay to investigate.",
  "Staying up to date on patches and updates is one of the simplest ways to stay secure.",
  "Two-factor authentication isn't just a nice-to-have \u2014 it's your first line of defense.",
  "Regular backups can save you from ransomware, accidental deletion, and hardware failures.",
];

/**
 * Generate an educational tip based on what just happened.
 */
export function generateTip(opts: {
  category: string;
  context?: string;
}): string {
  const categoryTips = TIPS_BY_CATEGORY[opts.category];
  if (categoryTips && categoryTips.length > 0) {
    const tip = pick(categoryTips);
    return opts.context ? `${tip} (Context: ${opts.context})` : tip;
  }
  return pick(GENERIC_TIPS);
}

// ---------------------------------------------------------------------------
// Character state
// ---------------------------------------------------------------------------

/**
 * Get the character state based on the alert level.
 *
 * Maps alert levels to the `CoachCharacterState` values defined in
 * `events.ts`.
 */
export function getCharacterState(
  level: string,
): "blocking" | "alert" | "coaching" | "idle" {
  switch (level) {
    case "block":
      return "blocking";
    case "warn":
      return "alert";
    case "inform":
      return "coaching";
    default:
      return "idle";
  }
}

// ---------------------------------------------------------------------------
// Idle quips
// ---------------------------------------------------------------------------

const IDLE_QUIPS: readonly string[] = [
  "All clear! No threats detected.",
  "Running background checks\u2026 everything looks good.",
  "Your security posture is looking sharp today.",
  "Remember: if something looks too good to be true online, it probably is.",
  "I'm watching the watchers. Quis custodiet and all that.",
  "Coast is clear. I'll let you know if anything changes.",
  "Scanning the horizon\u2026 nothing suspicious in sight.",
  "Keeping things locked down while you do your thing.",
  "Everything is calm on the security front. Carry on!",
  "Just doing my rounds. All systems nominal.",
  "Standing guard so you can focus on what matters.",
  "Another quiet moment in the security world. I'll take it.",
  "Tip of the day: strong passwords are like good locks \u2014 worth the investment.",
  "Fun fact: the first computer virus was created in 1986. We've come a long way!",
  "If I had a cape, I'd be wearing it right now. Just saying.",
];

/**
 * Get a random idle quip for the coach when nothing is happening.
 */
export function getIdleQuip(): string {
  return pick(IDLE_QUIPS);
}
