$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$candidatePath = Join-Path $PSScriptRoot "report-query-indexes-candidate.sql"
$migrationPath = Join-Path $repoRoot "BE\services\report-service\src\main\resources\db\migration\V9__add_report_query_indexes.sql"

if (-not (Test-Path $candidatePath)) {
    throw "Candidate SQL not found: $candidatePath"
}

if (Test-Path $migrationPath) {
    throw "Migration already exists: $migrationPath"
}

Copy-Item -LiteralPath $candidatePath -Destination $migrationPath
Write-Host "Created verified migration: $migrationPath"
