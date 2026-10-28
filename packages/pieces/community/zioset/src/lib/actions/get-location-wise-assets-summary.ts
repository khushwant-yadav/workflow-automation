import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');

function buildHtml(opts: {
    title: string;
    dateStr: string;
    totals: { total: number; allocated: number; available: number };
    rows: { name: string; total: number; allocated: number; available: number }[];
}): string {
    const { title, dateStr, totals, rows } = opts;

    const pct = (a: number, t: number) => (t > 0 ? Math.round((a / t) * 100) : 0);

    const tableRows = rows
        .map((r, i) => {
            const p = pct(r.allocated, r.total);
            return `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Location" class="name">${esc(r.name)}</td>
  <td data-label="Total" class="num">${num(r.total)}</td>
  <td data-label="Allocated" class="num">${num(r.allocated)}</td>
  <td data-label="Available" class="num">${num(r.available)}</td>
  <td data-label="Utilisation" class="bar">
    <div class="track"><div class="fill" style="width:${p}%"></div></div>
    <span class="pct">${p}%</span>
  </td>
</tr>`;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;}
  .wrap{width:100%;padding:24px 12px;box-sizing:border-box;}
  .card{max-width:760px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-total .v{color:#1d4ed8;} .k-alloc .v{color:#ea580c;} .k-avail .v{color:#16a34a;}
  table.data{width:100%;border-collapse:collapse;font-size:14px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .track{display:inline-block;width:90px;height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;vertical-align:middle;}
  .fill{height:8px;background:linear-gradient(90deg,#f59e0b,#ea580c);}
  .pct{font-size:12px;color:#475569;margin-left:6px;}
  .note{margin-top:18px;font-size:13px;color:#475569;line-height:1.5;}
  .footer{background:#f1f5f9;text-align:center;padding:16px;font-size:12px;color:#94a3b8;}

  @media only screen and (max-width:600px){
    .header{padding:22px 16px;} .content{padding:16px;}
    .kpis,.kpis tbody,.kpis tr,.kpis td{display:block;width:100%;}
    .kpis{border-spacing:0;margin:0 0 12px;}
    .kpis td{margin-bottom:10px;}
    table.data thead{display:none;}
    table.data,table.data tbody,table.data tr,table.data td{display:block;width:100%;box-sizing:border-box;}
    table.data tr{margin-bottom:12px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;}
    table.data tr.alt td{background:#fff;}
    table.data td{display:flex;justify-content:space-between;align-items:center;text-align:right;border-bottom:1px solid #f1f5f9;padding:9px 12px;}
    table.data td:last-child{border-bottom:none;}
    table.data td:before{content:attr(data-label);font-weight:600;color:#64748b;text-align:left;font-size:12px;text-transform:uppercase;}
    td.name{background:#eef2ff;color:#3730a3;font-size:15px;}
    td.name:before{content:'';}
    td.name{justify-content:flex-start;}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <h1>${esc(title)}</h1>
      <p>As on ${esc(dateStr)}</p>
    </div>
    <div class="content">
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-total"><span class="v">${num(totals.total)}</span><span class="l">Total</span></td>
        <td class="kpi k-alloc"><span class="v">${num(totals.allocated)}</span><span class="l">Allocated</span></td>
        <td class="kpi k-avail"><span class="v">${num(totals.available)}</span><span class="l">Available</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th>Location</th><th class="num">Total</th><th class="num">Allocated</th><th class="num">Available</th><th>Utilisation</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>

      <p class="note">The detailed location-wise data is attached as an Excel file with this email.</p>
    </div>
    <div class="footer">This is an automated report. Please do not reply to this email.</div>
  </div>
</div>
</body>
</html>`;
}

export const locationWiseSummary = createAction({
    auth: zioSetAuth,
    name: 'location_wise_summary',
    displayName: 'Location Wise Asset Summary',
    description: 'Gets location-wise Total / Allocated / Available counts. Optionally builds an Excel file and a responsive email body',
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Location Wise Asset Summary',
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'name',
            options: {
                options: [
                    { label: 'Location Name', value: 'name' },
                    { label: 'Total (high to low)', value: 'total' },
                    { label: 'Allocated (high to low)', value: 'allocated' },
                    { label: 'Available (high to low)', value: 'available' },
                ],
            },
        }),
        generateExcel: Property.Checkbox({
            displayName: 'Generate Excel',
            description: 'Turn ON to create the Excel file (Name, Total, Allocated, Available)',
            required: false,
            defaultValue: true,
        }),
        generateEmailTemplate: Property.Checkbox({
            displayName: 'Generate Email Template',
            description: 'Turn ON to create the responsive HTML email body',
            required: false,
            defaultValue: true,
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const title = context.propsValue.title || 'Location Wise Asset Summary';
        const sortBy = (context.propsValue.sortBy as string) || 'name';
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const res = await httpClient.sendRequest<any[]>({
            method: HttpMethod.GET,
            url: `${baseUrl}/common/allList`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: { tableName: 'Location' },
        });

        const raw: any[] = Array.isArray(res.body) ? res.body : [];
        let rows = raw
            .filter(r => r && String(r.name ?? '').trim() !== '')
            .map(r => ({
                name: String(r.name).trim(),
                total: Number(r.total ?? 0),
                allocated: Number(r.allocated ?? 0),
                available: Number(r.available ?? 0),
            }));

        rows = rows.sort((a, b) =>
            sortBy === 'name' ? a.name.localeCompare(b.name) : (b as any)[sortBy] - (a as any)[sortBy]
        );

        const totals = rows.reduce(
            (s, r) => ({
                total: s.total + r.total,
                allocated: s.allocated + r.allocated,
                available: s.available + r.available,
            }),
            { total: 0, allocated: 0, available: 0 }
        );

        const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

        // ---- Excel (sirf jab toggle ON ho) ----
        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Location Summary');
            ws.columns = [
                { header: 'Name', key: 'name', width: 28 },
                { header: 'Total', key: 'total', width: 12 },
                { header: 'Allocated', key: 'allocated', width: 12 },
                { header: 'Available', key: 'available', width: 12 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            rows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({ name: 'Total', ...totals });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Location_Wise_Asset_Summary_${dateStr}.xlsx`;
            excelFile = await context.files.write({
                fileName: excelFileName,
                data: Buffer.from(buffer as ArrayBuffer),
            });
        }

        // ---- Email template ----
        let htmlBody: string | null = null;
        if (generateEmailTemplate) {
            htmlBody = buildHtml({ title, dateStr, totals, rows });
        }

        return {
            title,
            reportDate: dateStr,
            totalLocations: rows.length,
            totals,
            rows,
            hasData: rows.length > 0,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});