import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import puppeteer from 'puppeteer';

const mikeName = 'Mike Pownall DVM, MBA';
const mikeRole =
  'Co- Founder and Managing Partner of McKee-Pownall Equine Services | VP M&A Altano North America';
const mikeRoleFormatted =
  'Co- Founder and Managing Partner of McKee-Pownall Equine Services<br>VP M&A Altano North America';

const mikeFolder =
  'C:\\Users\\Bizycorp_Work\\Pictures\\April 22nd\\Veterinary Technology & Innovation Panel\\Dr. Mike Pownall, DVM';
const jackFolder =
  'C:\\Users\\Bizycorp_Work\\Pictures\\April 22nd\\Veterinary Technology & Innovation Panel\\Jack Peploe';

const mikeRenderedFolder = 'C:\\Users\\Bizycorp_Work\\Pictures\\April 22nd\\Mike Pownell\\Rendered PNGs';
const jackRenderedFolder = 'C:\\Users\\Bizycorp_Work\\Pictures\\April 22nd\\JAck PEploe\\Rendered PNGs';
const jackSubtitle = 'Veterinary IT Services & Certified Ethical Hacker';

function replaceFirst(content, fromList, to, label) {
  if (content.includes(to)) {
    return content;
  }

  for (const from of fromList) {
    if (content.includes(from)) {
      return content.replace(from, to);
    }
  }

  throw new Error(`Expected snippet not found for ${label}`);
}

function replaceOrInsertAfter(content, fromList, insertAfter, to, label) {
  if (content.includes(to)) {
    return content;
  }

  for (const from of fromList) {
    if (content.includes(from)) {
      return content.replace(from, to);
    }
  }

  if (content.includes(insertAfter)) {
    return content.replace(insertAfter, `${insertAfter}\n    ${to}`);
  }

  throw new Error(`Expected snippet not found for ${label}`);
}

function removeFirst(content, fromList, label) {
  for (const from of fromList) {
    if (content.includes(from)) {
      return content.replace(from, '');
    }
  }

  return content;
}

function updateMikeSolo(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = replaceFirst(content, config.nameFrom, config.nameTo, `${path.basename(filePath)} name`);
  content = replaceOrInsertAfter(
    content,
    config.roleLineFrom,
    config.nameTo,
    config.roleLineTo,
    `${path.basename(filePath)} role`
  );
  content = removeFirst(content, config.companyLineFrom, `${path.basename(filePath)} company`);

  fs.writeFileSync(filePath, content, 'utf8');
}

function updateJackShared(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = replaceFirst(content, config.nameFrom, config.nameTo, `${path.basename(filePath)} name`);
  content = replaceOrInsertAfter(
    content,
    config.roleLineFrom,
    config.nameTo,
    config.roleLineTo,
    `${path.basename(filePath)} role`
  );
  content = removeFirst(content, config.companyLineFrom, `${path.basename(filePath)} company`);

  fs.writeFileSync(filePath, content, 'utf8');
}

async function renderPng(filePath) {
  const pngPath = filePath.replace(/\.html$/i, '.png');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(filePath).href, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    await page.screenshot({
      path: pngPath,
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
    });
    await page.close();
  } finally {
    await browser.close();
  }
}

function syncRenderedPngs(sourceDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(sourceDir)) {
    if (!file.toLowerCase().endsWith('.png')) continue;
    fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
  }
}

function mikeRoleLine(style) {
  return `<div style="${style}">${mikeRoleFormatted}</div>`;
}

function updateJackSubtitle(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = replaceFirst(content, config.from, config.to, `${path.basename(filePath)} jack subtitle`);
  fs.writeFileSync(filePath, content, 'utf8');
}

const mikeSoloConfigs = [
  {
    file: 'B1_Intro_Dr__Mike_Pownall__DVM.html',
    nameFrom: [
      '<div style="font-size:48px;font-weight:800;color:#ffffff;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-size:42px;font-weight:800;color:#ffffff;line-height:1.08;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo: '<div style="font-size:42px;font-weight:800;color:#ffffff;line-height:1.08;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-size:30px;font-weight:600;color:#a7f3d0;margin-top:8px;">President</div>',
      '<div style="font-size:18px;font-weight:700;color:#a7f3d0;margin-top:10px;line-height:1.25;">Current Position and Organization -</div>',
      `<div style="font-size:14px;font-weight:500;color:#a7f3d0;margin-top:10px;opacity:0.92;line-height:1.35;max-width:430px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-size:18px;font-weight:600;color:#a7f3d0;margin-top:10px;opacity:0.96;line-height:1.28;max-width:470px;'
    ),
    companyLineFrom: [
      '<div style="font-size:24px;font-weight:500;color:#a7f3d0;margin-top:4px;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-size:14px;font-weight:500;color:#a7f3d0;margin-top:6px;opacity:0.92;line-height:1.35;max-width:430px;">${mikeRole}</div>`,
    ],
  },
  {
    file: 'B2_IntroPanel1_Dr__Mike_Pownall__DVM.html',
    nameFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.25;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo:
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:#a7f3d0;text-align:center;margin-top:6px;line-height:1.3;">President</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:700;color:#a7f3d0;text-align:center;margin-top:8px;line-height:1.25;max-width:320px;">Current Position and Organization -</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:8px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;color:#a7f3d0;text-align:center;margin-top:8px;line-height:1.25;opacity:0.96;max-width:390px;'
    ),
    companyLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:4px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
  },
  {
    file: 'B3_IntroPanel2_Dr__Mike_Pownall__DVM.html',
    nameFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#111827;text-align:center;margin-top:14px;line-height:1.25;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#111827;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo:
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#111827;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:#374151;text-align:center;margin-top:6px;line-height:1.3;">President</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:700;color:#374151;text-align:center;margin-top:8px;line-height:1.25;max-width:320px;">Current Position and Organization -</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#374151;text-align:center;margin-top:8px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;color:#374151;text-align:center;margin-top:8px;line-height:1.25;opacity:0.96;max-width:390px;'
    ),
    companyLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#374151;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#374151;text-align:center;margin-top:4px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
  },
  {
    file: 'B4_OneMoreDay_Dr__Mike_Pownall__DVM.html',
    nameFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-align:center;margin-top:20px;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:20px;line-height:1.15;max-width:320px;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo:
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:20px;line-height:1.15;max-width:320px;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:#f59e0b;text-align:center;margin-top:8px;">President</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:700;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.25;max-width:320px;">Current Position and Organization -</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.3;opacity:0.9;max-width:320px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.25;opacity:0.96;max-width:390px;'
    ),
    companyLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#f59e0b;text-align:center;margin-top:4px;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#f59e0b;text-align:center;margin-top:4px;line-height:1.3;opacity:0.9;max-width:320px;">${mikeRole}</div>`,
    ],
  },
  {
    file: 'B5_HappeningToday_Dr__Mike_Pownall__DVM.html',
    nameFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.25;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo:
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:#f59e0b;text-align:center;margin-top:6px;line-height:1.3;">President</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:700;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.25;max-width:320px;">Current Position and Organization -</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.25;opacity:0.96;max-width:390px;'
    ),
    companyLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#f59e0b;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#f59e0b;text-align:center;margin-top:4px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
  },
];

const jackSharedConfigs = [
  {
    file: 'B2_IntroPanel1_Jack_Peploe.html',
    nameFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.25;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo:
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:#a7f3d0;text-align:center;margin-top:6px;line-height:1.3;">President</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:700;color:#a7f3d0;text-align:center;margin-top:8px;line-height:1.25;max-width:320px;">Current Position and Organization -</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:8px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;color:#a7f3d0;text-align:center;margin-top:8px;line-height:1.25;opacity:0.96;max-width:390px;'
    ),
    companyLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:4px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
  },
  {
    file: 'B3_IntroPanel2_Jack_Peploe.html',
    nameFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#111827;text-align:center;margin-top:14px;line-height:1.25;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#111827;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo:
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#111827;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:#374151;text-align:center;margin-top:6px;line-height:1.3;">President</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:700;color:#374151;text-align:center;margin-top:8px;line-height:1.25;max-width:320px;">Current Position and Organization -</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#374151;text-align:center;margin-top:8px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;color:#374151;text-align:center;margin-top:8px;line-height:1.25;opacity:0.96;max-width:390px;'
    ),
    companyLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#374151;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#374151;text-align:center;margin-top:4px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
  },
  {
    file: 'B5_HappeningToday_Jack_Peploe.html',
    nameFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.25;">Dr. Mike Pownall, DVM</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    ],
    nameTo:
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;text-align:center;margin-top:14px;line-height:1.18;max-width:320px;">Mike Pownall DVM, MBA</div>',
    roleLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:#f59e0b;text-align:center;margin-top:6px;line-height:1.3;">President</div>',
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:700;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.25;max-width:320px;">Current Position and Organization -</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
    roleLineTo: mikeRoleLine(
      'font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:600;color:#f59e0b;text-align:center;margin-top:8px;line-height:1.25;opacity:0.96;max-width:390px;'
    ),
    companyLineFrom: [
      '<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#f59e0b;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">McKee-Pownall Equine Services</div>',
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;font-weight:500;color:#f59e0b;text-align:center;margin-top:4px;line-height:1.3;opacity:0.9;max-width:330px;">${mikeRole}</div>`,
    ],
  },
];

const jackSubtitleConfigs = [
  {
    filePath: path.join(jackFolder, 'B1_Intro_Jack_Peploe.html'),
    from: [
      `<div style="font-size:24px;font-weight:500;color:#a7f3d0;margin-top:4px;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-size:24px;font-weight:600;color:#a7f3d0;margin-top:4px;line-height:1.25;">${jackSubtitle}</div>`,
  },
  {
    filePath: path.join(jackFolder, 'B2_IntroPanel1_Jack_Peploe.html'),
    from: [
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:#a7f3d0;text-align:center;margin-top:2px;line-height:1.3;">${jackSubtitle}</div>`,
  },
  {
    filePath: path.join(jackFolder, 'B3_IntroPanel2_Jack_Peploe.html'),
    from: [
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#374151;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:#374151;text-align:center;margin-top:2px;line-height:1.3;">${jackSubtitle}</div>`,
  },
  {
    filePath: path.join(jackFolder, 'B4_OneMoreDay_Jack_Peploe.html'),
    from: [
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#f59e0b;text-align:center;margin-top:4px;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:#f59e0b;text-align:center;margin-top:4px;line-height:1.25;">${jackSubtitle}</div>`,
  },
  {
    filePath: path.join(jackFolder, 'B5_HappeningToday_Jack_Peploe.html'),
    from: [
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#f59e0b;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:#f59e0b;text-align:center;margin-top:2px;line-height:1.3;">${jackSubtitle}</div>`,
  },
  {
    filePath: path.join(mikeFolder, 'B2_IntroPanel1_Dr__Mike_Pownall__DVM.html'),
    from: [
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#a7f3d0;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:#a7f3d0;text-align:center;margin-top:2px;line-height:1.3;">${jackSubtitle}</div>`,
  },
  {
    filePath: path.join(mikeFolder, 'B3_IntroPanel2_Dr__Mike_Pownall__DVM.html'),
    from: [
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#374151;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:#374151;text-align:center;margin-top:2px;line-height:1.3;">${jackSubtitle}</div>`,
  },
  {
    filePath: path.join(mikeFolder, 'B5_HappeningToday_Dr__Mike_Pownall__DVM.html'),
    from: [
      `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:#f59e0b;text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;">${jackSubtitle}</div>`,
    ],
    to: `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:#f59e0b;text-align:center;margin-top:2px;line-height:1.3;">${jackSubtitle}</div>`,
  },
];

async function main() {
  for (const config of mikeSoloConfigs) {
    const filePath = path.join(mikeFolder, config.file);
    updateMikeSolo(filePath, config);
    await renderPng(filePath);
    console.log(`Updated ${config.file}`);
  }

  for (const config of jackSharedConfigs) {
    const filePath = path.join(jackFolder, config.file);
    updateJackShared(filePath, config);
    await renderPng(filePath);
    console.log(`Updated ${config.file}`);
  }

  for (const config of jackSubtitleConfigs) {
    updateJackSubtitle(config.filePath, config);
    await renderPng(config.filePath);
    console.log(`Updated ${path.basename(config.filePath)}`);
  }

  syncRenderedPngs(mikeFolder, mikeRenderedFolder);
  syncRenderedPngs(jackFolder, jackRenderedFolder);
  console.log('Rendered PNG folders refreshed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
