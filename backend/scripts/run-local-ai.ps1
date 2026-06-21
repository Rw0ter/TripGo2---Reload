<#
  本地大模型（llama.cpp）启动脚本 —— 为「绿途」AI 提供离线兜底（OpenAI 兼容端点）。

  作用：当后端无法访问 DeepSeek（断网 / 无 key / 上游错误）时，自动改用本机模型继续回答
        （见 backend/src/modules/ai/ai.service.ts 的 buildProviders / pipeProvider）。

  用法（首次会自动下载 llama.cpp + 模型，约 7.5GB，需联网）：
      pwsh backend/scripts/run-local-ai.ps1
  然后在 backend/.env 配置（再重启后端）：
      LOCAL_AI_URL="http://127.0.0.1:8080/v1"
      LOCAL_AI_MODEL="Qwen3.6-12B-IQ-Q4_0"

  硬件：开发机 RTX 3080(10G) / 部署机 RTX 5060 laptop —— 12B Q4_0 约 6.9GB，-ngl 99 全量 GPU 卸载即可。
  显存吃紧可调小 -ContextSize 或减少 -Ngl。

  备注：该 GGUF 为社区「uncensored」模型。面向真实用户的 App，建议改用标准 instruct 模型
        （如 Qwen2.5-Instruct GGUF）更安全——把 -ModelUrl / -ModelFile 换掉即可，本脚本与后端均不变。
#>
param(
  [int]$Port = 8080,
  [int]$Ngl = 99,
  [int]$ContextSize = 4096,
  [string]$ModelFile = 'Qwen3.6-12B-IQ-Q4_0.gguf',
  [string]$ModelUrl  = 'https://huggingface.co/KevinJK51/Qwen3.6-12B-IQ-Ultra-Heretic-Uncensored-Thinking-V2-Hightop-GGUF/resolve/main/Qwen3.6-12B-IQ-Q4_0.gguf?download=true',
  [string]$LlamaTag  = 'b9744'
)
$ErrorActionPreference = 'Stop'

$root   = Split-Path -Parent $PSScriptRoot            # backend/
$base   = Join-Path $root 'local-ai'
$llama  = Join-Path $base 'llama'
$models = Join-Path $base 'models'
$exe    = Join-Path $llama 'llama-server.exe'
$model  = Join-Path $models $ModelFile
$alias  = [System.IO.Path]::GetFileNameWithoutExtension($ModelFile)

New-Item -ItemType Directory -Force -Path $llama, $models | Out-Null

# 1) llama.cpp（CUDA 12.4 构建 + cudart 运行时，自包含、无需系统装 CUDA）
if (-not (Test-Path $exe)) {
  Write-Host '下载 llama.cpp (CUDA 12.4) + cudart …'
  $z1 = Join-Path $base 'llama.zip'
  $z2 = Join-Path $base 'cudart.zip'
  & curl.exe -sL -o $z1 "https://github.com/ggml-org/llama.cpp/releases/download/$LlamaTag/llama-$LlamaTag-bin-win-cuda-12.4-x64.zip"
  & curl.exe -sL -o $z2 "https://github.com/ggml-org/llama.cpp/releases/download/$LlamaTag/cudart-llama-bin-win-cuda-12.4-x64.zip"
  Expand-Archive -Path $z1 -DestinationPath $llama -Force
  Expand-Archive -Path $z2 -DestinationPath $llama -Force
  Remove-Item $z1, $z2 -Force
  if (-not (Test-Path $exe)) { throw "未找到 llama-server.exe，请检查解压结果：$llama" }
}

# 2) GGUF 模型（约 6.9GB）
if (-not (Test-Path $model)) {
  Write-Host "下载模型 $ModelFile（约 6.9GB，首次较久）…"
  & curl.exe -L -o $model $ModelUrl
}

# 3) 起 OpenAI 兼容服务（/v1/chat/completions）。--jinja 用模型自带对话模板。
Write-Host "启动 llama-server：http://127.0.0.1:$Port/v1  （模型 alias=$alias，-ngl $Ngl，ctx $ContextSize）"
& $exe --model $model --host 127.0.0.1 --port $Port --ctx-size $ContextSize -ngl $Ngl --jinja --alias $alias
