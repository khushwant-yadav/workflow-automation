import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

const COLUMNS: { header: string; key: string; width: number }[] = [
    { header: 'Base Location', key: 'baseLocation', width: 18 },
    { header: 'Location', key: 'location', width: 18 },
    { header: 'Staff ID', key: 'staffId', width: 12 },
    { header: 'Employee Name', key: 'employeeName', width: 26 },
    { header: 'Asset Id', key: 'assetId', width: 22 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Material Name', key: 'materialName', width: 26 },
    { header: 'Inventory Status', key: 'inventoryStatus', width: 18 },
    { header: 'Project Name', key: 'projectName', width: 30 },
    { header: 'Warranty Date', key: 'warrantyDate', width: 15 },
    { header: 'Purchase Order No.', key: 'poNo', width: 20 },
    { header: 'Purchase Order Date', key: 'poDate', width: 18 },
    { header: 'Serial No', key: 'serialNo', width: 20 },
    { header: 'Invoice No.', key: 'invoiceNo', width: 20 },
    { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
    { header: 'Gov Status', key: 'govStatus', width: 14 },
];

const v = (x: any) => (x === null || x === undefined ? '' : x);

function toRow(a: any) {
    return {
        baseLocation: v(a.purchaselocation?.locationName),
        location: v(a.location?.locationName),
        staffId: v(a.employeeNo),
        employeeName: v(a.employeeName),
        assetId: v(a.assetTagId),
        type: v(a.type),
        materialName: v(a.material?.materialName),
        inventoryStatus: v(a.inventroyStatus),
        projectName: v(a.projectName),
        warrantyDate: v(a.expiryDate),
        poNo: v(a.purchaseOrderNo),
        poDate: v(a.purchaseOrderDate),
        serialNo: v(a.serialNo),
        invoiceNo: v(a.invoiceNo),
        invoiceDate: v(a.invoiceDate),
        govStatus: v(a.govtStatus),
    };
}

export const assetLocationReport = createAction({
    auth: zioSetAuth,
    name: 'asset_location_report',
    displayName: 'Asset Location Report',
    description: 'Select a location and get the location-wise asset report as an Excel file',
    props: {
        locationName: Property.Dropdown({
            displayName: 'Location',
            description: 'Location for which the report is needed',
            required: true,
            refreshers: [],
            auth: zioSetAuth,
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, options: [], placeholder: 'Connect your account first' };
                }
                try {
                    const a: any = auth;
                    const baseUrl = a.props.baseUrl;
                    const res = await httpClient.sendRequest<any[]>({
                        method: HttpMethod.GET,
                        url: `${baseUrl}/locationSite/getAllLocation`,
                        headers: { authorization: `Bearer ${a.access_token}` },
                    });
                    return {
                        disabled: false,
                        options: (res.body ?? []).map((l: any) => ({
                            label: String(l.locationName ?? '').trim(),
                            value: String(l.locationName ?? '').trim(),
                        })),
                    };
                } catch (e) {
                    return { disabled: true, options: [], placeholder: 'Failed to load locations' };
                }
            },
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const locationName = context.propsValue.locationName as string;

        const res = await httpClient.sendRequest<any[]>({
            method: HttpMethod.GET,
            url: `${baseUrl}/report/LocationWise/allList`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: { locationName },
        });

        const assets: any[] = Array.isArray(res.body) ? res.body : [];
        const rows = assets.map(toRow);

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Asset Location Report');
        ws.columns = COLUMNS;
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        rows.forEach(r => ws.addRow(r));

        const buffer = await wb.xlsx.writeBuffer();
        const safeLoc = locationName.replace(/[^\w\-]+/g, '_');
        const fileName = `Asset_Location_Report_${safeLoc}.xlsx`;

        const excelFile = await context.files.write({
            fileName,
            data: Buffer.from(buffer as ArrayBuffer),
        });

        return {
            locationName,
            totalAssets: rows.length,
            hasData: rows.length > 0,
            excelFileName: fileName,
            excelFile,
            rows,
        };
    },
});