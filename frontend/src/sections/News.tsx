import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ThumbsUp, Clock, Calendar, User, RefreshCw, Newspaper, ArrowRight } from "lucide-react";
import { NEWS_API } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Seperator from "@/components/Seperator";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  source: string;
  category: string;
  author: string;
  publishedAt: string;
  coverImage: string | null;
  readTime: string;
  upvotes: number;
  tags: string[];
}

const CATEGORIES = ["All", "Technology", "Tutorials", "News & Reports", "Discussions", "Entrance Exams"];
const SOURCES = ["All", "Dev.to", "Reddit"];

const getFallbackImage = (category: string) => {
  switch (category) {
    case "Technology":
      return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60";
    case "News & Reports":
      return "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=60";
    case "Tutorials":
      return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60";
    case "Discussions":
      return "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60";
    default:
      return "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=60";
  }
};

const getSourceBadgeStyle = (source: string) => {
  if (source.startsWith("Reddit")) {
    return "bg-orange-600 hover:bg-orange-700 text-white border-transparent";
  }
  if (source === "Dev.to") {
    return "bg-zinc-900 dark:bg-zinc-100 dark:text-black hover:bg-zinc-800 text-white border-transparent";
  }
  return "bg-blue-600 text-white hover:bg-blue-700";
};

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case "Technology":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800";
    case "Tutorials":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    case "News & Reports":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    case "Discussions":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "Entrance Exams":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-850 dark:text-gray-300 border-gray-200 dark:border-gray-850";
  }
};

const News: React.FC = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchNewsData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await axios.get(`${NEWS_API}/get-news${isRefresh ? "?bypassCache=true" : ""}`);
      if (response.data?.success) {
        setNews(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Failed to load news articles");
      }
    } catch (err: any) {
      console.error("Error fetching news:", err);
      setError(err.message || "Something went wrong while loading news.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNewsData();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredNews = news.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    const matchesSource =
      selectedSource === "All" ||
      (selectedSource === "Reddit" && item.source.startsWith("Reddit")) ||
      (selectedSource === "Dev.to" && item.source === "Dev.to");

    return matchesSearch && matchesCategory && matchesSource;
  });

  return (
    <section className="min-h-screen h-auto bg-gray-55 dark:bg-[#080b11] transition-colors duration-300 xl:pt-24 md:pt-48 pt-28 px-4 sm:px-5 md:px-6 pb-20">
      <div className="max-w-7xl mx-auto flex-col flex">
        {/* Header Section */}
        <motion.div
          className="text-center mb-8 md:mb-12 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400 font-ubuntu text-xs sm:text-sm font-medium mb-3">
            <Newspaper className="w-4 h-4" />
            <span>Real-time Education News Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-4 font-ubuntu leading-tight">
            Latest Education News
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 font-noto-sans leading-relaxed">
            Stay updated with educational news, programming tutorials, reports, and discussions aggregated from top free platforms.
          </p>
        </motion.div>

        {/* Filter Controls Panel */}
        <div className="bg-white/80 dark:bg-[#0e131f]/80 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-8 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search news, keywords or subreddits..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 bg-gray-50/50 dark:bg-[#121927]/50 border-gray-200 dark:border-gray-800 rounded-xl h-11 text-sm focus-visible:ring-purple-500 dark:text-white"
              />
            </div>

            {/* Refresh & Reset Controls */}
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchNewsData(true)}
                disabled={loading || refreshing}
                className="h-11 w-11 rounded-xl border-gray-200 dark:border-gray-800 dark:text-white"
                title="Refresh real-time news"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              {(searchQuery || selectedCategory !== "All" || selectedSource !== "All") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setSelectedSource("All");
                  }}
                  className="h-11 px-4 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800/80 my-1"></div>

          {/* Category Tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-2 font-ubuntu">Categories:</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedCategory === cat
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                        : "bg-gray-100 hover:bg-gray-200 dark:bg-[#121927] dark:hover:bg-[#172033] text-gray-650 dark:text-gray-450"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Tabs */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-450 dark:text-gray-500 mr-2 font-ubuntu">Sources:</span>
              <div className="flex flex-wrap gap-1.5">
                {SOURCES.map((src) => (
                  <button
                    key={src}
                    onClick={() => setSelectedSource(src)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedSource === src
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-gray-100 hover:bg-gray-200 dark:bg-[#121927] dark:hover:bg-[#172033] text-gray-650 dark:text-gray-450"
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Seperator text="AGGREGATED NEWS" className="mb-8" />

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#0e131f] border border-gray-200 dark:border-gray-800/80 rounded-2xl overflow-hidden animate-pulse flex flex-col h-[400px]"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-800 w-full"></div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
                    <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded w-28"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16 bg-white dark:bg-[#0e131f] border border-red-200/30 dark:border-red-900/30 rounded-2xl p-8 max-w-lg mx-auto">
            <div className="text-red-500 font-ubuntu font-semibold text-lg mb-2">Failed to load content</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{error}</p>
            <Button
              onClick={() => fetchNewsData()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-ubuntu px-6 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Grid List rendering */}
        {!loading && !error && (
          <>
            {filteredNews.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#0e131f] border border-gray-200 dark:border-gray-800/80 rounded-2xl p-8 max-w-lg mx-auto">
                <div className="text-gray-400 dark:text-gray-550 mb-4 text-5xl">🔍</div>
                <div className="text-gray-700 dark:text-gray-300 font-ubuntu font-semibold text-lg mb-2">No news items found</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  We couldn't find any news articles matching your search query or filters. Try adjusting your selections.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                <AnimatePresence mode="popLayout">
                  {filteredNews.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -6 }}
                      className="flex"
                    >
                      <Card 
                        onClick={() => navigate(`/news/${item.id}`)}
                        className="flex flex-col w-full h-[450px] overflow-hidden bg-white dark:bg-[#0e131f] border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-sm hover:shadow-lg dark:hover:border-purple-500/30 transition-all duration-300 group cursor-pointer"
                      >
                        {/* Cover Image */}
                        <div className="h-48 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800">
                          <img
                            src={item.coverImage || getFallbackImage(item.category)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = getFallbackImage(item.category);
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                          
                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                            <Badge className={`${getSourceBadgeStyle(item.source)} text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-sm`}>
                              {item.source}
                            </Badge>
                            <Badge variant="outline" className={`${getCategoryBadgeStyle(item.category)} text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md backdrop-blur-md`}>
                              {item.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Content Header */}
                        <CardHeader className="p-5 pb-2 flex-grow flex flex-col justify-start">
                          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-2.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(item.publishedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                            <span className="flex items-center gap-1 max-w-[120px] truncate" title={item.author}>
                              <User className="w-3.5 h-3.5" />
                              {item.author}
                            </span>
                          </div>

                          <CardTitle className="text-base sm:text-lg font-bold font-ubuntu text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                            {item.title}
                          </CardTitle>

                          <CardDescription className="text-xs sm:text-sm text-gray-550 dark:text-gray-450 line-clamp-3 leading-relaxed font-noto-sans">
                            {item.description}
                          </CardDescription>
                        </CardHeader>

                        {/* Footer details */}
                        <CardFooter className="p-5 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121927]/10">
                          <div className="flex items-center gap-3.5 text-xs text-gray-450 dark:text-gray-500 font-medium">
                            <span className="flex items-center gap-1" title="Upvotes / Score">
                              <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                              {item.upvotes}
                            </span>
                            <span className="flex items-center gap-1" title="Reading time estimation">
                              <Clock className="w-3.5 h-3.5" />
                              {item.readTime}
                            </span>
                          </div>

                          <span className="text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 text-xs font-semibold flex items-center gap-1.5 group/btn">
                            Read News
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </span>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default News;
