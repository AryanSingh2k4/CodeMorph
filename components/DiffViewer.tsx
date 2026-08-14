'use client'

import React, { useState, useMemo } from 'react'
import { JobFile } from '@/types'
import { FileCode, Split, Columns, Check, Copy, Sparkles, Plus, Minus } from 'lucide-react'

interface DiffViewerProps {
  files: JobFile[]
  initialSelectedFile?: string
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  leftLineNum?: number
  rightLineNum?: number
  content: string
}

function computeSimpleDiff(original: string, patched: string): DiffLine[] {
  const originalLines = original.split('\n')
  const patchedLines = patched.split('\n')
  const diff: DiffLine[] = []

  let i = 0
  let j = 0

  while (i < originalLines.length || j < patchedLines.length) {
    if (i < originalLines.length && j < patchedLines.length) {
      if (originalLines[i] === patchedLines[j]) {
        diff.push({
          type: 'unchanged',
          leftLineNum: i + 1,
          rightLineNum: j + 1,
          content: originalLines[i]
        })
        i++
        j++
      } else {
        const nextMatchInPatched = patchedLines.indexOf(originalLines[i], j)
        const nextMatchInOriginal = originalLines.indexOf(patchedLines[j], i)

        if (nextMatchInPatched !== -1 && (nextMatchInOriginal === -1 || nextMatchInPatched - j < nextMatchInOriginal - i)) {
          while (j < nextMatchInPatched) {
            diff.push({
              type: 'added',
              rightLineNum: j + 1,
              content: patchedLines[j]
            })
            j++
          }
        } else if (nextMatchInOriginal !== -1) {
          while (i < nextMatchInOriginal) {
            diff.push({
              type: 'removed',
              leftLineNum: i + 1,
              content: originalLines[i]
            })
            i++
          }
        } else {
          diff.push({
            type: 'removed',
            leftLineNum: i + 1,
            content: originalLines[i]
          })
          diff.push({
            type: 'added',
            rightLineNum: j + 1,
            content: patchedLines[j]
          })
          i++
          j++
        }
      }
    } else if (i < originalLines.length) {
      diff.push({
        type: 'removed',
        leftLineNum: i + 1,
        content: originalLines[i]
      })
      i++
    } else if (j < patchedLines.length) {
      diff.push({
        type: 'added',
        rightLineNum: j + 1,
        content: patchedLines[j]
      })
      j++
    }
  }

  return diff
}

export default function DiffViewer({ files, initialSelectedFile }: DiffViewerProps) {
  const patchedFiles = files.filter(f => f.patched_content)
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    initialSelectedFile || patchedFiles[0]?.file_path || files[0]?.file_path || ''
  )
  const [splitView, setSplitView] = useState(true)
  const [copied, setCopied] = useState(false)

  const selectedFile = files.find(f => f.file_path === selectedFilePath) || patchedFiles[0] || files[0]

  const diffLines = useMemo(() => {
    if (!selectedFile?.patched_content) return []
    return computeSimpleDiff(selectedFile.original_content, selectedFile.patched_content)
  }, [selectedFile])

  if (!selectedFile) {
    return (
      <div className="p-10 text-center bg-[#121212] border border-[#262626] rounded-xl">
        <Sparkles className="w-6 h-6 text-[#666666] mx-auto mb-2" />
        <p className="text-sm text-[#b6b6b6] font-sans">No files ready for patch diff inspection.</p>
      </div>
    )
  }

  const handleCopyPatched = () => {
    if (selectedFile?.patched_content) {
      navigator.clipboard.writeText(selectedFile.patched_content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const addedCount = diffLines.filter(l => l.type === 'added').length
  const removedCount = diffLines.filter(l => l.type === 'removed').length

  return (
    <div className="space-y-3 font-sans">
      {/* File Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121212] border border-[#262626] p-2.5 rounded-xl">
        {/* File Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          {files.map((file) => {
            const hasPatch = Boolean(file.patched_content)
            const isSelected = file.file_path === selectedFile.file_path

            return (
              <button
                key={file.id || file.file_path}
                onClick={() => setSelectedFilePath(file.file_path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-2 transition-all shrink-0 ${
                  isSelected
                    ? 'bg-coral-500 text-white font-medium shadow-coral'
                    : 'bg-[#161616] text-[#b6b6b6] hover:bg-[#1a1a1a] hover:text-[#f2f2f2] border border-[#262626]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.file_path}</span>
                {hasPatch && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-sage-950 text-sage-400 border border-sage-500/30'
                    }`}
                  >
                    Patched
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* View Controls & Stats */}
        <div className="flex items-center space-x-3 shrink-0">
          {selectedFile?.patched_content && (
            <div className="flex items-center space-x-2 text-xs font-mono text-[#b6b6b6]">
              <span className="text-sage-400">+{addedCount}</span>
              <span className="text-rust-400">-{removedCount}</span>
            </div>
          )}

          <button
            onClick={() => setSplitView(!splitView)}
            className="p-1.5 rounded-lg bg-[#161616] hover:bg-[#1a1a1a] text-[#b6b6b6] border border-[#262626] text-xs flex items-center space-x-1.5 transition-colors"
            title="Toggle Split / Unified View"
          >
            {splitView ? <Split className="w-3.5 h-3.5 text-coral-500" /> : <Columns className="w-3.5 h-3.5 text-coral-500" />}
            <span>{splitView ? 'Split' : 'Unified'}</span>
          </button>

          {selectedFile?.patched_content && (
            <button
              onClick={handleCopyPatched}
              className="p-1.5 rounded-lg bg-[#161616] hover:bg-[#1a1a1a] text-[#b6b6b6] border border-[#262626] text-xs flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-sage-400" /> : <Copy className="w-3.5 h-3.5 text-[#8c8c8c]" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Diff View Box */}
      <div className="rounded-xl border border-[#262626] overflow-hidden bg-[#000000] font-mono text-xs">
        <div className="bg-[#121212] px-4 py-2 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#b6b6b6] font-mono text-xs">
            <span className="text-rust-400 font-medium flex items-center space-x-1">
              <Minus className="w-3 h-3" />
              <span>Original</span>
            </span>
            <span className="text-[#333333]">|</span>
            <span className="text-sage-400 font-medium flex items-center space-x-1">
              <Plus className="w-3 h-3" />
              <span>Patched</span>
            </span>
          </div>

          <span className="text-caption text-[#8c8c8c] font-mono">
            {selectedFile.file_path}
          </span>
        </div>

        {selectedFile.patched_content ? (
          <div className="overflow-x-auto text-[12px] bg-[#000000] divide-y divide-[#161616]">
            {diffLines.map((line, idx) => {
              const isAdded = line.type === 'added'
              const isRemoved = line.type === 'removed'

              return (
                <div
                  key={idx}
                  className={`flex items-stretch font-mono leading-relaxed transition-colors ${
                    isAdded
                      ? 'bg-sage-950/30 text-sage-300 hover:bg-sage-950/50'
                      : isRemoved
                      ? 'bg-rust-950/30 text-rust-300 hover:bg-rust-950/50'
                      : 'text-[#b6b6b6] hover:bg-[#121212]'
                  }`}
                >
                  {/* Line Numbers */}
                  <div className="w-11 py-1 pr-2 text-right text-[#666666] select-none bg-[#0a0a0a] border-r border-[#262626] text-[11px] shrink-0">
                    {line.leftLineNum || ''}
                  </div>
                  <div className="w-11 py-1 pr-2 text-right text-[#666666] select-none bg-[#0a0a0a] border-r border-[#262626] text-[11px] shrink-0">
                    {line.rightLineNum || ''}
                  </div>

                  {/* Marker */}
                  <div className="w-5 py-1 text-center font-bold select-none shrink-0 text-xs">
                    {isAdded ? '+' : isRemoved ? '-' : ' '}
                  </div>

                  {/* Code Line Content */}
                  <div className="py-1 px-2 whitespace-pre overflow-x-auto flex-1 font-mono text-[12px]">
                    {line.content || ' '}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-[#000000]">
            <p className="text-[#8c8c8c] text-caption">
              No modifications needed for this file. Original source is unaltered.
            </p>
            <pre className="mt-3 p-3 rounded-lg bg-[#121212] border border-[#262626] text-left text-[#b6b6b6] text-caption overflow-x-auto font-mono">
              {selectedFile.original_content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
