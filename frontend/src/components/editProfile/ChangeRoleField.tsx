import React from 'react';
import { Button } from '@nextui-org/react';
import { useNavigate } from 'react-router-dom';
import ProfileIcon from '@/Icons/ProfileIcon';

const ChangeRoleField: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full bg-white dark:bg-[#0f121d]/40 rounded-2xl p-6 border border-purple-500/20 dark:border-purple-500/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                    <ProfileIcon fillColor="rgb(168 85 247)" />
                </div>
                <div className="text-left">
                    <h3 className="font-ubuntu font-bold text-lg text-gray-800 dark:text-white">Become an Instructor</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu">
                        Share your knowledge, build courses, and teach students around the world.
                    </p>
                </div>
            </div>
            <Button
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold font-ubuntu px-6 py-2 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md shadow-purple-500/10 shrink-0 w-full md:w-auto"
                onClick={() => navigate("/user/become-instructor")}
            >
                Apply Now
            </Button>
        </div>
    );
};

export default ChangeRoleField;