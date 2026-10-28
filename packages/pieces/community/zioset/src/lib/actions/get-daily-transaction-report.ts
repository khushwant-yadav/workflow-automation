import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';

export const dailyTransactionReport = createAction({
    auth: zioSetAuth,
    name: 'daily_transaction_report',
    displayName: 'Get Daily Assets Transaction Report',
    description: 'Gets the daily allocation/deallocation report (HTML body, Excel file, recipients) ready to send as an email',
    props: {
        includeExcel: Property.Checkbox({
            displayName: 'Include Excel',
            description: 'Allocations and DeAllocations in a 2-sheet Excel file',
            required: false,
            defaultValue: true,
        }),
        includeHtml: Property.Checkbox({
            displayName: 'Include HTML Body (from email template)',
            description: 'Email body rendered from the "Daily Transaction Report" template',
            required: false,
            defaultValue: false,
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const { includeExcel, includeHtml } = context.propsValue;

        const response = await httpClient.sendRequest<{
            code: number;
            message: string;
            data: any;
        }>({
            method: HttpMethod.GET,
            url: `${baseUrl}/workflow/reports/dailyTransactionReport`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: {
                includeExcel: String(includeExcel ?? true),
                includeHtml: String(includeHtml ?? true),
            },
        });

        if (response.body.code !== 200) {
            throw new Error(`Daily transaction report failed: ${response.body.message}`);
        }

        const d = response.body.data;

        let excelFile: string | null = null;
        if (d.excelBase64) {
            excelFile = await context.files.write({
                fileName: d.excelFileName ?? 'Daily_Transaction_Report.xlsx',
                data: Buffer.from(d.excelBase64, 'base64'),
            });
        }

        // Bada base64 output mein repeat nahi karna
        const { excelBase64, ...rest } = d;
        return { ...rest, excelFile };
    },
});