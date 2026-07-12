import React from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import ProfileIcon from '@/Icons/ProfileIcon';
import { getVerifiedToken } from '@/lib/cookieService';
import { USER_API } from '@/lib/env';
import { ErrorToast, SuccessToast } from '@/lib/toasts';
import axios from 'axios';


const BecomeInstructorModal: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState<boolean>(true);
    const [reason, setReason] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmitRequest = async () => {
        setLoading(true);
        const jwt = getVerifiedToken();
        try {
            const response = await axios.post(
                `${USER_API}/instructor-request`,
                { reason },
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response?.data?.success) {
                SuccessToast(response.data.message);
                setSubmitted(true);
            } else {
                ErrorToast(response.data.message);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            ErrorToast(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal backdrop="opaque" isOpen={isOpen} onClose={() => setIsOpen(false)}>
            <ModalContent className="sm:max-w-[480px] p-6 shadow-lg rounded-lg dark:bg-gray-800 bg-white">
                <ModalHeader className="flex flex-col gap-1">
                    <div className="w-full space-x-2 flex justify-start items-center">
                        <ProfileIcon fillColor="rgb(139 92 246)" />
                        <span className="font-ubuntu text-2xl font-bold text-purple-700 dark:text-purple-400">
                            Become an Instructor
                        </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-base mt-2">
                        Submit a request to become an <span className="font-bold">INSTRUCTOR</span>. Admin will review and approve.
                    </p>
                </ModalHeader>

                <ModalBody>
                    {submitted ? (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="text-5xl">🎉</div>
                            <p className="font-ubuntu font-semibold text-green-600 dark:text-green-400 text-center">
                                Request submitted successfully!
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu text-center">
                                Admin will review your request and you'll be notified once approved.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <ul className="w-full bg-gray-50 dark:bg-gray-900 text-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                {[
                                    "Create and manage your own courses.",
                                    "Upload videos and course content.",
                                    "Track student enrollment and progress.",
                                    "Add tests and assignments for your courses.",
                                ].map((privilege, index) => (
                                    <li key={index} className="flex items-center mb-2">
                                        <span className="text-purple-600 dark:text-purple-400 font-bold text-lg mr-2">✓</span>
                                        <span className="text-gray-800 dark:text-gray-300">{privilege}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-ubuntu text-gray-600 dark:text-gray-400">
                                    Why do you want to become an instructor? <span className="text-gray-400">(optional)</span>
                                </p>
                                <textarea
                                    placeholder="Tell us about your expertise and what you'd like to teach..."
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows={3}
                                    maxLength={300}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white text-sm font-ubuntu focus:outline-none focus:border-purple-400 resize-none"
                                />
                                <p className="text-xs text-gray-400 text-right">{reason.length}/300</p>
                            </div>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="flex flex-col gap-2">
                    {!submitted ? (
                        <>
                            <Button
                                isLoading={loading}
                                className="bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300 font-ubuntu w-full"
                                onClick={handleSubmitRequest}
                            >
                                Submit Request
                            </Button>
                            <Button
                                color="danger"
                                variant="bordered"
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-red-600/10 transition-colors duration-300 w-full"
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button
                            className="bg-purple-600 text-white font-ubuntu w-full"
                            onClick={() => setIsOpen(false)}
                        >
                            Close
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default BecomeInstructorModal;