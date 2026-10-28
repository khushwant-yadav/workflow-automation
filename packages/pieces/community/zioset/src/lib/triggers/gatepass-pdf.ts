import { PDFDocument, PDFFont, PDFName, PDFPage, PDFString, StandardFonts, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';

// ---------- page ----------
const PAGE_W = 594.96;
const PAGE_H = 841.92;

// ---------- colours ----------
const BLACK = rgb(0, 0, 0);
const GREY_TEXT = rgb(0.2, 0.2, 0.2); // #333
const TITLE_BLUE = rgb(0.102, 0.451, 0.9098); // #1A73E8
const RED = rgb(0.898, 0.2235, 0.2078); // #E53935
const HEAD_GREY = rgb(0.6706, 0.6706, 0.6706); // #ABABAB
const BORDER = rgb(0.8667, 0.8667, 0.8667); // #DDD
const LINK_BLUE = rgb(0, 0, 0.9333); // #0000EE
const WHITE = rgb(1, 1, 1);

// ---------- sizes ----------
const FS = 7.4; // body / labels
const FS_TITLE = 10.36;
const FS_SECTION = 8.65; // "Item Details"
const FS_TABLE = 6.66;
const FS_COMPANY = 8.88;
const FS_CHROME = 7.99; // browser header / footer (optional)

// ---------- columns ----------
const X_LEFT = 43.29;
const X_RIGHT = 309.22;
const CARD_CENTER_X = 305.5;

// Baselines in PDF coordinates (origin bottom-left), copied from the reference.
const Y = {
    company: 793.4,
    title: 753.5,
    row1: 729.8,
    row2: 702.5,
    row3: 675.1,
    row4: 647.7,
    customer: 620.4,
    itemDetails: 598.2,
    tableHead: 576.7,
    timeOut: 539.0,
    issuing: 523.5,
    expected: 507.9,
    signLabel: 458.4,
    signName: 442.8,
    termsTitle: 403.6,
    termsIntro: 388.1,
    certify1: 259.4,
    certify2: 251.2,
    forZensar: 235.7,
    disclaimer1: 220.2,
    disclaimer2: 212.0,
    website: 41.2,
};

// numbered list baselines (items 1..13)
const TERM_BASELINES = [372.6, 364.4, 356.3, 348.1, 340.0, 331.9, 323.7, 315.6, 307.5, 299.3, 291.2, 283.0, 274.9];
const TERM_TEXT_X = 72.88; // where the text after "N. " starts (markers are right-aligned to it)

const TERMS = [
    'I have checked the {item} and it is in good working condition.',
    'Use of the {Item} is governed by Zensar policy on ethical use of IT resources and hence it must be used for business purposes only.',
    'The {Item} will not be left unattended in cars parked at public places and should always be carried as hand baggage when traveling.',
    'Important files and data should be backed up and stored at an alternate location.',
    'The data contained in the {item} will adhere to the confidentiality agreement of the company.',
    'Anti-virus/windows patches should be regularly updated.',
    'The {item} will not be exposed to any environment or situation which will damage or harm the equipment resulting in malfunction of the equipment.',
    'The user will always carry the gate pass of the equipment with him/her.',
    'The user will ensure cleanliness of the {item}.',
    'Temporary assignment of {Item} should be returned within the stipulated period.',
    'The user might lose the facility of using the {item} if found misusing or mishandling the same.',
    'Any damage to this {item} will be charged to the respective user.',
    'Latest Anti-virus DAT should be installed on the {item}.',
];

const INTRO_TAIL =
    ', will ensure the safety of the {Item} provided to me by Zensar Technologies Ltd adhere to the following policy:';

// "{Item} Computer" only reads right for laptop/desktop; other kinds just use the name
const CERTIFY_TEXT =
    'This is to certify that the {ItemComputer}, as per the specifications mentioned below, is the property of Zensar Technologies and I am authorized to take this equipment temporarily outside the bonded area and bring it back to the unit.';

const DISCLAIMER_TEXT =
    'This gate pass is a computer-generated/automated document, it may or may not carry any specific signatures, however, the presence or absence of any such signatures on the same shall not render it invalid.';

const TERM_LINE_PITCH = 8.142; // wrapped continuation lines inside the list
const PARA_LINE_PITCH = 8.2; // certify / disclaimer paragraphs

// ---------- table geometry (top-based coordinates, measured) ----------
const TABLE = {
    top: 254.1,
    rowPitch: 17.0, // one single-line row
    border: 0.75,
    colBorderX: [43.3, 173.5, 319.9, 441.3, 567.05], // left edge of every vertical border
    right: 567.8,
    textX: [48.47, 178.37, 325.3, 446.34],
    textInsetTop: 11.1, // cell top -> text baseline
    lineHeight: 7.66,
    padRight: 4.5,
};

// ---------- card ----------
const CARD = { left: 35.9, right: 575.1, top: 62.5, bottom: 643.2, radius: 6 };
const SHADOW_CLIP_X = 566.8;

// ---------- QR ----------
const QR = { left: 43.3, top: 350.3, size: 74 };

// ---------- signature ----------
const SIGN_X = 498.66;

export interface GatePassItem {
    assetNo?: string;
    description?: string;
    serialNo?: string;
    type?: string;
}

export interface GatePassData {
    gatePassNo?: string;
    gateReturnType?: string; // "Returnable" | "Non Returnable"
    gateType?: string; // "Allocation"
    gatePassFor?: string;
    deliveryMode?: string;
    customerName?: string;
    staffId?: string;
    userName?: string;
    projectCode?: string;
    projectManager?: string;
    location?: string;
    timeOut?: string;
    issuingDate?: string;
    expectedReturnDate?: string;
    authorizedBy?: string; // default "System Admin"
    websiteUrl?: string; // optional link for "Visit Our Website"
    items?: GatePassItem[];
    [key: string]: any;
}

export interface GatePassPdfOptions {
    includeBrowserHeaderFooter?: boolean;
}



// ---------- helpers ----------
const s = (v: unknown): string => (v === undefined || v === null ? '' : String(v));

/** Helvetica only supports WinAnsi; swap anything it cannot encode for "?" so PDF creation never fails. */
function safe(font: PDFFont, text: string): string {
    let out = '';
    for (const ch of text) {
        try {
            font.encodeText(ch);
            out += ch;
        } catch {
            out += '?';
        }
    }
    return out;
}

/**
 * Kerning pairs (1/1000 em) measured from the reference PDF. Chrome applied Arial's kerning there,
 * while pdf-lib only knows Helvetica's AFM pairs (different values), so we carry our own table.
 * Pairs that are not listed are not kerned.
 */
const KERN: Record<string, Record<string, number>> = {
    regular: {
        ' T': -5, 'T ': -18, ' A': -33, LT: -74, AT: -74, Te: -111, 'y.': -74, 'r.': -55, 'r,': -55, 'w,': -55, Vi: -18, We: -19,
    },
    bold: { '11': -55, Ty: -75, Te: -75, Ti: -18 },
    italic: {},
    boldItalic: { ' A': -37 },
};
const fontKind = new WeakMap<PDFFont, string>();
const kernOf = (font: PDFFont, a: string, b: string, size: number): number =>
    ((KERN[fontKind.get(font) ?? 'regular'] ?? {})[a + b] ?? 0) * size / 1000;

/** Text width: glyph advances plus the kerning table above. */
function tw(font: PDFFont, text: string, size: number): number {
    const chars = [...text];
    let w = 0;
    for (let i = 0; i < chars.length; i++) {
        w += font.widthOfTextAtSize(chars[i], size);
        if (i > 0) w += kernOf(font, chars[i - 1], chars[i], size);
    }
    return w;
}

/**
 * pdf-lib's drawText() does no kerning. Draw in segments and shift each segment by the kerning
 * value so glyph positions match the browser-rendered reference.
 */
function drawKerned(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) {
    const chars = [...text];
    let seg = '';
    let segX = x;
    let pen = x;
    const flush = () => {
        if (seg) page.drawText(seg, { x: segX, y, font, size, color });
        seg = '';
    };
    for (let i = 0; i < chars.length; i++) {
        if (i > 0) {
            const k = kernOf(font, chars[i - 1], chars[i], size);
            if (k !== 0) {
                flush();
                pen += k;
                segX = pen;
            }
        }
        seg += chars[i];
        pen += font.widthOfTextAtSize(chars[i], size);
    }
    flush();
}

function roundedRectPath(w: number, h: number, r: number): string {
    return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (tw(font, test, size) <= maxWidth || !line) {
            line = test;
            // hard-break a single word that is wider than the cell
            while (tw(font, line, size) > maxWidth && line.length > 1) {
                let cut = line.length - 1;
                while (cut > 1 && tw(font, line.slice(0, cut), size) > maxWidth) cut--;
                lines.push(line.slice(0, cut));
                line = line.slice(cut);
            }
        } else {
            lines.push(line);
            line = word;
        }
    }
    lines.push(line);
    return lines;
}

// ---------- main ----------
export async function buildGatePassPdf(gp: GatePassData, options: GatePassPdfOptions = {}): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    pdf.setTitle('Gatepass Details');
    const page = pdf.addPage([PAGE_W, PAGE_H]);

    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const boldItalic = await pdf.embedFont(StandardFonts.HelveticaBoldOblique);
    fontKind.set(regular, 'regular');
    fontKind.set(bold, 'bold');
    fontKind.set(italic, 'italic');
    fontKind.set(boldItalic, 'boldItalic');

    const text = (t: string, x: number, y: number, font: PDFFont, size: number, color = GREY_TEXT) =>
        drawKerned(page, safe(font, t), x, y, font, size, color);

    /** "Label: value" – bold black label, one space, then value in #333 (or custom font/colour). */
    const labelValue = (
        label: string,
        value: string,
        x: number,
        y: number,
        valueFont: PDFFont = regular,
        valueColor = GREY_TEXT,
    ) => {
        text(label, x, y, bold, FS, BLACK);
        const vx = x + tw(bold, safe(bold, label), FS) + tw(regular, ' ', FS);
        if (value) text(value, vx, y, valueFont, FS, valueColor);
    };

    // ---------- rows & table height (the page is a flow layout: extra rows push everything below down) ----------
    const items: GatePassItem[] = Array.isArray(gp.items) && gp.items.length ? gp.items : [{}];
    const colTextX = TABLE.textX;
    const colEdge = [...TABLE.colBorderX.slice(1, 4), TABLE.right];
    const rows = items.map((it) => {
        const cells = [s(it.assetNo), s(it.description), s(it.serialNo), s(it.type)];
        const wrapped = cells.map((c, i) =>
            wrapText(regular, safe(regular, c), FS_TABLE, colEdge[i] - colTextX[i] - TABLE.padRight),
        );
        const lineCount = Math.max(...wrapped.map((w) => w.length));
        return { wrapped, height: TABLE.rowPitch + (lineCount - 1) * TABLE.lineHeight };
    });
    const bodyHeight = rows.reduce((a, r) => a + r.height, 0);
    const dy = bodyHeight - TABLE.rowPitch; // growth versus the reference (one single-line row)
    const below = (y: number) => y - dy; // everything under the table moves down by dy

    // ---------- dynamic legal text (asset kind) + wrapping ----------
    const itemName = s(gp.gatePassFor).trim() || 'Laptop';
    const itemCap = itemName.charAt(0).toUpperCase() + itemName.slice(1);
    const itemLow = itemName.toLowerCase();
    const fill = (str: string) =>
        str
            .replace(/\{ItemComputer\}/g, /^(laptop|desktop)$/i.test(itemName) ? `${itemCap} Computer` : itemCap)
            .replace(/\{Item\}/g, itemCap)
            .replace(/\{item\}/g, itemLow);

    const termLines = TERMS.map((t) => wrapText(regular, safe(regular, fill(t)), FS, TABLE.right - TERM_TEXT_X));
    const certifyLines = wrapText(regular, safe(regular, fill(CERTIFY_TEXT)), FS, TABLE.right - X_LEFT);
    const disclaimerLines = wrapText(regular, safe(regular, fill(DISCLAIMER_TEXT)), FS, TABLE.right - X_LEFT);

    // extra height versus the reference (13 one-line terms, 2-line certify, 2-line disclaimer)
    const termsExtra = termLines.reduce((a, l) => a + (l.length - 1) * TERM_LINE_PITCH, 0);
    const certifyExtra = (certifyLines.length - 2) * PARA_LINE_PITCH;
    const disclaimerExtra = (disclaimerLines.length - 2) * PARA_LINE_PITCH;
    const textExtra = termsExtra + certifyExtra + disclaimerExtra;

    // ---------- card shadow (reference uses a soft bitmap shadow; approximated with stacked translucent layers) ----------
    const cardBottom = CARD.bottom + dy + textExtra;
    const cardW = CARD.right - CARD.left;
    const cardH = cardBottom - CARD.top;
    const SHADOW_LAYERS = 8;
    for (let i = SHADOW_LAYERS; i >= 1; i--) {
        const e = i * 0.75;
        page.drawSvgPath(roundedRectPath(cardW + e * 2 + 20, cardH + e * 2, CARD.radius + e), {
            x: CARD.left - e,
            y: PAGE_H - (CARD.top - e + 1.2),
            color: BLACK,
            opacity: 0.003,
            borderWidth: 0,
        });
    }
    // the reference shadow is clipped at x = 566.8 pt – nothing beyond it
    page.drawRectangle({ x: SHADOW_CLIP_X, y: 0, width: PAGE_W - SHADOW_CLIP_X, height: PAGE_H, color: WHITE });
    page.drawSvgPath(roundedRectPath(cardW, cardH, CARD.radius), {
        x: CARD.left,
        y: PAGE_H - CARD.top,
        color: WHITE,
        borderWidth: 0,
    });

    // ---------- header ----------
    text('ZENSAR TECHNOLOGIES LTD.', 426.03, Y.company, regular, FS_COMPANY);

    const title = `Gatepass ${s(gp.gateReturnType) || 'Returnable'}`;
    const titleW = tw(bold, safe(bold, title), FS_TITLE);
    text(title, CARD_CENTER_X - titleW / 2, Y.title, bold, FS_TITLE, TITLE_BLUE);

    // ---------- details grid ----------
    const userDisplay = gp.userName ? `${s(gp.userName)}${gp.staffId ? ` (${s(gp.staffId)})` : ''}` : '';

    labelValue('Gatepass No:', s(gp.gatePassNo), X_LEFT, Y.row1, bold, RED);
    labelValue('Staff Id:', s(gp.staffId), X_RIGHT, Y.row1);

    labelValue('Gatepass User:', userDisplay, X_LEFT, Y.row2);
    labelValue('Project Code:', s(gp.projectCode), X_RIGHT, Y.row2);

    labelValue('Project Manager:', s(gp.projectManager), X_LEFT, Y.row3);
    labelValue('Location:', s(gp.location), X_RIGHT, Y.row3);

    labelValue('Delivery Mode:', s(gp.deliveryMode), X_LEFT, Y.row4);
    labelValue('Gatepass Type:', s(gp.gateType), X_RIGHT, Y.row4);

    labelValue('Customer Name:', s(gp.customerName), X_LEFT, Y.customer);

    text('Item Details', X_LEFT, Y.itemDetails, bold, FS_SECTION);

    // ---------- item table ----------
    const heads = ['Asset No.', 'Description', 'Serial No.', 'Type'];
    const vLine = (x: number, topY: number, bottomY: number) =>
        page.drawRectangle({
            x,
            y: PAGE_H - bottomY,
            width: TABLE.border,
            height: bottomY - topY,
            color: BORDER,
        });
    const hLine = (topY: number) =>
        page.drawRectangle({
            x: TABLE.colBorderX[0],
            y: PAGE_H - (topY + TABLE.border),
            width: TABLE.right - TABLE.colBorderX[0],
            height: TABLE.border,
            color: BORDER,
        });

    // header row (17.8 tall incl. borders)
    let rowTop = TABLE.top;
    const cellBox = (top: number, h: number) => {
        hLine(top);
        hLine(top + h - TABLE.border);
        TABLE.colBorderX.forEach((x) => vLine(x, top, top + h));
    };
    cellBox(rowTop, TABLE.rowPitch + 0.8);
    heads.forEach((h, i) => text(h, colTextX[i], PAGE_H - (rowTop + TABLE.textInsetTop), bold, FS_TABLE, HEAD_GREY));

    // body rows
    rowTop += TABLE.rowPitch;
    rows.forEach((r) => {
        cellBox(rowTop, r.height + 0.8);
        r.wrapped.forEach((lines, i) =>
            lines.forEach((ln, li) =>
                text(
                    ln,
                    colTextX[i],
                    PAGE_H - (rowTop + TABLE.textInsetTop + li * TABLE.lineHeight),
                    regular,
                    FS_TABLE,
                ),
            ),
        );
        rowTop += r.height;
    });

    // ---------- time / dates ----------
    labelValue('Time Out (24Hrs Format):', s(gp.timeOut), X_LEFT, below(Y.timeOut));
    labelValue('Issuing Date:', s(gp.issuingDate), X_LEFT, below(Y.issuing));
    labelValue('Expected Return Dates:', s(gp.expectedReturnDate), X_LEFT, below(Y.expected));

    // ---------- QR (encodes the gate pass number) ----------
    const qrValue = s(gp.gatePassNo);
    if (qrValue) {
        const qr = QRCode.create(qrValue, { errorCorrectionLevel: 'L' });
        const n: number = qr.modules.size;
        const m = QR.size / n;
        const qrTop = QR.top + dy;
        for (let r = 0; r < n; r++) {
            let c = 0;
            while (c < n) {
                if (qr.modules.get(r, c)) {
                    let end = c;
                    while (end + 1 < n && qr.modules.get(r, end + 1)) end++;
                    // merge horizontal runs so there are no hairline seams between modules
                    page.drawRectangle({
                        x: QR.left + c * m,
                        y: PAGE_H - (qrTop + (r + 1) * m),
                        width: (end - c + 1) * m,
                        height: m,
                        color: BLACK,
                    });
                    c = end + 1;
                } else {
                    c++;
                }
            }
        }
    }

    // ---------- authorised signature (right of QR) ----------
    text('Authorized Signature', SIGN_X, below(Y.signLabel), italic, FS);
    text(s(gp.authorizedBy) || 'System Admin', SIGN_X, below(Y.signName), boldItalic, FS, BLACK);

    // ---------- terms & conditions ----------
    text('Terms and Conditions', X_LEFT, below(Y.termsTitle), bold, FS, BLACK);

    // "I, **Name (id)**, will ensure ..."
    {
        const y = below(Y.termsIntro);
        const name = userDisplay;
        let x = X_LEFT;
        const part1 = 'I, ';
        text(part1, x, y, regular, FS);
        x += tw(regular, part1, FS);
        text(name, x, y, bold, FS, BLACK);
        x += tw(bold, safe(bold, name), FS);
        text(fill(INTRO_TAIL), x, y, regular, FS);
    }

    // numbered terms (markers right-aligned to the text column, continuation lines wrap under the text)
    let shift = 0; // how far everything below has been pushed down by wrapped lines
    termLines.forEach((lines, i) => {
        const marker = `${i + 1}. `;
        const baseY = below(TERM_BASELINES[i]) - shift;
        text(marker, TERM_TEXT_X - tw(regular, marker, FS), baseY, regular, FS);
        lines.forEach((ln, li) => text(ln, TERM_TEXT_X, baseY - li * TERM_LINE_PITCH, regular, FS));
        shift += (lines.length - 1) * TERM_LINE_PITCH;
    });

    certifyLines.forEach((ln, i) => text(ln, X_LEFT, below(Y.certify1) - shift - i * PARA_LINE_PITCH, regular, FS));
    shift += certifyExtra;

    text('For Zensar Technologies Ltd.', X_LEFT, below(Y.forZensar) - shift, bold, FS, BLACK);

    disclaimerLines.forEach((ln, i) =>
        text(ln, X_LEFT, below(Y.disclaimer1) - shift - i * PARA_LINE_PITCH, regular, FS),
    );

    // ---------- "Visit Our Website" (blue, underlined, fixed at page bottom) ----------
    const linkLabel = 'Visit Our Website';
    const linkX = 283.99;
    const linkW = tw(regular, linkLabel, FS_TABLE);
    text(linkLabel, linkX, Y.website, regular, FS_TABLE, LINK_BLUE);
    page.drawRectangle({ x: linkX, y: PAGE_H - 802.2, width: linkW, height: 0.7, color: LINK_BLUE });
    if (gp.websiteUrl) {
        addLink(pdf, page, linkX, Y.website - 1.5, linkW, 8.5, String(gp.websiteUrl));
    }else {
        addLink(pdf, page, linkX, Y.website - 1.5, linkW, 8.5, 'https://www.zensar.com/');
    }

    // ---------- optional Chrome print header / footer ----------
    if (options.includeBrowserHeaderFooter) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const h12 = now.getHours() % 12 || 12;
        const stamp = `${now.getMonth() + 1}/${now.getDate()}/${yy}, ${h12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
        text(stamp, 24, 819.4, regular, FS_CHROME, BLACK);
        text('Gatepass Details', 314.82, 819.4, regular, FS_CHROME, BLACK);
        text('about:blank', 24, 16.2, regular, FS_CHROME, BLACK);
        text('1/1', 560.06, 16.2, regular, FS_CHROME, BLACK);
    }

    return pdf.save();
}

function addLink(pdf: PDFDocument, page: PDFPage, x: number, y: number, w: number, h: number, url: string) {
    const ctx = pdf.context;
    const annot = ctx.register(
        ctx.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [x, y, x + w, y + h],
            Border: [0, 0, 0],
            A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
        }),
    );
    page.node.set(PDFName.of('Annots'), ctx.obj([annot]));
}