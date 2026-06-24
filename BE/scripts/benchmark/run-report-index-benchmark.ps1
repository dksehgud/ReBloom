$ErrorActionPreference = "Stop"

$containerName = "rebloom-report-index-bench"
$dbName = "rebloom_bench"
$dbUser = "rebloom"
$dbPassword = "rebloom"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..\..")
$captureDir = Join-Path $repoRoot "docs\portfolio-captures\report-index-benchmark"
$rawOutputDir = Join-Path $captureDir "raw"
$sqlPath = Join-Path $scriptDir "report-index-benchmark.sql"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputPath = Join-Path $rawOutputDir "report-index-benchmark-output-$timestamp.txt"
$latestOutputPath = Join-Path $rawOutputDir "report-index-benchmark-output-latest.txt"

New-Item -ItemType Directory -Force -Path $rawOutputDir | Out-Null

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI was not found. Enable BIOS virtualization, start Docker Desktop, then rerun this script."
}

docker version *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker is installed but not running. Start Docker Desktop, then rerun this script."
}

$existingContainer = docker ps -aq --filter "name=^/$containerName$"
if ($existingContainer) {
    docker rm -f $containerName | Out-Null
}

docker run `
    --name $containerName `
    -e POSTGRES_DB=$dbName `
    -e POSTGRES_USER=$dbUser `
    -e POSTGRES_PASSWORD=$dbPassword `
    -p 55432:5432 `
    -d postgres:16-alpine | Out-Null

Write-Host "Waiting for PostgreSQL container..."
for ($i = 0; $i -lt 30; $i++) {
    docker exec $containerName pg_isready -U $dbUser -d $dbName *> $null
    if ($LASTEXITCODE -eq 0) {
        break
    }
    Start-Sleep -Seconds 1
}

docker cp $sqlPath "${containerName}:/tmp/report-index-benchmark.sql"

docker exec -i $containerName `
    psql -U $dbUser -d $dbName -f /tmp/report-index-benchmark.sql |
    Tee-Object -FilePath $outputPath

Copy-Item -LiteralPath $outputPath -Destination $latestOutputPath -Force

Write-Host "Benchmark output saved to $outputPath"
Write-Host "Latest output copied to $latestOutputPath"
