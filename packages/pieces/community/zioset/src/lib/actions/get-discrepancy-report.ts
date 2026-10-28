import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';

export const discrepancyReport = createAction({
    auth: zioSetAuth,
    name: 'discrepancy_report',
    displayName: 'Get Discrepancy Report',
    description: 'Gets all asset discrepancy data (summary + multi-sheet Excel) ready to send as an email',
    props: {
        includeExcel: Property.Checkbox({
            displayName: 'Include Excel',
            required: false,
            defaultValue: true,
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const { includeExcel } = context.propsValue;

        const response = await httpClient.sendRequest<{ code: number; message: string; data: any }>({
            method: HttpMethod.GET,
            url: `${baseUrl}/discrepancy/reports/discrepancyReport`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: { includeExcel: String(includeExcel ?? true) },
        });

        if (response.body.code !== 200) {
            throw new Error(`Discrepancy report failed: ${response.body.message}`);
        }

        const d = response.body.data;

        let excelFile: string | null = null;
        if (d.excelBase64) {
            excelFile = await context.files.write({
                fileName: d.excelFileName ?? 'Discrepancy_Report.xlsx',
                data: Buffer.from(d.excelBase64, 'base64'),
            });
        }

        // Email body (summary table)
        const rows = (d.summary as any[])
            .map(r => `<tr><td style="border:1px solid #ccc;padding:4px">${r.srNo}</td><td style="border:1px solid #ccc;padding:4px">${r.discrepancy}</td><td style="border:1px solid #ccc;padding:4px">${r.count}</td></tr>`)
            .join('');
        const htmlBody = `<p>Asset Discrepancy Report (${d.reportDate})</p>
<p>Total discrepancies: <b>${d.totalDiscrepancies}</b></p>
<table style="border-collapse:collapse"><tr><th>Sr</th><th>Discrepancy</th><th>Count</th></tr>${rows}</table>
<p>Detailed data is attached in the Excel file.</p>`;

        const { excelBase64, ...rest } = d;
        return { ...rest, htmlBody, excelFile };
    },
});