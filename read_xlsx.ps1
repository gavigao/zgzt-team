$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open('D:\学习\球队网站\球员信息.xlsx')
foreach ($ws in $wb.Worksheets) {
    Write-Host "=== Sheet: $($ws.Name) ==="
    $usedRange = $ws.UsedRange
    for ($row = 1; $row -le $usedRange.Rows.Count; $row++) {
        $line = @()
        for ($col = 1; $col -le $usedRange.Columns.Count; $col++) {
            $val = $ws.Cells($row, $col).Text
            $line += $val
        }
        Write-Host ($line -join ' | ')
    }
}
$wb.Close($false)
$excel.Quit()
