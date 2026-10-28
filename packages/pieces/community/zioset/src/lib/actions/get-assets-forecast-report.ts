import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';

export const assetForecastReport = createAction({
    auth: zioSetAuth,
    name: 'asset_forecast_report',
    displayName: 'Get Asset Forecast Report',
    description: 'Gets the asset forecast report (HTML body from template, recipients, optional Excel) ready to send as an email',
    props: {
        includeHtml: Property.Checkbox({
            displayName: 'Include HTML Body (from email template)',
            required: false,
            defaultValue: true,
        }),
        includeExcel: Property.Checkbox({
            displayName: 'Include Excel',
            description: 'Existing mail me Excel nahi jaata, isliye default OFF',
            required: false,
            defaultValue: false,
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const { includeHtml, includeExcel } = context.propsValue;

        const response = await httpClient.sendRequest<{ code: number; message: string; data: any }>({
            method: HttpMethod.GET,
            url: `${baseUrl}/workflow/reports/assetForecastReport`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: {
                includeHtml: String(includeHtml ?? true),
                includeExcel: String(includeExcel ?? false),
            },
        });

        if (response.body.code !== 200) {
            throw new Error(`Asset forecast report failed: ${response.body.message}`);
        }

        const d = response.body.data;

        let excelFile: string | null = null;
        if (d.excelBase64) {
            excelFile = await context.files.write({
                fileName: d.excelFileName ?? 'Asset_Forecast_Report.xlsx',
                data: Buffer.from(d.excelBase64, 'base64'),
            });
        }

        const { excelBase64, ...rest } = d;
        return { ...rest, excelFile };
    },
});