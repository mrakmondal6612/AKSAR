import React, { useState } from "react"
import UserHistoryVideos from '@/components/history/UserHistoryVideos';
import { useAuthContext } from '@/context/authContext';
import TextFlipSmoothRevealEffect from '@/Effects/TextFlipSmoothRevealEffect';
import { getVerifiedToken } from '@/lib/cookieService';
import {getUserData as fetchUserData} from "@/lib/authService"
import { USER_API } from '@/lib/env';
import { SuccessToast, ErrorToast } from '@/lib/toasts';
import axios from 'axios';
import { motion } from 'framer-motion';
import {Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, DateInput} from "@nextui-org/react"
import { Trash2, Calendar as CalendarIcon } from "lucide-react"
import { CalendarDate } from "@internationalized/date"

const History = () => {
  const {userData , setUserData} = useAuthContext();
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<CalendarDate | null>(null);
  const [endDate, setEndDate] = useState<CalendarDate | null>(null);

  const handleHistoryChange = async () => {
    const userData = await fetchUserData();
    if(userData){
      setUserData(userData);
    }
  };

  async function confirmDelete() {
    const jwt = getVerifiedToken();
    try {
      const response = await axios.delete(
        `${USER_API}/delete-user-entire-history`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.data && response.data.success) {
        SuccessToast(response.data.message);
        // Refresh user data after clearing history
        await handleHistoryChange();
      } else {
        ErrorToast(response.data.message || "Failed to delete video");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Something went wrong");
    }
  }

  async function confirmDeleteByDateRange() {
    if (!startDate || !endDate) {
      ErrorToast("Please select both start and end dates");
      return;
    }

    const jwt = getVerifiedToken();
    try {
      const response = await axios.post(
        `${USER_API}/delete-history-by-date-range`,
        {
          startDate: startDate.toString(),
          endDate: endDate.toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.data && response.data.success) {
        SuccessToast(response.data.message);
        setIsDateRangeModalOpen(false);
        setStartDate(null);
        setEndDate(null);
        // Refresh user data after clearing history
        await handleHistoryChange();
      } else {
        ErrorToast(response.data.message || "Failed to delete history");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Something went wrong");
    }
  }
  React.useEffect(() => {
    const fetchData = async () => {
      const userData = await fetchUserData();
      if(userData){
        setUserData(userData);
      }
    };
    
    fetchData();
  }, [setUserData]);
  
  return (
      <motion.div
        className="dark:bg-white/5 bg-black/5 rounded-lg p-6 "
        variants={{
          hidden: { opacity: 0.3, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.8 }
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="  flex justify-center items-center text-center gap-2 overflow-hidden">
          <TextFlipSmoothRevealEffect text="HISTORY" className="sm:text-5xl text-3xl"/>
        </div>
        <div className="  flex justify-end items-end text-center gap-2 overflow-hidden">
          <Button
          onClick={confirmDelete}
          className="bg-red-500/20 text-red-600 dark:text-red-400"
          startContent={<Trash2 className="w-4 h-4" />}
          >
           Clear All History
          </Button>
          <Button
          onClick={() => setIsDateRangeModalOpen(true)}
          className="bg-purple-500/20 text-purple-600 dark:text-purple-400"
          startContent={<CalendarIcon className="w-4 h-4" />}
          >
           Clear by Date Range
          </Button>
        </div>
        {userData && userData.history && 
          <UserHistoryVideos history={userData.history} onHistoryChange={handleHistoryChange}/>
        }

        {/* Date Range Clear Modal */}
        <Modal 
          isOpen={isDateRangeModalOpen} 
          onOpenChange={setIsDateRangeModalOpen}
          size="md"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Clear History by Date Range
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <DateInput
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  className="max-w-xs"
                />
                <DateInput
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will permanently delete all watch history within the selected date range.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="danger" 
                variant="light" 
                onPress={() => {
                  setIsDateRangeModalOpen(false);
                  setStartDate(null);
                  setEndDate(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={confirmDeleteByDateRange}
              >
                Clear History
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </motion.div>
  )
}

export default History;
