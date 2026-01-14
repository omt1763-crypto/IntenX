'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileUp, Upload, AlertCircle, CheckCircle, Lock } from 'lucide-react'

interface ResumeUploadProps {
  onResumeSelected: (file: File, resumeData: any) => void
  phoneNumber: string
}

export default function ResumeUpload({ onResumeSelected, phoneNumber }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const validateFile = (file: File): boolean => {
    const allowedFormats = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 2 * 1024 * 1024 // 2MB

    if (!allowedFormats.includes(file.type)) {
      setError('Only PDF and DOCX files are allowed')
      return false
    }

    if (file.size > maxSize) {
      setError('File size must be less than 2MB')
      return false
    }

    return true
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError('')

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setLoading(true)
    
    // Extract text from file (in real implementation, you'd use a library like pdf-parse or mammoth)
    const resumeData = {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      uploadedAt: new Date().toISOString(),
      phoneNumber,
    }

    onResumeSelected(selectedFile, resumeData)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-12 transition-all ${
          isDragging
            ? 'border-purple-400 bg-purple-500/20'
            : selectedFile
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-white/30 bg-white/5 hover:border-purple-400 hover:bg-purple-500/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center">
          {selectedFile ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Resume Selected</h3>
              <p className="text-slate-300 mb-4">{selectedFile.name}</p>
              <p className="text-sm text-slate-400">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-4"
              >
                <FileUp className="w-16 h-16 text-purple-400 mx-auto" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Drop your resume here</h3>
              <p className="text-slate-300 mb-6">or choose a file to upload</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                <Upload className="w-5 h-5" />
                Choose File
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          PDF & DOCX only. Max 2MB file size.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex gap-2 justify-between items-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-600/30 rounded flex items-center justify-center">
                <FileUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setError('')
              }}
              className="text-slate-400 hover:text-white text-sm font-medium transition"
            >
              Remove
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <FileUp className="w-5 h-5" />
                </motion.div>
                Analyzing...
              </>
            ) : (
              <>
                <FileUp className="w-5 h-5" />
                Analyze Resume
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-white/5 rounded-lg">
            <Lock className="w-4 h-4 flex-shrink-0" />
            Your resume data is encrypted and secure
          </div>
        </motion.div>
      )}

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white/5 border border-white/10 rounded-lg"
        >
          <p className="text-sm font-medium text-white mb-1">Supported Formats</p>
          <p className="text-xs text-slate-400">PDF, DOCX</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white/5 border border-white/10 rounded-lg"
        >
          <p className="text-sm font-medium text-white mb-1">Max File Size</p>
          <p className="text-xs text-slate-400">2MB</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
