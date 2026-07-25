export interface IChunkResult {
  text: string;
  index: number;
}

export class RAGParserEngine {
  static parseAndClean(rawText: string): string {
    return rawText.replace(/\s+/g, ' ').trim();
  }

  static generateChunks(text: string, chunkSize = 512, overlap = 50): IChunkResult[] {
    const words = text.split(' ');
    const chunks: IChunkResult[] = [];
    let idx = 0;

    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
      const slice = words.slice(i, i + chunkSize).join(' ');
      if (slice) {
        chunks.push({ text: slice, index: idx++ });
      }
    }
    return chunks;
  }
}
