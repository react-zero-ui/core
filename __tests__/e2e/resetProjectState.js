import fs from 'node:fs';
import path from 'node:path';
import { rmSync } from 'node:fs';

export function resetZeroUiState(projectDir) {


  const tsconfigPath = path.join(projectDir, 'tsconfig.json');
  const zeroUiDir = path.join(projectDir, '.zero-ui');
  console.log('zeroUiDir: ', zeroUiDir);

  if (fs.existsSync(zeroUiDir)) rmSync(zeroUiDir, { recursive: true, force: true });

  if (fs.existsSync(tsconfigPath)) {
    const tsconf = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (tsconf?.compilerOptions?.paths?.['@zero-ui/attributes']) {
      delete tsconf.compilerOptions.paths['@zero-ui/attributes'];
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconf, null, 2));
    }
  }
}
