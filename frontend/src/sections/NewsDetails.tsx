import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, User, ThumbsUp, MessageSquare, ExternalLink, RefreshCw, BookOpen } from "lucide-react";
import { NEWS_API } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Comment {
  author: string;
  body: string;
  score: number;
  created_utc: number;
  replies?: Comment[];
}

interface NewsDetailsData {
  id: string;
  title: string;
  description: string;
  content: string;
  contentType: "html" | "reddit-discussion";
  contentUrl: string;
  source: string;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  upvotes: number;
  tags: string[];
  comments?: Comment[];
  isSelfPost?: boolean;
}

// Recursive Comment Node Component
const CommentNode: React.FC<{ comment: Comment; depth?: number }> = ({ comment, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);

  if (!comment || !comment.body) return null;

  return (
    <div className={`mt-4 flex flex-col ${depth > 0 ? "pl-4 border-l border-gray-200 dark:border-gray-800/80 ml-2" : "border border-gray-100 dark:border-gray-850 p-4 rounded-xl bg-gray-50/30 dark:bg-gray-950/20"}`}>
      {/* Header metadata */}
      <div className="flex items-center justify-between mb-1.5 text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {comment.author}
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <ThumbsUp className="w-3 h-3 text-amber-500" />
            {comment.score}
          </span>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-[10px] text-purple-600 dark:text-purple-400 font-medium hover:underline"
          >
            {expanded ? "Collapse replies" : `Expand replies (${comment.replies.length})`}
          </button>
        )}
      </div>

      {/* Comment text */}
      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-300 leading-relaxed font-noto-sans whitespace-pre-line break-words">
        {comment.body}
      </p>

      {/* Nested Replies */}
      {expanded && comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-1">
          {comment.replies.map((reply, idx) => (
            <CommentNode key={idx} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const NewsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<NewsDetailsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${NEWS_API}/get-news/${id}`);
      if (response.data?.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to load news details");
      }
    } catch (err: any) {
      console.error("Error loading news details:", err);
      setError(err.message || "Failed to load full article content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchNewsDetails();
    }
  }, [id]);

  const getSourceBadgeStyle = (source: string) => {
    if (source.startsWith("Reddit")) {
      return "bg-orange-600 text-white";
    }
    return "bg-zinc-900 dark:bg-zinc-100 dark:text-black text-white";
  };

  const getFallbackImage = (tags: string[]) => {
    const isTech = tags.some(t => ["edtech", "technology", "programming", "webdev"].includes(t.toLowerCase()));
    if (isTech) {
      return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1000&auto=format&fit=crop&q=80";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080b11] transition-colors duration-300 xl:pt-24 md:pt-48 pt-28 px-4 sm:px-5 md:px-6 pb-20 font-noto-sans">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/news")}
            className="flex items-center gap-2 text-sm font-ubuntu text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Fetching details from platform...</p>
          </div>
        )}

        {/* Error Screen */}
        {!loading && error && (
          <div className="text-center py-20 bg-white dark:bg-[#0e131f] border border-red-200/30 dark:border-red-900/30 rounded-2xl p-8 max-w-lg mx-auto">
            <div className="text-red-500 font-ubuntu font-semibold text-lg mb-2">Error loading article</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
            <Button
              onClick={fetchNewsDetails}
              className="bg-purple-600 hover:bg-purple-700 text-white font-ubuntu px-6 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Article Details Render */}
        {!loading && !error && data && (
          <article className="bg-white dark:bg-[#0e131f] border border-gray-200 dark:border-gray-800/80 rounded-2xl overflow-hidden shadow-sm p-5 sm:p-8">
            {/* Header info */}
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <Badge className={`${getSourceBadgeStyle(data.source)} text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md`}>
                {data.source}
              </Badge>
              <span className="text-xs text-gray-450 dark:text-gray-500">
                {new Date(data.publishedAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-ubuntu leading-tight mb-4">
              {data.title}
            </h1>

            {/* Author details */}
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-500" />
                Authored by: <strong className="text-gray-700 dark:text-gray-200 font-medium">{data.author}</strong>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-850"></span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4 text-amber-500" />
                Score: {data.upvotes}
              </span>
            </div>

            {/* Cover Image */}
            <div className="w-full h-48 sm:h-72 md:h-96 rounded-xl overflow-hidden mb-8 border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10">
              <img
                src={data.coverImage || getFallbackImage(data.tags)}
                alt={data.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFallbackImage(data.tags);
                }}
              />
            </div>

            {/* Content Body */}
            <div className="mb-8">
              {data.contentType === "html" ? (
                /* Dev.to Article prose HTML */
                <div 
                  className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-300 leading-relaxed font-noto-sans prose-img:rounded-xl prose-a:text-purple-600 dark:prose-a:text-purple-400 hover:prose-a:underline prose-code:text-purple-600 dark:prose-code:text-purple-400"
                  dangerouslySetInnerHTML={{ __html: data.content }}
                />
              ) : (
                /* Reddit thread selftext content */
                <div className="space-y-6">
                  {data.content ? (
                    <div className="border-l-4 border-purple-500 pl-4 py-1 text-gray-700 dark:text-gray-300 font-noto-sans text-sm sm:text-base leading-relaxed bg-gray-50/50 dark:bg-gray-950/20 p-4 rounded-r-xl whitespace-pre-line">
                      {data.content}
                    </div>
                  ) : null}

                  {/* External shared link message if Reddit post links outside */}
                  {!data.isSelfPost && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-blue-200/50 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-950/10">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-blue-500 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-gray-850 dark:text-gray-200">External Article Attached</h4>
                          <p className="text-xs text-gray-450 dark:text-gray-400 mt-0.5 truncate max-w-md">{data.contentUrl}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(data.contentUrl, "_blank", "noopener,noreferrer")}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-ubuntu rounded-xl text-xs flex-shrink-0"
                      >
                        Visit Original Source
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reddit Comments Section */}
            {data.contentType === "reddit-discussion" && (
              <div className="mt-10 pt-8 border-t border-gray-150 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg sm:text-xl font-bold font-ubuntu text-gray-900 dark:text-white">
                    Community Discussion ({data.comments?.length || 0})
                  </h3>
                </div>

                {data.comments && data.comments.length > 0 ? (
                  <div className="space-y-4">
                    {data.comments.map((comment, index) => (
                      <CommentNode key={index} comment={comment} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-gray-50/50 dark:bg-[#121927]/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm italic mb-2">
                      No comments loaded for this discussion thread.
                    </p>
                    <a
                      href={data.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-750 dark:hover:text-purple-300 inline-flex items-center gap-1"
                    >
                      View discussion directly on Reddit
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Original source link footer for Dev.to */}
            {data.contentType === "html" && (
              <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <Button
                  variant="link"
                  onClick={() => window.open(data.contentUrl, "_blank", "noopener,noreferrer")}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 gap-1.5 p-0"
                >
                  View original post on Dev.to
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
};

export default NewsDetails;
