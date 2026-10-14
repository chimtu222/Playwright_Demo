import fs from 'fs';

export class FileUtils {

  static readJson<T>(path: string): T {

    const content = fs.readFileSync(
      path,
      'utf-8'
    );

    return JSON.parse(content);
  }
}