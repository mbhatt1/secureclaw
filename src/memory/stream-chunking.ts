import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

/**
 * Stream-based markdown chunking to avoid loading entire files in memory
 *
 * This is critical for Raspberry Pi with limited RAM - instead of loading
 * entire markdown files (which could be 10MB+), we stream line-by-line
 * and yield chunks as we go.
 */
export async function* streamMarkdownChunks(
  filePath: string,
  opts: { tokens: number; overlap: number },
): AsyncGenerator<{ text: string; startLine: number; endLine: number }> {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let buffer: string[] = [];
  let lineNumber = 1;
  let chunkStartLine = 1;
  const approxCharsPerToken = 4; // Conservative estimate
  const targetChars = opts.tokens * approxCharsPerToken;
  const overlapChars = opts.overlap * approxCharsPerToken;

  for await (const line of rl) {
    buffer.push(line);
    const bufferSize = buffer.join("\n").length;

    if (bufferSize >= targetChars) {
      const chunkText = buffer.join("\n");
      yield {
        text: chunkText,
        startLine: chunkStartLine,
        endLine: lineNumber,
      };

      // Keep overlap for next chunk
      const overlapLines = Math.ceil((overlapChars / bufferSize) * buffer.length);
      buffer = buffer.slice(-overlapLines);
      chunkStartLine = lineNumber - buffer.length + 1;
    }

    lineNumber++;
  }

  // Yield remaining buffer
  if (buffer.length > 0) {
    yield {
      text: buffer.join("\n"),
      startLine: chunkStartLine,
      endLine: lineNumber - 1,
    };
  }
}

/**
 * Memory-efficient file reading with line limit
 *
 * Useful for preview/snippet generation without loading entire file
 */
export async function readFileLines(
  filePath: string,
  opts: { start?: number; limit?: number },
): Promise<string[]> {
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  const startLine = opts.start ?? 1;
  const limit = opts.limit ?? Number.POSITIVE_INFINITY;
  const lines: string[] = [];
  let lineNumber = 1;

  for await (const line of rl) {
    if (lineNumber >= startLine && lines.length < limit) {
      lines.push(line);
    }
    if (lines.length >= limit) {
      rl.close();
      stream.destroy();
      break;
    }
    lineNumber++;
  }

  return lines;
}
