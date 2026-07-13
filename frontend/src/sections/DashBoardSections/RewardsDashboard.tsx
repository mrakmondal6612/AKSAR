import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Flame, Trophy, Award, Clock, Copy, Check, Filter, Coins, Calendar } from "lucide-react";
import { getVerifiedToken } from "@/lib/cookieService";
import { REWARDS_API } from "@/lib/env";
import { SuccessToast, ErrorToast } from "@/lib/toasts";
import { useAuthContext } from "@/context/authContext";
import { getUserData } from "@/lib/authService";

interface RewardItem {
  rewardId: string;
  name: string;
  description: string;
  pointCost: number;
  type: "DIGITAL_ACCESS" | "COUPON" | "FEATURE_UNLOCK" | "BADGE" | "CUSTOMIZATION";
  stock: number;
  maxStock: number;
  badgeUrl?: string;
  durationDays?: number;
}

interface RedemptionItem {
  redemptionId: string;
  reward: RewardItem;
  pointsSpent: number;
  status: string;
  benefitDetails?: {
    couponCode?: string;
    badgeName?: string;
    premiumExpiry?: string;
    description?: string;
  };
  createdAt: string;
}

interface TransactionItem {
  transactionId: string;
  points: number;
  type: "EARNED" | "SPENT" | "ADMIN_ADJUSTMENT";
  activityType: string;
  description: string;
  createdAt: string;
}

const RewardsDashboard: React.FC = () => {
  const { userData, setUserData } = useAuthContext();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [myRewards, setMyRewards] = useState<RedemptionItem[]>([]);
  const [history, setHistory] = useState<TransactionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"store" | "my-rewards" | "history">("store");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingDaily, setClaimingDaily] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>("");
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);

  const jwt = getVerifiedToken();

  const purchasePackages = [
    { points: 500, price: 50, badge: "Starter" },
    { points: 1000, price: 100, badge: "Popular" },
    { points: 2500, price: 230, badge: "Super Value" },
    { points: 5000, price: 450, badge: "Best Value" },
  ];

  const handlePurchasePoints = async (pointsAmount: number) => {
    try {
      setPurchaseLoading(true);
      const res = await axios.post(
        `${REWARDS_API}/purchase-points`,
        { pointsAmount },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      if (res.data.success) {
        const { order, keyId, points } = res.data;

        const options = {
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: "AKSAR",
          description: `Purchase ${points} Reward Points`,
          order_id: order.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await axios.post(
                `${REWARDS_API}/verify-points`,
                {
                  orderId: order.id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  pointsAmount: points,
                },
                { headers: { Authorization: `Bearer ${jwt}` } }
              );

              if (verifyRes.data.success) {
                SuccessToast(`Successfully purchased ${points} points!`);
                setShowBuyModal(false);
                fetchDashboardData();
              } else {
                ErrorToast("Payment verification failed");
              }
            } catch (err) {
              ErrorToast("Failed to verify payment");
            }
          },
          prefill: {
            name: userData?.firstName ? `${userData.firstName} ${userData.lastName || ""}` : "",
            email: userData?.email || "",
          },
          theme: {
            color: "#8b5cf6",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!jwt) return;
    try {
      setLoading(true);
      const [rewardsRes, myRewardsRes, historyRes, uData] = await Promise.all([
        axios.get(`${REWARDS_API}/store`, { headers: { Authorization: `Bearer ${jwt}` } }),
        axios.get(`${REWARDS_API}/my-rewards`, { headers: { Authorization: `Bearer ${jwt}` } }),
        axios.get(`${REWARDS_API}/history`, { headers: { Authorization: `Bearer ${jwt}` } }),
        getUserData(),
      ]);

      if (rewardsRes.data.success) setRewards(rewardsRes.data.data);
      if (myRewardsRes.data.success) setMyRewards(myRewardsRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
      if (uData) setUserData(uData);
    } catch (error: any) {
      console.error("Error loading rewards dashboard data:", error);
      ErrorToast("Failed to sync reward system data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [jwt]);

  const handleClaimDaily = async () => {
    if (!jwt || claimingDaily) return;
    setClaimingDaily(true);
    try {
      const res = await axios.post(`${REWARDS_API}/claim-daily`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data.success) {
        SuccessToast(res.data.message || "Claimed daily points successfully!");
        fetchDashboardData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to claim daily points");
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!jwt) return;
    try {
      const res = await axios.post(`${REWARDS_API}/redeem`, { rewardId }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data.success) {
        SuccessToast(res.data.message || "Redemption successful!");
        fetchDashboardData();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Redemption failed");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    SuccessToast("Copied to clipboard!");
    setTimeout(() => setCopiedId(""), 2000);
  };

  const filterOptions = [
    { label: "All Items", value: "ALL" },
    { label: "Digital Access", value: "DIGITAL_ACCESS" },
    { label: "Discount Coupons", value: "COUPON" },
    { label: "Features", value: "FEATURE_UNLOCK" },
    { label: "Badges", value: "BADGE" },
    { label: "Customization", value: "CUSTOMIZATION" },
  ];

  const filteredRewards = filterType === "ALL" 
    ? rewards 
    : rewards.filter(r => r.type === filterType);

  const getPointsBalance = () => {
    return (userData as any).points || 0;
  };

  const getLifetimePoints = () => {
    return (userData as any).lifetimePoints || 0;
  };

  const getStreak = () => {
    return (userData as any).currentStreak || 0;
  };

  const getPremiumExpiry = () => {
    const expiry = (userData as any).premiumExpiry;
    if (!expiry) return null;
    const date = new Date(expiry);
    if (date.getTime() < Date.now()) return null;
    return date.toLocaleDateString(undefined, { dateStyle: "long" });
  };

  const isDailyClaimedToday = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    return history.some(
      (txn) =>
        txn.activityType === "DAILY_LOGIN" &&
        new Date(txn.createdAt).toISOString().split("T")[0] === todayStr
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 font-ubuntu transition-colors duration-300">
      
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Wallet Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Coins size={200} />
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-indigo-200 text-sm font-semibold tracking-wider uppercase">Points Balance</span>
            <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md">
              <Coins className="text-yellow-400" size={24} />
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
            {getPointsBalance()} <span className="text-lg font-normal text-indigo-200">pts</span>
          </h2>
          <div className="flex items-center gap-2 mt-4 text-sm text-indigo-100">
            <Trophy size={16} className="text-yellow-300 animate-bounce" />
            <span>Lifetime Earned: <strong className="text-white">{getLifetimePoints()} pts</strong></span>
          </div>
          {getPremiumExpiry() && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 text-xs">
              <Clock size={12} />
              <span>Premium active until {getPremiumExpiry()}</span>
            </div>
          )}
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setShowBuyModal(true)}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-1.5 backdrop-blur-md shadow-md text-xs sm:text-sm"
            >
              <Coins size={16} className="text-yellow-300 animate-spin-slow" />
              + Buy Points
            </button>
          </div>
        </div>

        {/* Streak Flame Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 text-orange-500/10">
            <Flame size={120} />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-gray-400 dark:text-gray-500 text-sm font-semibold tracking-wider uppercase">Learning Streak</span>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1 flex items-center gap-2">
                {getStreak()} Days
                <Flame className={`text-orange-500 ${getStreak() > 0 ? "animate-pulse fill-orange-500" : ""}`} size={28} />
              </h3>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-2xl">
              <Flame className="text-orange-500" size={24} />
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
            Complete at least one lesson or quiz daily to maintain your streak and claim weekly bonuses.
          </p>
        </div>

        {/* Daily Bonus Claim Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500/10">
            <Gift size={120} />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-gray-400 dark:text-gray-500 text-sm font-semibold tracking-wider uppercase">Daily Login Points</span>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Claim 5 Points</h3>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl">
              <Gift className="text-emerald-500" size={24} />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleClaimDaily}
              disabled={claimingDaily || isDailyClaimedToday()}
              className={`w-full py-3.5 px-6 rounded-2xl font-semibold shadow-md flex items-center justify-center gap-2 transition-all duration-300
                ${claimingDaily 
                  ? "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed" 
                  : isDailyClaimedToday()
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-700 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-emerald-500/10 hover:shadow-emerald-500/20"}`}
            >
              {claimingDaily ? "Claiming..." : isDailyClaimedToday() ? "Claimed Today" : "Claim Daily Bonus"}
            </button>
          </div>
        </div>

      </div>

      {/* 2. Main Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <button
          onClick={() => setActiveTab("store")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2
            ${activeTab === "store"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Gift size={18} />
          <span>Reward Store</span>
        </button>
        <button
          onClick={() => setActiveTab("my-rewards")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2
            ${activeTab === "my-rewards"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Award size={18} />
          <span>My Claimed Benefits</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-4 px-6 font-semibold border-b-2 text-base transition-all duration-300 flex items-center gap-2
            ${activeTab === "history"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          <Clock size={18} />
          <span>Transaction History</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      <AnimatePresence mode="wait">
        
        {/* Tab 1: Reward Store */}
        {activeTab === "store" && (
          <motion.div
            key="store-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-semibold flex items-center gap-1.5 mr-2">
                <Filter size={16} />
                <span>Filters:</span>
              </div>
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value)}
                  className={`py-1.5 px-4 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300
                    ${filterType === opt.value
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 h-64 animate-pulse" />
                ))}
              </div>
            ) : filteredRewards.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
                <Gift className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300">No Rewards Available</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                  There are currently no items configured under this filter. Check back soon for exciting digital awards!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRewards.map((reward) => {
                  const cannotAfford = getPointsBalance() < reward.pointCost;
                  const isOutOfStock = reward.stock <= 0;

                  return (
                    <div
                      key={reward.rewardId}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1"
                    >
                      <div>
                        {/* Type Badge */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                            {reward.type.replace("_", " ")}
                          </span>
                          <span className={`text-xs font-semibold ${isOutOfStock ? "text-red-500" : "text-gray-400"}`}>
                            {isOutOfStock ? "Out of Stock" : `Stock: ${reward.stock}/${reward.maxStock}`}
                          </span>
                        </div>

                        <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {reward.name}
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                          {reward.description}
                        </p>
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-800/60 pt-4 flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Point Cost</span>
                          <span className="text-2xl font-extrabold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            {reward.pointCost} <span className="text-xs font-normal text-gray-400">pts</span>
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (cannotAfford) {
                              setShowBuyModal(true);
                            } else {
                              handleRedeem(reward.rewardId);
                            }
                          }}
                          disabled={isOutOfStock}
                          className={`py-2.5 px-5 rounded-2xl text-sm font-semibold tracking-wide shadow transition-all duration-300 active:scale-95
                            ${isOutOfStock
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none border border-gray-200 dark:border-gray-800"
                              : cannotAfford
                              ? "bg-transparent border border-purple-500 hover:bg-purple-500/5 text-purple-600 dark:text-purple-400 hover:shadow-purple-500/5"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10 hover:shadow-indigo-600/20"}`}
                        >
                          {isOutOfStock ? "Sold Out" : cannotAfford ? "Buy Points" : "Redeem"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: My Claimed Benefits */}
        {activeTab === "my-rewards" && (
          <motion.div
            key="my-rewards-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 h-32 animate-pulse" />
                ))}
              </div>
            ) : myRewards.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
                <Award className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300">No Redeemed Rewards</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                  You haven't redeemed any rewards from the store yet. Keep learning and collect points to redeem digital advantages!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRewards.map((item) => (
                  <div
                    key={item.redemptionId}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md flex justify-between relative overflow-hidden"
                  >
                    <div className="flex flex-col justify-between flex-1 pr-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xxs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50">
                            {item.reward?.type || "Benefit"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                          {item.reward?.name || "Active Reward Benefit"}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.benefitDetails?.description || "Successfully unlocked benefit"}
                        </p>
                      </div>

                      {/* Display Action / Coupon Details */}
                      {item.benefitDetails?.couponCode && (
                        <div className="mt-4 flex items-center gap-3">
                          <div className="bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 font-mono text-sm font-bold py-2 px-4 rounded-xl text-gray-800 dark:text-white select-all">
                            {item.benefitDetails.couponCode}
                          </div>
                          <button
                            onClick={() => copyToClipboard(item.benefitDetails!.couponCode!, item.redemptionId)}
                            className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 transition-all duration-300"
                            title="Copy coupon code"
                          >
                            {copiedId === item.redemptionId ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between text-right">
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/40 rounded-2xl p-3 inline-flex flex-col items-center">
                        <Coins size={16} className="text-yellow-600 dark:text-yellow-400 mb-0.5" />
                        <span className="text-sm font-extrabold text-yellow-600 dark:text-yellow-400">-{item.pointsSpent}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Transaction History */}
        {activeTab === "history" && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 h-64 animate-pulse" />
            ) : history.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm">
                <Clock className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300">No Transaction History</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                  All points earned through quizzes, logins, notes uploads, and spent items will appear here in chronological order.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Reason / Activity</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm text-gray-700 dark:text-gray-300">
                      {history.map((txn) => {
                        const isEarn = txn.points > 0;
                        return (
                          <tr key={txn.transactionId} className="hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="py-4 px-6 font-semibold">{txn.description}</td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 text-xs">
                                {txn.type === "ADMIN_ADJUSTMENT" ? (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 dark:border-blue-900/50 text-xxs font-bold">ADMIN ADJUST</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xxs font-bold">{txn.activityType.replace("_", " ")}</span>
                                )}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400">
                              <span className="flex items-center gap-1.5 text-xs">
                                <Calendar size={12} />
                                {new Date(txn.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            </td>
                            <td className={`py-4 px-6 text-right font-extrabold text-base ${isEarn ? "text-emerald-500" : "text-rose-500"}`}>
                              {isEarn ? `+${txn.points}` : txn.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* 4. Buy Points Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setShowBuyModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
            >
              &times;
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-100 dark:bg-purple-950/30 p-2.5 rounded-2xl">
                <Coins className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-850 dark:text-white">Buy Reward Points</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Manually purchase points using Razorpay to claim your favourite gift cards, vouchers, and rewards instantly.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {purchasePackages.map((pkg) => (
                <button
                  key={pkg.points}
                  disabled={purchaseLoading}
                  onClick={() => handlePurchasePoints(pkg.points)}
                  className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-4 text-center hover:border-purple-500 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-all flex flex-col justify-between items-center gap-2 relative group"
                >
                  {pkg.points >= 2500 && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[9px] font-bold py-0.5 px-2 rounded-full shadow-sm">
                      SAVE MONEY
                    </span>
                  )}
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{pkg.badge}</span>
                  <div className="text-2xl font-extrabold text-gray-850 dark:text-white flex items-center gap-1">
                    {pkg.points} <span className="text-xs font-normal text-gray-500">pts</span>
                  </div>
                  <div className="bg-purple-600 hover:bg-purple-700 text-white w-full rounded-xl py-2 px-3 font-semibold text-sm mt-2 transition-colors">
                    ₹{pkg.price}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-400 text-center">
              Secured payments powered by Razorpay. Conversion Rate: ₹1 = 10 Points.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RewardsDashboard;
