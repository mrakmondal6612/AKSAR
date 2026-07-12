import React, { useEffect, useState } from "react";
import { Card, Button, Textarea, Spacer, Divider } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext } from "@/context/authContext";
import { USER_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import { SuccessToast, ErrorToast, WarningToast } from "@/lib/toasts";
import axios from "axios";
import { MessageSquare, Heart, Send, Sparkles, Loader2 } from "lucide-react";

interface Comment {
  _id?: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    profileImageUrl?: string;
  };
  content: string;
  createdAt: string;
}

interface Post {
  postId: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    profileImageUrl?: string;
  };
  content: string;
  likes: string[];
  comments: Comment[];
  category?: string;
  tags?: string[];
  createdAt: string;
}

const Community: React.FC = () => {
  const { userData, isLoggedIn } = useAuthContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visibleComments, setVisibleComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("General");

  const getHeaders = () => {
    const token = getVerifiedToken();
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    };
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${USER_API}/community/posts`);
      if (res.data && res.data.success) {
        setPosts(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching community posts:", error);
      ErrorToast("Failed to load community posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!isLoggedIn) {
      WarningToast("Please log in to share your thoughts with the community.");
      return;
    }

    if (!postContent.trim()) {
      WarningToast("Post content cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${USER_API}/community/posts`,
        { content: postContent, category: selectedCategory },
        getHeaders()
      );

      if (res.data && res.data.success) {
        SuccessToast("Post shared successfully!");
        setPostContent("");
        setSelectedCategory("General");
        // Prepend the new post
        setPosts((prev) => [res.data.data, ...prev]);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      ErrorToast("Failed to publish post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!isLoggedIn) {
      WarningToast("Please log in to like posts.");
      return;
    }

    try {
      const res = await axios.patch(
        `${USER_API}/community/posts/${postId}/like`,
        {},
        getHeaders()
      );

      if (res.data && res.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.postId === postId
              ? { ...post, likes: res.data.likes }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      ErrorToast("Action failed. Please try again.");
    }
  };

  const handleToggleComments = (postId: string) => {
    setVisibleComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = async (postId: string) => {
    if (!isLoggedIn) {
      WarningToast("Please log in to leave comments.");
      return;
    }

    const commentText = newComments[postId] || "";
    if (!commentText.trim()) {
      return;
    }

    try {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
      const res = await axios.post(
        `${USER_API}/community/posts/${postId}/comment`,
        { content: commentText },
        getHeaders()
      );

      if (res.data && res.data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.postId === postId
              ? { ...post, comments: res.data.comments }
              : post
          )
        );
        setNewComments((prev) => ({ ...prev, [postId]: "" }));
        SuccessToast("Comment added!");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      ErrorToast("Failed to post comment.");
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 flex flex-col items-center px-4 sm:px-6 py-12 lg:pt-56 pt-60 md:pt-56 relative overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Header Section */}
      <div className="max-w-4xl w-full text-center relative z-10">
        <motion.h1
          className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 font-extrabold font-ubuntu mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome to the AKSAR Community!
        </motion.h1>
        <motion.p
          className="text-neutral-500 dark:text-neutral-400 sm:text-lg text-base font-libre max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Connect with learners worldwide, share your study progress, ask questions, and grow together!
        </motion.p>
      </div>

      <Spacer y={8} />

      {/* Create Post Section */}
      <motion.div
        className="max-w-3xl w-full p-5 sm:p-6 bg-gray-50/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-lg relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex gap-4 mb-4">
          <Avatar className="w-10 h-10 border border-purple-500/30">
            <AvatarImage src={userData.profileImageUrl} />
            <AvatarFallback className="font-bold text-sm bg-gradient-to-br from-purple-500 to-blue-600 text-white">
              {userData.avatarFallbackText || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <Textarea
              placeholder="What are you learning today? Share your progress or ask a question..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              minRows={3}
              variant="flat"
              className="w-full text-sm sm:text-base text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200/50 dark:border-gray-800/50 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Guidelines</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-purple-500 font-sans"
            >
              <option value="General">General</option>
              <option value="Q&A">Q&A</option>
              <option value="Web Development">Web Development</option>
              <option value="Career Guidance">Career Guidance</option>
            </select>
          </div>
          <Button
            color="primary"
            variant="solid"
            onClick={handleCreatePost}
            isLoading={submitting}
            className="px-6 rounded-xl font-ubuntu bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md shadow-purple-500/20"
          >
            Post
          </Button>
        </div>
      </motion.div>

      <Spacer y={6} />
      <Divider className="max-w-3xl w-full my-6 bg-gray-200 dark:bg-gray-800" />

      {/* Search and Filters Section */}
      <div className="max-w-3xl w-full flex flex-col sm:flex-row gap-4 justify-between items-center mb-6 relative z-10">
        {/* Search Input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search posts or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-white"
          />
        </div>
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          {["All", "General", "Q&A", "Web Development", "Career Guidance"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                filterCategory === cat
                  ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-3xl w-full space-y-6 relative z-10">
        {(() => {
          const filteredPosts = posts.filter((post) => {
            const matchesCategory = filterCategory === "All" || post.category === filterCategory;
            const matchesSearch =
              post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (post.user &&
                `${post.user.firstName} ${post.user.lastName}`
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
          });

          return loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-500">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
              <p className="text-sm font-medium">Loading community feed...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            <AnimatePresence>
              {filteredPosts.map((post) => {
                const isLikedByMe = post.likes.includes(userData.id);
                const showComments = visibleComments[post.postId] || false;
                const commentVal = newComments[post.postId] || "";
                const commenting = commentSubmitting[post.postId] || false;

                return (
                  <motion.div
                    key={post.postId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                  >
                  <Card className="p-5 bg-gray-50/50 dark:bg-[#121927]/30 border border-gray-200 dark:border-gray-800/60 shadow-md rounded-2xl">
                    {/* Post Author info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-blue-500/20">
                          <AvatarImage src={post.user?.profileImageUrl} />
                          <AvatarFallback className="font-bold text-sm bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {post.user ? `${post.user.firstName?.[0] || ""}${post.user.lastName?.[0] || ""}`.toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-ubuntu font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                            {post.user ? `${post.user.firstName} ${post.user.lastName}` : "Community Member"}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                            @{post.user?.userName || "member"} • {getRelativeTime(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      {post.category && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          {post.category}
                        </span>
                      )}
                    </div>

                    {/* Post Content */}
                    <p className="text-gray-800 dark:text-neutral-200 font-sans text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Post Actions */}
                    <div className="flex gap-4 mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-800/40">
                      <button
                        onClick={() => handleLikePost(post.postId)}
                        className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          isLikedByMe
                            ? "text-red-500 hover:text-red-600"
                            : "text-neutral-500 hover:text-red-400 dark:text-neutral-400"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLikedByMe ? "fill-current" : ""}`} />
                        <span>{post.likes.length} Likes</span>
                      </button>

                      <button
                        onClick={() => handleToggleComments(post.postId)}
                        className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          showComments
                            ? "text-purple-500 hover:text-purple-600"
                            : "text-neutral-500 hover:text-purple-400 dark:text-neutral-400"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments.length} Comments</span>
                      </button>
                    </div>

                    {/* Comments Drawer / Section */}
                    {showComments && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-800/40 space-y-4">
                        {/* Comments List */}
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {post.comments.length > 0 ? (
                            post.comments.map((comment, cIndex) => (
                              <div key={cIndex} className="p-3 bg-gray-100/50 dark:bg-neutral-900/40 rounded-xl flex gap-3 text-xs sm:text-sm">
                                <Avatar className="w-7 h-7 shrink-0 border border-gray-200 dark:border-gray-800">
                                  <AvatarImage src={comment.user?.profileImageUrl} />
                                  <AvatarFallback className="font-bold text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                    {comment.user ? `${comment.user.firstName?.[0] || ""}${comment.user.lastName?.[0] || ""}`.toUpperCase() : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-grow space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                      {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : "Community Member"}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                      {getRelativeTime(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 dark:text-neutral-300 font-sans leading-relaxed">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 italic text-center py-2">
                              No comments yet. Be the first to reply!
                            </p>
                          )}
                        </div>

                        {/* Add Comment Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a reply..."
                            value={commentVal}
                            onChange={(e) =>
                              setNewComments((prev) => ({
                                ...prev,
                                [post.postId]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(post.postId);
                            }}
                            disabled={commenting}
                            className="flex-grow px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-gray-400 text-gray-900 dark:text-white"
                          />
                          <Button
                            size="sm"
                            color="secondary"
                            onClick={() => handleAddComment(post.postId)}
                            isLoading={commenting}
                            className="rounded-xl px-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white min-w-unit-12"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <Card className="p-8 text-center bg-gray-50/50 dark:bg-[#121927]/30 border border-gray-200 dark:border-gray-800/60 rounded-2xl">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              No community posts found matching your filters.
            </p>
          </Card>
        );
      })()}
      </div>

      <Spacer y={12} />
    </div>
  );
};

export default Community;
