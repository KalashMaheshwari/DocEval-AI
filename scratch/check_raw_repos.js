import fs from 'fs/promises';
import path from 'path';

async function main() {
  const content = await fs.readFile(path.join(process.cwd(), 'scratch', 'generated_raw_readmes.json'), 'utf-8');
  const data = JSON.parse(content);
  console.log(`Total repos in generated_raw_readmes.json: ${data.length}`);
  data.forEach((item, index) => {
    console.log(`${index + 1}. ${item.ownerRepo} (${item.complexity}) - Length: ${item.readmeText ? item.readmeText.length : 0} chars`);
  });
}

main();
