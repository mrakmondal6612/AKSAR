import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@nextui-org/react";
import { 
  MessageSquare, 
  Search, 
  Eye, 
  Check, 
  X, 
  Trash2,
  Flag,
  RefreshCw,
  Heart,
  MessageCircle,
  Clock
} from "lucide-react";
import { getVerifiedToken } from "@/lib/cookieService";
import { USER_API } from "@/lib/env";
import { SuccessToast, ErrorToast } from "@/lib/toasts";
import axios from "axios";
import TextFlipSmoothRevealEffect from "@/Effects/TextFlipSmoothRevealEffect";

interface CommunityPost {
  _id: string;
  postId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    profileImageUrl?: string;
  };
  content: string;
  images?: string[];
  likes: string[];
  comments: {
    user: string;
    content: string;
    createdAt: string;
  }[];
  status: string;
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface CommunityStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  totalLikes: number;
  totalComments: number;
}

const CommunityManagement: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadPosts();
    loadStats();
  }, [currentPage, statusFilter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const jwt = getVerifiedToken();
      const response = await axios.get(
        `${USER_API}/admin/community/posts?page=${currentPage}&limit=20&status=${statusFilter}&search=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setPosts(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.get(
        `${USER_API}/admin/community/stats`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.patch(
        `${USER_API}/admin/community/posts/${postId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Post approved successfully");
        loadPosts();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to approve post");
    }
  };

  const handleReject = async (postId: string) => {
    if (!confirm("Are you sure you want to reject this post?")) return;

    try {
      const jwt = getVerifiedToken();
      const response = await axios.patch(
        `${USER_API}/admin/community/posts/${postId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Post rejected successfully");
        loadPosts();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to reject post");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;

    try {
      const jwt = getVerifiedToken();
      const response = await axios.delete(
        `${USER_API}/admin/community/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Post deleted successfully");
        loadPosts();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to delete post");
    }
  };

  const handleFlag = async (postId: string) => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.patch(
        `${USER_API}/admin/community/posts/${postId}/flag`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Post flagged successfully");
        loadPosts();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to flag post");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">Rejected</Badge>;
      case "FLAGGED":
        return <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400">Flagged</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <motion.div
      className="dark:bg-white/5 bg-black/5 rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex justify-center items-center text-center gap-2 overflow-hidden">
          <TextFlipSmoothRevealEffect text="COMMUNITY MANAGEMENT" className="sm:text-5xl text-3xl" />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 dark:from-yellow-500/20 dark:to-yellow-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLikes}</p>
                </div>
                <Heart className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalComments}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              label="Status"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-[180px]"
            >
              <SelectItem key="ALL">All Status</SelectItem>
              <SelectItem key="PENDING">Pending</SelectItem>
              <SelectItem key="APPROVED">Approved</SelectItem>
              <SelectItem key="REJECTED">Rejected</SelectItem>
              <SelectItem key="FLAGGED">Flagged</SelectItem>
            </Select>
            <Button onClick={loadPosts} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Community Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No posts found
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {post.user.firstName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {post.user.firstName} {post.user.lastName}
                      </p>
                      {getStatusBadge(post.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      @{post.user.userName} • {formatDate(post.createdAt)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                      {post.content}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.likes.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPost(post);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {post.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 dark:text-green-400"
                          onClick={() => handleApprove(post.postId)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 dark:text-red-400"
                          onClick={() => handleReject(post.postId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {post.status !== "FLAGGED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 dark:text-orange-400"
                        onClick={() => handleFlag(post.postId)}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 dark:text-red-400"
                      onClick={() => handleDelete(post.postId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Post Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {selectedPost.user.firstName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedPost.user.firstName} {selectedPost.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{selectedPost.user.userName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Post ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPost.postId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  {getStatusBadge(selectedPost.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created At</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedPost.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Likes</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPost.likes.length}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Content</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedPost.content}</p>
                </div>
                {selectedPost.category && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Category</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedPost.category}</p>
                  </div>
                )}
              </div>

              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPost.comments.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Comments ({selectedPost.comments.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedPost.comments.map((comment, index) => (
                      <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default CommunityManagement;
