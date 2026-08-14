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
      <div className="p-8 text-center bg-[#181715] border border-[#2e2a24] rounded-2xl shadow-warm">
        <p className="text-xs text-sand-500 font-mono">No AST metadata parsed for this file.</p>
      </div>
    )
  }

  const ast = selectedFile.ast_summary

  return (
    <div className="space-y-4">
      {/* File Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto bg-[#181715] border border-[#2e2a24] p-3 rounded-2xl shadow-warm">
        {files.map((f) => (
          <button
            key={f.id || f.file_path}
            onClick={() => setSelectedFilePath(f.file_path)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-all shrink-0 ${
              f.file_path === selectedFile.file_path
                ? 'bg-terracotta-500 text-white font-medium shadow-terracotta'
                : 'bg-[#22201c] text-sand-300 hover:text-white border border-[#343029]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{f.file_path}</span>
          </button>
        ))}
      </div>

      {/* AST Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Imports Card */}
        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <h4 className="text-xs font-semibold text-sand-200 flex items-center space-x-2 mb-3">
            <Box className="w-4 h-4 text-terracotta-500" />
            <span>Imported Modules ({ast.imports.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.imports.length > 0 ? (
              ast.imports.map((imp, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-[#22201c] border border-[#312e27] text-sand-300 font-mono text-xs">
                  {imp}
                </span>
              ))
            ) : (
              <span className="text-xs text-sand-600 font-mono">No external imports</span>
            )}
          </div>
        </div>

        {/* Functions Card */}
        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <h4 className="text-xs font-semibold text-sand-200 flex items-center space-x-2 mb-3">
            <Code className="w-4 h-4 text-[#f4a261]" />
            <span>Declared Functions & Handlers ({ast.functions.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.functions.length > 0 ? (
              ast.functions.map((fn, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-[#22201c] border border-[#312e27] text-[#f4a261] font-mono text-xs">
                  {fn}()
                </span>
              ))
            ) : (
              <span className="text-xs text-sand-600 font-mono">No top-level functions</span>
            )}
          </div>
        </div>

        {/* Classes Card */}
        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <h4 className="text-xs font-semibold text-sand-200 flex items-center space-x-2 mb-3">
            <Layers className="w-4 h-4 text-sand-400" />
            <span>Class Declarations ({ast.classNames.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.classNames.length > 0 ? (
              ast.classNames.map((cls, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-[#22201c] border border-[#312e27] text-sand-300 font-mono text-xs">
                  class {cls}
                </span>
              ))
            ) : (
              <span className="text-xs text-sand-600 font-mono">No class components</span>
            )}
          </div>
        </div>

        {/* Detected AST Patterns Card */}
        <div className="p-5 rounded-2xl bg-[#181715] border border-[#2e2a24] shadow-warm">
          <h4 className="text-xs font-semibold text-sand-200 flex items-center space-x-2 mb-3">
            <AlertCircle className="w-4 h-4 text-rust-400" />
            <span>Flagged AST Patterns ({ast.patterns.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {ast.patterns.length > 0 ? (
              ast.patterns.map((pat, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-rust-950/60 border border-rust-500/30 text-rust-300 font-mono text-xs font-medium">
                  {pat}
                </span>
              ))
            ) : (
              <span className="text-xs text-sage-400 font-mono">No suspicious AST patterns</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
