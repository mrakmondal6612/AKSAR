import { createContext, useState, useContext, ReactNode, useEffect} from "react";
import React from "react";

interface DashboardContextType {
  isSideBarOpen : boolean;
  setIsSideBarOpen : React.Dispatch<React.SetStateAction<boolean>>;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an DashboardContextProvider");
  }
  return context;
};

export const DashboardContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSideBarOpen , setIsSideBarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSideBarOpen));
  }, [isSideBarOpen]);

 return (
    <DashboardContext.Provider
      value={{

        isSideBarOpen,
        setIsSideBarOpen
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
