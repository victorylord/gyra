$gyraKey = "gyra_bmsagk4wmrmrtsrdtnylws40mlfvij1n"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Hello Gyra!"
        }
    )
} | ConvertTo-Json -Depth 5

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $gyraKey"
}

Write-Host "Sending request to Gyra API..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://gyra.ng/api/v1/chat" -Method Post -Headers $headers -Body $body
    Write-Host "`n=== Gyra Reply ===" -ForegroundColor Green
    $response.choices[0].message.content
    Write-Host "`n=== Meta ===" -ForegroundColor DarkGray
    Write-Host "Model: $($response.model)"
    Write-Host "Provider: $($response.provider)"
    Write-Host "ID: $($response.id)"
} catch {
    Write-Host "`n=== Error ===" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}