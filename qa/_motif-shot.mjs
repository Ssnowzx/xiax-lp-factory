import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1040,height:1200}, deviceScaleFactor:2 });
await p.goto(pathToFileURL(process.argv[2]).href, { waitUntil:'networkidle' });
await p.waitForTimeout(400);
await p.screenshot({ path: process.argv[3], fullPage:true });
await b.close();
console.log('shot saved');
