$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Resolve-Path (Join-Path $scriptDir "..")
$sqlFile = Join-Path $scriptDir "seed-qa-data.sql"

Push-Location $backendDir
try {
    docker compose --profile infra up -d postgres
    Get-Content $sqlFile -Raw | docker compose exec -T postgres psql -U rebloom -d rebloom_auth
}
finally {
    Pop-Location
}
