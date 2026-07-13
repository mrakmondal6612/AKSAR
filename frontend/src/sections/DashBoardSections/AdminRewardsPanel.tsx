import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, XCircle, BarChart3, AlertTriangle, UserCheck, ShieldAlert, Coins, RefreshCw, Gift } from "lucide-react";
import { getVerifiedToken } from "@/lib/cookieService";
import { REWARDS_API, USER_API } from "@/lib/env";
import { SuccessToast, ErrorToast } from "@/lib/toasts";

interface RewardItem {
  rewardId: string;
  name: string;
  description: string;
  pointCost: number;
  type: "DIGITAL_ACCESS" | "COUPON" | "FEATURE_UNLOCK" | "BADGE" | "CUSTOMIZATION";
  stock: number;
  maxStock: number;
  isActive: boolean;
  durationDays?: number;
  badgeUrl?: string;
}

interface RedemptionItem {
  redemptionId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
  };
  reward: {
    name: string;
    pointCost: number;
    type: string;
  };
  pointsSpent: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  benefitDetails?: {
    couponCode?: string;
    badgeName?: string;
    premiumExpiry?: string;
    description?: string;
  };
  createdAt: string;
}

interface PendingPost {
  postId: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
  };
  content: string;
  category: string;
  createdAt: string;
  status: string;
}

interface AnalyticsData {
  totalEarnedPoints: number;
  totalSpentPoints: number;
  redemptionCounts: {
    name: string;
    type: string;
    count: number;
    pointsSpent: number;
  }[];
  farmingAlerts: {
    _id: string;
    username: string;
    email: string;
    todayEarned: number;
  }[];
}

const AdminRewardsPanel: React.FC = () => {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  
  // Tabs: inventory, approvals, adjustments, analytics, redemptions
  const [activeTab, setActiveTab] = useState<"inventory" | "approvals" | "adjustments" | "analytics" | "redemptions">("inventory");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State: Create Reward
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    pointCost: 100,
    type: "DIGITAL_ACCESS",
    stock: 50,
    maxStock: 50,
    durationDays: 3,
    badgeUrl: "",
  });

  // Form State: Manual Adjustment
  const [adjustForm, setAdjustForm] = useState({
    studentUniqueId: "",
    points: 50,
    reason: "",
  });

  const jwt = getVerifiedToken();

  const loadAdminData = async () => {
    if (!jwt) return;
    try {
      setLoading(true);
      const [rewardsRes, pendingPostsRes, analyticsRes, redemptionsRes] = await Promise.all([
        axios.get(`${REWARDS_API}/store`, { headers: { Authorization: `Bearer ${jwt}` } }),
        axios.get(`${USER_API}/admin/community/posts?status=PENDING`, { headers: { Authorization: `Bearer ${jwt}` } }),
        axios.get(`${REWARDS_API}/admin/analytics`, { headers: { Authorization: `Bearer ${jwt}` } }),
        axios.get(`${REWARDS_API}/admin/redemptions`, { headers: { Authorization: `Bearer ${jwt}` } }),
      ]);

      if (rewardsRes.data.success) setRewards(rewardsRes.data.data);
      if (pendingPostsRes.data.success) setPendingPosts(pendingPostsRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (redemptionsRes.data.success) setRedemptions(redemptionsRes.data.data);
    } catch (error: any) {
      console.error("Error loading admin rewards panel data:", error);
      ErrorToast("Failed to sync rewards admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRedemption = async (redemptionId: string, status: "COMPLETED" | "REJECTED") => {
    if (!jwt) return;
    let remarks = "";
    let couponCode = "";
    
    if (status === "REJECTED") {
      const input = window.prompt("Provide a reason for rejecting this order:");
      if (input === null) return; // cancelled
      remarks = input || "Order rejected by administrator";
    } else {
      const input = window.prompt("Enter manual coupon code (cancel/leave blank for auto-generating standard code):");
      if (input === null) return; // cancelled
      couponCode = input;
      remarks = "Claim approved and processed by administrator";
    }
    
    try {
      setLoading(true);
      const res = await axios.put(`${REWARDS_API}/admin/process/${redemptionId}`, {
        status,
        remarks,
        couponCode: couponCode || undefined
      }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      if (res.data.success) {
        SuccessToast(res.data.message || `Redemption order ${status.toLowerCase()} successfully!`);
        loadAdminData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to process redemption order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [jwt]);

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${REWARDS_API}/admin/create`, rewardForm, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data.success) {
        SuccessToast("New reward item created successfully!");
        setRewardForm({
          name: "",
          description: "",
          pointCost: 100,
          type: "DIGITAL_ACCESS",
          stock: 50,
          maxStock: 50,
          durationDays: 3,
          badgeUrl: "",
        });
        loadAdminData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to create reward item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableReward = async (rewardId: string) => {
    if (!jwt) return;
    if (!window.confirm("Are you sure you want to disable this reward? It will not be viewable by students.")) return;
    try {
      const res = await axios.delete(`${REWARDS_API}/admin/delete/${rewardId}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data.success) {
        SuccessToast("Reward item disabled successfully!");
        loadAdminData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to disable reward");
    }
  };

  const handleApprovePost = async (postId: string) => {
    if (!jwt) return;
    try {
      const res = await axios.patch(`${USER_API}/admin/community/posts/${postId}/approve`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data.success) {
        SuccessToast("Post approved successfully! Upload points awarded.");
        loadAdminData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to approve post");
    }
  };

  const handleRejectPost = async (postId: string) => {
    if (!jwt) return;
    const reason = window.prompt("Provide a reason for rejection:");
    if (reason === null) return; // cancelled
    try {
      const res = await axios.patch(`${USER_API}/admin/community/posts/${postId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data.success) {
        SuccessToast("Post rejected successfully.");
        loadAdminData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to reject post");
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${REWARDS_API}/admin/adjust`, adjustForm, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data.success) {
        SuccessToast(res.data.message || "Adjusted student points successfully!");
        setAdjustForm({
          studentUniqueId: "",
          points: 50,
          reason: "",
        });
        loadAdminData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Point adjustment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 font-ubuntu transition-colors duration-300">
      
      {/* Header title */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
            Rewards Administration
            <Coins className="text-indigo-600 dark:text-indigo-400" size={28} />
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Configure available rewards, approve notes and doubt answers, adjust student points, and view farming analytics.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 p-3 rounded-2xl text-gray-600 dark:text-gray-400 hover:text-gray-900 active:scale-95 transition-all duration-300"
          title="Sync Data"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2
            ${activeTab === "inventory"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Plus size={18} />
          <span>Reward Inventory</span>
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2 relative
            ${activeTab === "approvals"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <UserCheck size={18} />
          <span>Pending Approvals</span>
          {pendingPosts.length > 0 && (
            <span className="absolute right-0 top-2.5 bg-rose-500 text-white font-extrabold text-xxs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 animate-bounce">
              {pendingPosts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("adjustments")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2
            ${activeTab === "adjustments"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Coins size={18} />
          <span>Manual Adjustments</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2
            ${activeTab === "analytics"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <BarChart3 size={18} />
          <span>Earning Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab("redemptions")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2 relative
            ${activeTab === "redemptions"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Gift size={18} />
          <span>Voucher Claims</span>
          {redemptions.filter(r => r.status === "PENDING").length > 0 && (
            <span className="absolute right-0 top-2.5 bg-rose-500 text-white font-extrabold text-xxs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-950 animate-bounce">
              {redemptions.filter(r => r.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {/* Contents */}
      <AnimatePresence mode="wait">
        
        {/* Tab 1: Reward Inventory CRUD */}
        {activeTab === "inventory" && (
          <motion.div
            key="inventory-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Create Reward Form */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md h-fit">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Create Store Reward</h3>
              <form onSubmit={handleCreateReward} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Item Name</label>
                  <input
                    type="text"
                    required
                    value={rewardForm.name}
                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                    className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 10% course discount"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={rewardForm.description}
                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                    className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Enter short details explaining what user unlocks..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Point Cost</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={rewardForm.pointCost}
                      onChange={(e) => setRewardForm({ ...rewardForm, pointCost: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Initial Stock</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={rewardForm.stock}
                      onChange={(e) => setRewardForm({ ...rewardForm, stock: Number(e.target.value), maxStock: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Reward Type</label>
                  <select
                    value={rewardForm.type}
                    onChange={(e) => setRewardForm({ ...rewardForm, type: e.target.value })}
                    className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="DIGITAL_ACCESS">Digital Premium Access</option>
                    <option value="COUPON">Discount Coupon Code</option>
                    <option value="FEATURE_UNLOCK">Feature Unlock</option>
                    <option value="BADGE">Virtual Badge Reward</option>
                    <option value="CUSTOMIZATION">Certificate Customization</option>
                  </select>
                </div>

                {rewardForm.type === "DIGITAL_ACCESS" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Premium Duration (Days)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={rewardForm.durationDays}
                      onChange={(e) => setRewardForm({ ...rewardForm, durationDays: Number(e.target.value) })}
                      className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {rewardForm.type === "BADGE" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Badge Image URL</label>
                    <input
                      type="text"
                      value={rewardForm.badgeUrl}
                      onChange={(e) => setRewardForm({ ...rewardForm, badgeUrl: e.target.value })}
                      className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. /images/badges/warrior.png"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all duration-300 mt-2"
                >
                  {submitting ? "Creating..." : "Add Item to Store"}
                </button>

              </form>
            </div>

            {/* Inventory List */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md overflow-hidden">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Current Rewards Inventory</h3>
              
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="bg-gray-100 dark:bg-gray-850 h-16 rounded-xl" />
                  ))}
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No reward items in the inventory. Use the left form to add items.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Name</th>
                        <th className="py-4 px-6">Type</th>
                        <th className="py-4 px-6">Cost</th>
                        <th className="py-4 px-6">Stock</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm text-gray-700 dark:text-gray-300">
                      {rewards.map((r) => (
                        <tr key={r.rewardId} className={`hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors ${!r.isActive ? "opacity-50" : ""}`}>
                          <td className="py-4 px-6 font-semibold max-w-xs truncate" title={r.description}>{r.name}</td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xxs font-bold">{r.type.replace("_", " ")}</span>
                          </td>
                          <td className="py-4 px-6 font-extrabold text-yellow-600 dark:text-yellow-400">{r.pointCost} pts</td>
                          <td className="py-4 px-6">{r.stock} / {r.maxStock}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded text-xxs font-bold ${r.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                              {r.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDisableReward(r.rewardId)}
                              disabled={!r.isActive}
                              className={`p-2 rounded-xl transition-colors
                                ${r.isActive 
                                  ? "bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600" 
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"}`}
                              title="Disable Reward"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: Pending Approvals for Notes Uploads */}
        {activeTab === "approvals" && (
          <motion.div
            key="approvals-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map(n => (
                  <div key={n} className="bg-gray-150 h-32 rounded-3xl" />
                ))}
              </div>
            ) : pendingPosts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
                <CheckCircle2 className="mx-auto text-emerald-500/80 mb-4 animate-bounce" size={64} />
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300">All Caught Up!</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                  There are currently no community posts or notes uploads pending admin moderation. Clean slate!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingPosts.map((post) => (
                  <div
                    key={post.postId}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                          {post.category || "General"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Uploaded: {new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                        Uploaded by: <span className="font-normal text-gray-500 dark:text-gray-400">{post.user?.firstName} {post.user?.lastName} ({post.user?.userName})</span>
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-900">
                        {post.content}
                      </p>
                      {post.category?.toLowerCase() === "notes" && (
                        <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Coins size={14} />
                          <span>Approving this will award 30 points to the uploader.</span>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col justify-end gap-3 md:w-36 mt-auto md:mt-0">
                      <button
                        onClick={() => handleApprovePost(post.postId)}
                        className="flex-1 py-3 px-5 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all duration-300"
                      >
                        <CheckCircle2 size={16} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectPost(post.postId)}
                        className="flex-1 py-3 px-5 rounded-2xl font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 active:scale-95 transition-all duration-300"
                      >
                        <XCircle size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Manual Point Adjustment */}
        {activeTab === "adjustments" && (
          <motion.div
            key="adjustments-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-2xl border border-yellow-100 dark:border-yellow-900/40">
                <ShieldAlert className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Manual Balance Adjuster</h3>
                <p className="text-xs text-gray-400 mt-0.5">Use this form to award or deduct points for a specific student's wallet.</p>
              </div>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Student uniqueId (Unique User Key)</label>
                <input
                  type="text"
                  required
                  value={adjustForm.studentUniqueId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, studentUniqueId: e.target.value })}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter user's uniqueId (e.g. returned from students management list)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Points Offset</label>
                  <input
                    type="number"
                    required
                    value={adjustForm.points}
                    onChange={(e) => setAdjustForm({ ...adjustForm, points: Number(e.target.value) })}
                    className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 50 (or -50 to deduct)"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Positive to credit, negative to debit.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Operation Mode</label>
                  <div className="py-3.5 px-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-850 font-bold text-center text-sm text-gray-600 dark:text-gray-300">
                    {adjustForm.points >= 0 ? "🟢 CREDIT BALANCE" : "🔴 DEBIT BALANCE"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Recorded Reason</label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Compensating for streak reset bug / Doubt solving helper"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">This reason will be logged in the student's transaction sheet.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md shadow-yellow-600/10 hover:shadow-yellow-600/20 active:scale-95 transition-all duration-300 mt-2"
              >
                {submitting ? "Adjusting..." : "Submit Adjustments Log"}
              </button>

            </form>
          </motion.div>
        )}

        {/* Tab 4: Analytics and Fraud Alerts */}
        {activeTab === "analytics" && (
          <motion.div
            key="analytics-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Points Distributed</span>
                <h4 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                  +{analytics?.totalEarnedPoints || 0} <span className="text-sm font-normal text-gray-400">pts</span>
                </h4>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Points Redeemed</span>
                <h4 className="text-3xl font-extrabold text-rose-500 mt-2">
                  -{analytics?.totalSpentPoints || 0} <span className="text-sm font-normal text-gray-400">pts</span>
                </h4>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">System Net Circulation</span>
                <h4 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                  {(analytics?.totalEarnedPoints || 0) - (analytics?.totalSpentPoints || 0)} <span className="text-sm font-normal text-gray-400">pts</span>
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Popular Redemption counts */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Popular Store Items</h3>
                {(!analytics || !analytics.redemptionCounts || analytics.redemptionCounts.length === 0) ? (
                  <div className="text-center py-8 text-gray-400">No redemptions recorded yet.</div>
                ) : (
                  <div className="space-y-4">
                    {analytics.redemptionCounts.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-900">
                        <div>
                          <span className="text-sm font-bold text-gray-800 dark:text-white">{item.name}</span>
                          <span className="block text-xxs text-gray-400 uppercase tracking-wide">{item.type.replace("_", " ")}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{item.count} claims</span>
                          <span className="block text-xxs text-yellow-600 dark:text-yellow-400">-{item.pointsSpent} pts total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suspicious Farming Alerts */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="text-rose-500" size={20} />
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Abuse & Farming Alerts</h3>
                </div>
                {(!analytics || !analytics.farmingAlerts || analytics.farmingAlerts.length === 0) ? (
                  <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-1">
                    <CheckCircle2 className="text-emerald-500" size={32} />
                    <span>No suspicious point accumulation detected today.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.farmingAlerts.map((user, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl">
                        <div>
                          <span className="text-sm font-bold text-gray-800 dark:text-white">{user.username}</span>
                          <span className="block text-xxs text-gray-400">{user.email}</span>
                        </div>
                        <div className="bg-rose-500/20 border border-rose-500/40 px-3 py-1 rounded-full text-rose-600 dark:text-rose-400 font-extrabold text-xs">
                          {user.todayEarned} pts today
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* Tab 5: Voucher Claim Requests */}
        {activeTab === "redemptions" && (
          <motion.div
            key="redemptions-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-gray-850 dark:text-white mb-6">Student Voucher & Gift Claim Orders</h3>
              {redemptions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Gift className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                  <span>No reward redemptions requests recorded in the system.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Order Details</th>
                        <th className="py-4 px-6">User/Student</th>
                        <th className="py-4 px-6">Points Cost</th>
                        <th className="py-4 px-6">Claim Status</th>
                        <th className="py-4 px-6">Claim Code / Benefit Info</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm text-gray-750 dark:text-gray-300">
                      {redemptions.map((item) => (
                        <tr key={item.redemptionId} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-extrabold block text-gray-850 dark:text-white">{item.reward?.name || "Deleted Catalog Reward"}</span>
                            <span className="text-[10px] text-gray-450 tracking-wider font-semibold block uppercase mt-0.5">{item.reward?.type?.replace("_", " ")}</span>
                            <span className="text-xxs text-gray-400 block mt-1">ID: {item.redemptionId} | {new Date(item.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold block">{item.user?.firstName} {item.user?.lastName || ""}</span>
                            <span className="text-xs text-gray-400 block">@{item.user?.userName}</span>
                          </td>
                          <td className="py-4 px-6 font-bold text-yellow-600 dark:text-yellow-400">
                            {item.pointsSpent} pts
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xxs font-bold border ${
                              item.status === "PENDING"
                                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200 dark:border-amber-900/50"
                                : item.status === "COMPLETED"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/50"
                                : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-200 dark:border-rose-900/50"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {item.status === "COMPLETED" ? (
                              <div className="space-y-1">
                                {item.benefitDetails?.couponCode && (
                                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold block w-fit">
                                    {item.benefitDetails.couponCode}
                                  </span>
                                )}
                                {item.benefitDetails?.premiumExpiry && (
                                  <span className="text-xxs text-emerald-600 dark:text-emerald-400 block">
                                    Expiry: {new Date(item.benefitDetails.premiumExpiry).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="text-xxs text-gray-400 block">{item.benefitDetails?.description}</span>
                              </div>
                            ) : item.status === "REJECTED" ? (
                              <span className="text-xs text-rose-500 font-semibold italic">{item.benefitDetails?.description || "Rejected by admin"}</span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Waiting for processing...</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {item.status === "PENDING" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleProcessRedemption(item.redemptionId, "COMPLETED")}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white transition-all"
                                  title="Approve Order"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleProcessRedemption(item.redemptionId, "REJECTED")}
                                  className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white transition-all"
                                  title="Reject & Refund Points"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xxs text-gray-400 font-medium">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};

export default AdminRewardsPanel;
