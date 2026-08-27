import { NestExpressApplication } from '@nestjs/platform-express';
import { readFileSync, readdirSync } from 'node:fs';
import { join, parse } from 'node:path';
import hbs from 'hbs';

export function configureApp(app: NestExpressApplication): void {
  const viewsDir = join(__dirname, '..', 'views');
  const publicDir = join(__dirname, '..', 'public');
  const partialsDir = join(viewsDir, 'partials');

  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('hbs');
  app.useStaticAssets(publicDir);

  for (const file of readdirSync(partialsDir)) {
    const { name, ext } = parse(file);
    if (ext === '.hbs') {
      hbs.registerPartial(name, readFileSync(join(partialsDir, file), 'utf8'));
    }
  }
}
