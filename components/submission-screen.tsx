"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, ImageIcon, LinkIcon, TypeIcon, Send, Sparkles, X, CheckCircle, AlertCircle } from "lucide-react"
import { useVibeStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SubmissionScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState<string>("")
  const [submissionType, setSubmissionType] = useState<"image" | "text" | "link">("image")
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { challenges, submitContent, user } = useVibeStore()
  const activeChallenges = challenges.filter((c) => c.status === "active")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload({ target: { files: e.dataTransfer.files } } as any)
    }
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image, GIF, or video file.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload to IPFS using Pinata
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { ipfsHash, url } = await response.json()
      setContent(url)

      toast({
        title: "File uploaded successfully! 🎉",
        description: `Your content is now stored on IPFS: ${ipfsHash.slice(0, 10)}...`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
      setPreviewUrl("")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async () => {
    if (!selectedChallenge || !content || !title) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select a challenge.",
        variant: "destructive",
      })
      return
    }

    try {
      await submitContent(selectedChallenge, {
        type: submissionType,
        content,
        title,
        author: user?.username || "Anonymous",
        authorId: user?.id || "",
      })

      toast({
        title: "Submission successful! 🚀",
        description: "Your vibe has been submitted and you earned 5 VP!",
      })

      // Reset form
      setContent("")
      setTitle("")
      setSelectedChallenge("")
      setPreviewUrl("")
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearPreview = () => {
    setPreviewUrl("")
    setContent("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getSelectedChallengeData = () => {
    return activeChallenges.find((c) => c.id === selectedChallenge)
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Vibe</h2>
        <p className="text-gray-600">Create content for trending challenges and earn Vibe Points</p>
      </div>

      {/* Challenge Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span>Choose a Challenge</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedChallenge === challenge.id
                    ? "border-purple-500 bg-purple-50 shadow-sm"
                    : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedChallenge(challenge.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                      {challenge.aiGenerated && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{challenge.description}</p>
                    {challenge.trendingTopics && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {challenge.trendingTopics.slice(0, 3).map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Live
                    </Badge>
                    <span className="text-xs text-gray-500">{challenge.submissions?.length || 0} submissions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      {selectedChallenge && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Submission</CardTitle>
            {getSelectedChallengeData() && (
              <p className="text-sm text-gray-600">
                Challenge: <span className="font-medium">{getSelectedChallengeData()?.title}</span>
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Submission Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your vibe a catchy title..."
                className="w-full"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Content Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <div className="flex space-x-2">
                {[
                  { type: "image" as const, icon: ImageIcon, label: "Image/GIF/Video" },
                  { type: "text" as const, icon: TypeIcon, label: "Text Post" },
                  { type: "link" as const, icon: LinkIcon, label: "Link/URL" },
                ].map(({ type, icon: Icon, label }) => (
                  <Button
                    key={type}
                    variant={submissionType === type ? "default" : "outline"}
                    onClick={() => {
                      setSubmissionType(type)
                      setContent("")
                      setPreviewUrl("")
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>

              {submissionType === "image" && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {!previewUrl ? (
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive
                          ? "border-purple-400 bg-purple-50"
                          : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-700">
                          {dragActive ? "Drop your file here" : "Upload your content"}
                        </p>
                        <p className="text-sm text-gray-500">Drag and drop or click to browse</p>
                        <p className="text-xs text-gray-400">Supports: JPG, PNG, GIF, WebP, MP4, WebM (max 10MB)</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="mt-4"
                      >
                        {uploading ? "Uploading..." : "Choose File"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        {previewUrl.includes("video") || content.includes(".mp4") || content.includes(".webm") ? (
                          <video
                            src={previewUrl || content}
                            className="max-w-full h-64 object-cover rounded-lg"
                            controls
                          />
                        ) : (
                          <img
                            src={previewUrl || content}
                            alt="Preview"
                            className="max-w-full h-64 object-cover rounded-lg"
                          />
                        )}
                        <Button variant="secondary" size="sm" onClick={clearPreview} className="absolute top-2 right-2">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {content && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>File uploaded to IPFS successfully</span>
                        </div>
                      )}
                    </div>
                  )}

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading to IPFS...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </div>
              )}

              {submissionType === "text" && (
                <div className="space-y-2">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your vibe content here... Share your thoughts, create a story, or express your creativity!"
                    rows={8}
                    className="w-full resize-none"
                    maxLength={2000}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Express yourself freely</span>
                    <span>{content.length}/2000 characters</span>
                  </div>
                </div>
              )}

              {submissionType === "link" && (
                <div className="space-y-2">
                  <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full"
                    type="url"
                  />
                  <p className="text-xs text-gray-500">
                    Share a link to interesting content, your portfolio, or anything relevant to the challenge
                  </p>
                  {content && !content.startsWith("http") && (
                    <div className="flex items-center space-x-2 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Please enter a valid URL starting with http:// or https://</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!content || !title || uploading || !selectedChallenge}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 h-12"
            >
              <Send className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Submit Vibe (+5 VP)"}
            </Button>

            {/* Submission Guidelines */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Submission Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Content must be relevant to the selected challenge</li>
                <li>• Original content gets higher engagement</li>
                <li>• Engaging titles increase your chances of winning</li>
                <li>• Winners get their content tokenized as Zora Coins</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {activeChallenges.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Challenges</h3>
            <p className="text-gray-600">New AI-generated challenges will appear here soon!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
