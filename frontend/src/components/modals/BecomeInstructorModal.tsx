import React from 'react';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import ProfileIcon from '@/Icons/ProfileIcon';
import { useNavigate } from 'react-router-dom';
import { getVerifiedToken } from '@/lib/cookieService';
import { USER_API } from '@/lib/env';
import { ErrorToast, SuccessToast, WarningToast } from '@/lib/toasts';
import { userLogout } from '@/lib/getLocalStorage';
import { useAuthContext } from '@/context/authContext';
import axios from 'axios';

const BecomeInstructorModal: React.FC = () => {
    const [isOpen, setIsOpen] = React.useState<boolean>(true);
    const [inputValue, setInputValue] = React.useState("");
    const { setIsLoggedIn } = useAuthContext();
    const navigate = useNavigate();

    const isInputValid = inputValue === "Confirm Role INSTRUCTOR";

    const handleConfirm = async () => {
        if (!isInputValid) {
            ErrorToast("Please type the correct phrase");
            return;
        }
        const jwt = getVerifiedToken();
        try {
            const response = await axios.put(
                `${USER_API}/update-role`,
                { newRole: "INSTRUCTOR" },
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response?.data?.success) {
                SuccessToast(response.data.message);
                localStorage.removeItem('cachedUserData');
                localStorage.removeItem('userDataCacheTime');
                userLogout();
                setIsLoggedIn(false);
                WarningToast("Please login again...");
                navigate("/login");
            } else {
                ErrorToast(response.data.message);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            ErrorToast(error.response?.data?.message || "Something went wrong");
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
                        By changing your role to
                        <span className="font-bold"> INSTRUCTOR</span>, you'll unlock the following privileges:
                    </p>
                </ModalHeader>

                <ModalBody>
                    <div className="gap-4 pb-4 flex flex-col justify-start items-center">
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

                        <div className="w-full flex flex-col gap-2">
                            <p className="text-sm font-ubuntu text-gray-600 dark:text-gray-400">
                                Type <span className="font-bold text-purple-500">Confirm Role INSTRUCTOR</span> to confirm
                            </p>
                            <Input
                                type="text"
                                placeholder='Type "Confirm Role INSTRUCTOR"'
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                classNames={{
                                    input: "font-ubuntu",
                                    inputWrapper: isInputValid
                                        ? "border-purple-500"
                                        : "border-gray-300 dark:border-gray-600",
                                }}
                            />
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter className="flex flex-col gap-2">
                    <Button
                        isDisabled={!isInputValid}
                        className="bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300 font-ubuntu w-full"
                        onClick={handleConfirm}
                    >
                        Confirm Role Change
                    </Button>
                    <Button
                        color="danger"
                        variant="bordered"
                        onClick={() => setIsOpen(false)}
                        className="hover:bg-red-600/10 transition-colors duration-300 w-full"
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default BecomeInstructorModal;