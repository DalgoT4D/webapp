"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Reply, Edit, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Comment {
  id: string
  content: string
  author: string
  authorAvatar?: string
  createdAt: string
  updatedAt?: string
  parentId?: string
  replies?: Comment[]
}

interface DiscussionPanelProps {
  reportInstanceId: string
}

// Mock comments data
const mockComments: Record<string, Comment[]> = {
  "inst-001-1": [
    {
      id: "comment-1",
      content:
        "Great progress on field visit completion rates! The 15% improvement is particularly impressive. What specific training initiatives contributed to this success?",
      author: "Sarah Johnson",
      authorAvatar: "/user-avatar.png",
      createdAt: "2023-05-15T10:30:00Z",
      replies: [
        {
          id: "comment-1-1",
          content:
            "The new mobile training modules and peer mentoring program were key factors. We also improved resource allocation based on regional needs assessment.",
          author: "Mike Chen",
          authorAvatar: "/user-avatar.png",
          createdAt: "2023-05-15T11:15:00Z",
          parentId: "comment-1",
        },
        {
          id: "comment-1-2",
          content:
            "Additionally, the simplified reporting process reduced administrative burden, allowing field workers to focus more on actual visits.",
          author: "Dr. Priya Sharma",
          authorAvatar: "/user-avatar.png",
          createdAt: "2023-05-15T12:00:00Z",
          parentId: "comment-1",
        },
      ],
    },
    {
      id: "comment-2",
      content:
        "I'm concerned about the protocol adherence rates in urban centers. This seems to be a recurring issue. Should we consider targeted interventions?",
      author: "Alex Rodriguez",
      authorAvatar: "/user-avatar.png",
      createdAt: "2023-05-15T14:20:00Z",
      replies: [
        {
          id: "comment-2-1",
          content:
            "Yes, I agree. Urban centers face unique challenges including higher patient volumes and more complex cases. We should develop urban-specific protocols.",
          author: "Dr. Priya Sharma",
          authorAvatar: "/user-avatar.png",
          createdAt: "2023-05-15T15:30:00Z",
          parentId: "comment-2",
        },
      ],
    },
    {
      id: "comment-3",
      content:
        "The supply chain efficiency metrics are excellent! Reaching 94% efficiency is a significant achievement. How sustainable is this performance?",
      author: "Lisa Wang",
      authorAvatar: "/user-avatar.png",
      createdAt: "2023-05-15T16:45:00Z",
    },
  ],
}

export function DiscussionPanel({ reportInstanceId }: DiscussionPanelProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments[reportInstanceId] || [])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment,
      author: "Current User",
      authorAvatar: "/user-avatar.png",
      createdAt: new Date().toISOString(),
    }

    setComments((prev) => [comment, ...prev])
    setNewComment("")
  }

  const handleAddReply = (parentId: string) => {
    if (!replyContent.trim()) return

    const reply: Comment = {
      id: `reply-${Date.now()}`,
      content: replyContent,
      author: "Current User",
      authorAvatar: "/user-avatar.png",
      createdAt: new Date().toISOString(),
      parentId,
    }

    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          }
        }
        return comment
      }),
    )

    setReplyContent("")
    setReplyingTo(null)
  }

  const handleEditComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            content: editContent,
            updatedAt: new Date().toISOString(),
          }
        }
        // Handle replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === commentId ? { ...reply, content: editContent, updatedAt: new Date().toISOString() } : reply,
            ),
          }
        }
        return comment
      }),
    )
    setEditingId(null)
    setEditContent("")
  }

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => {
      // Remove main comment
      const filtered = prev.filter((comment) => comment.id !== commentId)

      // Remove from replies
      return filtered.map((comment) => ({
        ...comment,
        replies: comment.replies?.filter((reply) => reply.id !== commentId) || [],
      }))
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : ""}`}>
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.authorAvatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">{getInitials(comment.author)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  {comment.updatedAt && (
                    <Badge variant="outline" className="text-xs">
                      edited
                    </Badge>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingId(comment.id)
                        setEditContent(comment.content)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null)
                        setEditContent("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed mb-3">{comment.content}</p>

                  {!isReply && (
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(comment.id)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-4 ml-11">
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleAddReply(comment.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Render Replies */}
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Discussion ({comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)})
        </h3>
      </div>

      {/* New Comment Form */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/user-avatar.png" />
              <AvatarFallback className="text-xs">CU</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Add a comment to start the discussion..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">No comments yet</div>
          <p className="text-sm text-muted-foreground">Start the discussion by adding the first comment above</p>
        </div>
      ) : (
        <div className="space-y-4">{comments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  )
}
