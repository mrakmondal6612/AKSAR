import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, DatePicker } from "@nextui-org/react";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import { getVerifiedToken } from "@/lib/cookieService";
import { USER_API } from "@/lib/env";
import axios from "axios";
import { useAuthContext } from "@/context/authContext";
import { getUserData as fetchUserData} from "@/lib/authService";


// Zod validation schema
const schema = z.object({
  dob: z.string().min(1, "Date of Birth is required"),
});

function convertDateFormat(dateString: string): string {
  // Accept either ISO (YYYY-MM-DD) or Date string; return DD-MM-YYYY
  if (!dateString) return "";
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }
  // Fallback: try to parse as Date
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

type DobAndRoleFormData = z.infer<typeof schema>;

const DobForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DobAndRoleFormData>({
    resolver: zodResolver(schema),
  });
  const {setUserData} = useAuthContext();
  const loadUserData = useCallback(async () => {
    const userData = await fetchUserData(); 
    if (userData) {
      setUserData(userData);
    }
  }, [setUserData]);

  const onSubmit = async(data: DobAndRoleFormData) => {
    const userDob = convertDateFormat(data.dob);

    const jwt = getVerifiedToken();

    try {
        const response = await axios.put(`${USER_API}/update-user` , {userDob} , {
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
        })

        if(response && response.data && response.data.success){
            SuccessToast(response.data.message);
          // Clear cached user data so the updated DOB is fetched fresh
          localStorage.removeItem('cachedUserData');
          localStorage.removeItem('userDataCacheTime');
          await loadUserData();
        }
        else{
            ErrorToast(response.data.message);
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        ErrorToast(error.response?.data?.message);
    }
  };

  return (
    <div className="w-full relative justify-end items-start gap-2 flex sm:flex-row flex-col ">
      <div className="w-full flex flex-col relative">
        <DatePicker
          label="Birth Date"
          variant="bordered" 
          showMonthAndYearPickers
          className=""
          {...register("dob")} // Register DOB field
          onChange={(date) => {
            const selected = date ? new Date(date as any) : null;
            const currentDate = new Date();

            if (!selected) {
              setValue("dob", "");
              return;
            }

            if (selected > currentDate) {
              setValue("dob", "");
              ErrorToast("You cannot select a future date.");
            } else {
              // store as YYYY-MM-DD for consistent parsing
              const iso = selected.toISOString().slice(0, 10);
              setValue("dob", iso);
            }
          }}
        />
        {errors.dob && errors.dob.message && (
          <p className="text-red-500 text-sm text-end ">
            {errors.dob.message}
          </p>
        )}
      </div>

      <Button
        className="font-ubuntu font-medium max-sm:w-full"
        type="button"
        onClick={handleSubmit(onSubmit)}
      >
        Update
      </Button>
    </div>
  );
};

export default DobForm;