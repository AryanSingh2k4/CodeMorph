'use client'

import React, { useState } from 'react'
import { JobFile } from '@/types'
import { Code, Box, Layers, AlertCircle, FileCode } from 'lucide-react'

interface ASTVisualizerProps {
  files: JobFile[]
}

export default function ASTVisualizer({ files }: ASTVisualizerProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.file_path || '')
  const selectedFile = files.find(f => f.file_path === selectedFilePath) || files[0]

  if (!selectedFile || !selectedFile.ast_summary) {
    return (
      <div className="p-8 text-center bg-[#121212] border border-[#262626] rounded-xl">
        <p className="text-caption text-[#8c8c8c] font-mono">No AST metadata parsed for this file.</p>
      </div>
    )
  }

  const ast = selectedFile.ast_summary

  return (
    <div className="space-y-3 font-sans">
      {/* File Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto bg-[#121212] border border-[#262626] p-2.5 rounded-xl">
        {files.map((f) => (
          <button
            key={f.id || f.file_path}
            onClick={() => setSelectedFilePath(f.file_path)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all shrink-0 ${
              f.file_path === selectedFile.file_path
                ? 'bg-coral-500 text-white font-medium shadow-coral'
                : 'bg-[#161616] text-[#b6b6b6] hover:text-[#f2f2f2] border border-[#262626]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{f.file_path}</span>
          </button>
        ))}
      </div>

      {/* AST Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Imports Card */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <h4 className="text-xs font-semibold text-[#f2f2f2] flex items-center space-x-2 mb-3">
            <Box className="w-4 h-4 text-coral-500" />
            <span>Imported Modules ({ast.imports.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.imports.length > 0 ? (
              ast.imports.map((imp, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-[#f2f2f2] font-mono text-xs">
                  {imp}
                </span>
              ))
            ) : (
              <span className="text-caption text-[#666666] font-mono">No external imports</span>
            )}
          </div>
        </div>

        {/* Functions Card */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <h4 className="text-xs font-semibold text-[#f2f2f2] flex items-center space-x-2 mb-3">
            <Code className="w-4 h-4 text-amber-400" />
            <span>Declared Functions & Handlers ({ast.functions.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.functions.length > 0 ? (
              ast.functions.map((fn, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-amber-400 font-mono text-xs">
                  {fn}()
                </span>
              ))
            ) : (
              <span className="text-caption text-[#666666] font-mono">No top-level functions</span>
            )}
          </div>
        </div>

        {/* Classes Card */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <h4 className="text-xs font-semibold text-[#f2f2f2] flex items-center space-x-2 mb-3">
            <Layers className="w-4 h-4 text-[#8c8c8c]" />
            <span>Class Declarations ({ast.classNames.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.classNames.length > 0 ? (
              ast.classNames.map((cls, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-[#b6b6b6] font-mono text-xs">
                  class {cls}
                </span>
              ))
            ) : (
              <span className="text-caption text-[#666666] font-mono">No class components</span>
            )}
          </div>
        </div>

        {/* Detected AST Patterns Card */}
        <div className="p-4 rounded-xl bg-[#121212] border border-[#262626]">
          <h4 className="text-xs font-semibold text-[#f2f2f2] flex items-center space-x-2 mb-3">
            <AlertCircle className="w-4 h-4 text-rust-400" />
            <span>Flagged AST Patterns ({ast.patterns.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.patterns.length > 0 ? (
              ast.patterns.map((pat, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-rust-950/60 border border-rust-500/30 text-rust-300 font-mono text-xs font-medium">
                  {pat}
                </span>
              ))
            ) : (
              <span className="text-caption text-sage-400 font-mono">No suspicious AST patterns</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
