import { useAuthContext } from '@/context/authContext';
import ProfileIcon from '@/Icons/ProfileIcon';
import { getVerifiedToken } from '@/lib/cookieService';
import { USER_API } from '@/lib/env';
import { userLogout } from '@/lib/getLocalStorage';
import { ErrorToast, SuccessToast, WarningToast } from '@/lib/toasts';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from '@nextui-org/react'
import { Label } from '@radix-ui/react-dropdown-menu';
import axios from 'axios';
import React from 'react'
import {useNavigate} from "react-router-dom"

const ChangeRoleField: React.FC = () => {
    const [inputValue, setInputValue] = React.useState("");
    const {setIsLoggedIn} = useAuthContext();
    const [isInputValid, setIsInputValid] = React.useState(false);
    const { onClose, isOpen, onOpen } = useDisclosure();
    const navigate = useNavigate();

    const handleInputChange = (event: { target: { value: string } }) => {
        const { value } = event.target;
        setInputValue(value);
        setIsInputValid(value === "Confirm Role INSTRUCTOR");
    };

    async function handleConfirmAdmin(){
        if(inputValue.trim() === `Confirm Role INSTRUCTOR`){
            await confirmAdmin();
        }
        else{
            ErrorToast("Please enter the correct phrase")
        }
    }

    async function confirmAdmin () {
        const jwt = getVerifiedToken();
        const newRole = "INSTRUCTOR";
        try{
            const response = await axios.put(`${USER_API}/update-role` , {newRole} , {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
            })
            if(response && response.data && response.data.success){
                SuccessToast(response.data.message);
                localStorage.removeItem('cachedUserData');
                localStorage.removeItem('userDataCacheTime');
                userLogout();
                setIsLoggedIn(false);
                WarningToast("Please login again...")
                onClose();
                navigate("/login");
            }
            else{
                ErrorToast(response.data.message);
            }
        }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        catch (error: any) {
            ErrorToast(error.response?.data?.message);
        }
    }

    return (
        <div className='w-full px-2'>
            <Button
                className="dark:bg-green-600/50 bg-green-300 hover:bg-green-600 dark:hover:bg-green-500 transition-colors duration-200 font-semibold font-ubuntu text-black dark:text-white/80 w-full"
                onPress={onOpen}
            >
                Change Role
            </Button>
            <Modal backdrop={"opaque"} isOpen={isOpen} onClose={onClose}>
                <ModalContent className="sm:max-w-[480px] p-6 shadow-lg rounded-lg dark:bg-gray-800 bg-white">
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="w-full space-x-2 flex justify-start items-center">
                            <ProfileIcon fillColor="rgb(139 92 246)" />
                            <span className="font-ubuntu text-2xl font-bold text-purple-700 dark:text-purple-400">
                      Become Instructor
                    </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-base mt-2">
                            Are you sure? You want to be a{" "}
                            <span className="font-bold">INSTRUCTOR</span>
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
                                ].map((message, index) => (
                                    <li key={index} className="flex items-center mb-2">
                                        <span className="text-purple-600 dark:text-purple-400 font-bold text-lg mr-2">✓</span>
                                        <span className="text-gray-800 dark:text-gray-300">{message}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="w-full flex flex-col gap-3 mt-4">
                                <Label>Type <span className="font-ubuntu font-semibold">Confirm Role INSTRUCTOR </span>below</Label>
                                <Input
                                    type="text"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    placeholder='Type "Confirm Role INSTRUCTOR"'
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
                    <ModalFooter className="flex justify-between mt-4">
                        <Button
                            color="success"
                            type="submit"
                            isDisabled={!isInputValid}
                            variant="ghost"
                            onClick={handleConfirmAdmin}
                        >
                            Confirm
                        </Button>
                        <Button color="default" onPress={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}

export default ChangeRoleField