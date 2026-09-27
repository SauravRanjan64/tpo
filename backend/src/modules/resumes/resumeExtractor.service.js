import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync, inflateSync } from 'node:zlib';
import env from '../../config/env.js';

export function resolveStoredResumePath(storageKey) {
  if (typeof storageKey !== 'string' || path.basename(storageKey) !== storageKey) {
    throw new Error('Invalid resume storage key.');
  }

  const uploadDirectory = path.resolve(env.STORAGE_UPLOAD_DIR);
  const filePath = path.resolve(uploadDirectory, storageKey);
  if (path.dirname(filePath) !== uploadDirectory) {
    throw new Error('Invalid resume storage location.');
  }
  return filePath;
}

function unescapePdfText(value) {
  return value
    .replace(/\\([\\()])/g, '$1')
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
}

function extractPdfText(buffer) {
  const textSources = [buffer.toString('latin1')];
  const source = textSources[0];
  const streamPattern = /<<([\s\S]*?)>>\s*stream\r?\n/g;
  let match;

  while ((match = streamPattern.exec(source))) {
    const streamStart = streamPattern.lastIndex;
    const streamEnd = source.indexOf('endstream', streamStart);
    if (streamEnd < 0) break;
    const stream = buffer.subarray(streamStart, streamEnd);
    if (match[1].includes('/FlateDecode')) {
      textSources.push(inflateSync(stream).toString('latin1'));
    }
    streamPattern.lastIndex = streamEnd + 'endstream'.length;
  }

  const extracted = [];
  for (const textSource of textSources) {
    const textOperators = /\(((?:\\.|[^\\)])*)\)\s*(?:Tj|['"])/g;
    let textMatch;
    while ((textMatch = textOperators.exec(textSource))) {
      extracted.push(unescapePdfText(textMatch[1]));
    }
    const textArrays = /\[((?:\\.|[^\]])*)\]\s*TJ/g;
    while ((textMatch = textArrays.exec(textSource))) {
      const strings = textMatch[1].matchAll(/\(((?:\\.|[^\\)])*)\)/g);
      for (const stringMatch of strings) extracted.push(unescapePdfText(stringMatch[1]));
    }
  }
  return extracted.join(' ');
}

function extractDocxText(buffer) {
  const endOfDirectory = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endOfDirectory < 0) throw new Error('Invalid DOCX archive.');

  const entryCount = buffer.readUInt16LE(endOfDirectory + 10);
  let directoryOffset = buffer.readUInt32LE(endOfDirectory + 16);
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(directoryOffset) !== 0x02014b50) {
      throw new Error('Invalid DOCX directory entry.');
    }
    const method = buffer.readUInt16LE(directoryOffset + 10);
    const compressedSize = buffer.readUInt32LE(directoryOffset + 20);
    const fileNameLength = buffer.readUInt16LE(directoryOffset + 28);
    const extraLength = buffer.readUInt16LE(directoryOffset + 30);
    const commentLength = buffer.readUInt16LE(directoryOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(directoryOffset + 42);
    const fileName = buffer.toString('utf8', directoryOffset + 46, directoryOffset + 46 + fileNameLength);

    if (fileName === 'word/document.xml') {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      if (method !== 0 && method !== 8) throw new Error('Unsupported DOCX compression method.');
      const xml = method === 8 ? inflateRawSync(compressed).toString('utf8') : compressed.toString('utf8');
      return xml
        .replace(/<\/w:p>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    }
    directoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error('DOCX file does not contain document text.');
}

export async function extractResumeText(storageKey, mimeType) {
  const filePath = resolveStoredResumePath(storageKey);
  const buffer = await fs.readFile(filePath);
  if (mimeType === 'application/pdf') return extractPdfText(buffer);
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocxText(buffer);
  }
  throw new Error('Resume content extraction is not supported for this file type.');
}

export async function removeStoredResume(storageKey) {
  await fs.unlink(resolveStoredResumePath(storageKey)).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}
