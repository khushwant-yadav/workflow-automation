import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';

export const unRegisterAssetReport = createAction({
    auth: zioSetAuth,
    name: 'unregister_asset_report',
    displayName: 'Get Unregistered Assets Report',
    description: 'Gets unregistered assets (HTML body, Excel file, recipients) ready to send as an email',
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
            url: `${baseUrl}/workflow/reports/unRegisterAssetReport`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: {
                includeExcel: String(includeExcel ?? true),
                includeHtml: String(includeHtml ?? true),
            },
        });

        if (response.body.code !== 200) {
            throw new Error(`Unregistered asset report failed: ${response.body.message}`);
        }

        const d = response.body.data;

        let excelFile: string | null = null;
        if (d.excelBase64) {
            excelFile = await context.files.write({
                fileName: d.excelFileName ?? 'UnRegiser Asset.xlsx',
                data: Buffer.from(d.excelBase64, 'base64'),
            });
        }

        const { excelBase64, ...rest } = d;
        return { ...rest, excelFile };
    },
});