import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';

export const dailyAssetReport = createAction({
    auth: zioSetAuth,
    name: 'daily_asset_report',
    displayName: 'Get Daily Asset Report',
    description: 'Gets the daily asset report (HTML body, Excel file, recipients) ready to send as an email',
    props: {
        includeExcel: Property.Checkbox({
            displayName: 'Include Excel',
            required: false,
            defaultValue: true,
        }),
        includeHtml: Property.Checkbox({
            displayName: 'Include HTML Body (from email template)',
            required: false,
            defaultValue: true,
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
            url: `${baseUrl}/workflow/reports/dailyAssetReport`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: {
                includeExcel: String(includeExcel ?? true),
                includeHtml: String(includeHtml ?? true),
            },
        });

        if (response.body.code !== 200) {
            throw new Error(`Daily asset report failed: ${response.body.message}`);
        }

        const d = response.body.data;

        let excelFile: string | null = null;
        if (d.excelBase64) {
            excelFile = await context.files.write({
                fileName: d.excelFileName ?? 'Daily_Asset_Report.xlsx',
                data: Buffer.from(d.excelBase64, 'base64'),
            });
        }

        const { excelBase64, ...rest } = d;   // bada base64 output mein repeat nahi karna
        return { ...rest, excelFile };
    },
});