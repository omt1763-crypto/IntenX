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
            ? 'border-flow-purple/50 bg-flow-purple/10'
            : selectedFile
            ? 'border-green-600/50 bg-green-500/10'
            : 'border-border hover:border-flow-purple/50 hover:bg-flow-purple/5'
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
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Resume Selected</h3>
              <p className="text-muted-foreground mb-4">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
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
                <FileUp className="w-16 h-16 text-flow-purple mx-auto" />
              </motion.div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Drop your resume here</h3>
              <p className="text-muted-foreground mb-6">or choose a file to upload</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-lg text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                <Upload className="w-5 h-5" />
                Choose File
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          PDF & DOCX only. Max 2MB file size.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex gap-2 justify-between items-center p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-flow-purple/20 rounded flex items-center justify-center">
                <FileUp className="w-5 h-5 text-flow-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null)
                setError('')
              }}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition"
            >
              Remove
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-card border border-border rounded-lg">
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
          className="p-4 bg-card border border-border rounded-lg"
        >
          <p className="text-sm font-medium text-foreground mb-1">Supported Formats</p>
          <p className="text-xs text-muted-foreground">PDF, DOCX</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-card border border-border rounded-lg"
        >
          <p className="text-sm font-medium text-foreground mb-1">Max File Size</p>
          <p className="text-xs text-muted-foreground">2MB</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
