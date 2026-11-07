import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface UploadFile {
  readonly path: string;
  readonly name: string;
}

export function createUploadFile(sourcePath: string): UploadFile {
  const name = `upload-${randomUUID().slice(0, 8)}${extname(sourcePath)}`;
  const directory = mkdtempSync(join(tmpdir(), 'people-help-'));
  const targetPath = join(directory, name);
  copyFileSync(sourcePath, targetPath);
  return { path: targetPath, name };
}

export function cleanupUploadFile(file: UploadFile): void {
  rmSync(dirname(file.path), { recursive: true, force: true });
}
