import * as ExcelJS from 'exceljs';

const val = (v: unknown): string =>
    v === null || v === undefined || v === '' ? '-' : String(v);

export async function buildAssetExcel(body: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ZioSet';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Asset Details');

    // ---- Title ----
    sheet.mergeCells('A1:E1');
    const title = sheet.getCell('A1');
    title.value = `Asset ${val(body.transactionType)}`;
    title.font = { bold: true, size: 14 };

    // ---- Transaction / employee summary ----
    const summary: [string, unknown][] = [
        ['Transaction Type', body.transactionType],
        ['Transaction Date', body.transactionDate],
        ['Transaction Time', body.transactionTime],
        ['Transaction By', body.transactionBy],
        ['Employee Name', body.employee?.employeeName ?? body.mail?.employeeName],
        ['Employee No', body.employee?.employeeNo],
        ['Employee Email', body.employee?.email],
        ['Manager', body.employee?.manager],
        ['Project', body.employee?.projectName],
        ['Location', body.employee?.locationName],
        ['Previous Status', body.previousStatus],
        ['New Status', body.newStatus ?? body.asset?.status],
        ['Remark', body.mail?.remark]
    ];

    let rowIndex = 3;
    for (const [label, value] of summary) {
        const row = sheet.getRow(rowIndex++);
        row.getCell(1).value = label;
        row.getCell(1).font = { bold: true };
        row.getCell(2).value = val(value);
    }

    // ---- Assets table ----
    rowIndex += 1;
    const headers = [
        'Asset Role',
        'Asset Tag ID',
        'Serial No',
        'Type',
        'Make',
        'Model',
        'Category',
        'Status',
        'Location',
        'Site',
        'Desk No',
        'Gate Pass No',
        'Expected Return Date',
        'Project'
    ];

    const headerRow = sheet.getRow(rowIndex++);
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E86DE' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    const toRow = (role: string, a: any) => [
        role,
        a?.assetTagId,
        a?.serialNo,
        a?.type,
        a?.make,
        a?.model,
        a?.category,
        a?.status,
        a?.location,
        a?.site,
        a?.deskNo,
        a?.gatePassNo,
        a?.expectedReturnDate,
        a?.projectName
    ];

    const assetRows: any[][] = [];

    if (body.asset) {
        assetRows.push(
            toRow(
                String(body.transactionType).toLowerCase() === 'replacement'
                    ? 'New Asset'
                    : 'Asset',
                body.asset
            )
        );
    }

    if (body.oldAsset) {
        assetRows.push(toRow('Old Asset (Returned)', body.oldAsset));
    }

    // Fallback if the payload has no asset object at all.
    if (assetRows.length === 0 && body.mail) {
        assetRows.push(
            toRow('Asset', {
                assetTagId: body.mail.assetTagId,
                serialNo: body.mail.serialNumber,
                model: body.mail.model
            })
        );
    }

    for (const data of assetRows) {
        const row = sheet.getRow(rowIndex++);
        data.forEach((v, i) => {
            const cell = row.getCell(i + 1);
            cell.value = val(v);
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    }

    // ---- Column widths ----
    sheet.getColumn(1).width = 24;
    sheet.getColumn(2).width = 30;
    for (let c = 3; c <= headers.length; c++) {
        sheet.getColumn(c).width = 22;
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
}