$src = Join-Path $env:USERPROFILE 'Documents\TA_PRODUTO_SAUDE_SITE.csv'
$dst = Join-Path $PSScriptRoot '..\assets\data\anvisa-base.json'

$rows = Import-Csv -Path $src -Delimiter ';' -Encoding Default

$mapped = foreach ($row in $rows) {
  $codigo = (($row.NUMERO_REGISTRO_CADASTRO | Out-String).Trim() -replace '\D', '')
  if (-not $codigo) { continue }

  $nome = (($row.NOME_COMERCIAL | Out-String).Trim())
  if (-not $nome) {
    $nome = (($row.NOME_TECNICO | Out-String).Trim())
  }
  if (-not $nome) { continue }

  $classe = (($row.CLASSE_RISCO | Out-String).Trim())
  $nomeTecnico = (($row.NOME_TECNICO | Out-String).Trim())
  $partes = @()
  if ($classe) { $partes += "Classe $classe" }
  if ($nomeTecnico -and $nomeTecnico -ne $nome) { $partes += $nomeTecnico }

  [PSCustomObject]@{
    codigo = $codigo
    nome = $nome
    apresentacao = ($partes -join ' | ')
    custo = 0
    referencia = ((($row.NUMERO_PROCESSO | Out-String).Trim()) -replace '\D', '')
  }
}

$dedup = $mapped | Group-Object codigo | ForEach-Object { $_.Group[0] }
$json = $dedup | ConvertTo-Json -Compress -Depth 3
[System.IO.File]::WriteAllText($dst, $json, [System.Text.UTF8Encoding]::new($false))
Write-Output ("Registros gerados: " + $dedup.Count)
