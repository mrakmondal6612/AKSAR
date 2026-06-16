import { Select, SelectItem } from "@nextui-org/react";
import React from "react";

interface CategoryFilterProps{
  onChangeFilter: (data : {categoryValue:string}) => void
}
const CategoryFilter: React.FC<CategoryFilterProps> = ({onChangeFilter}) => {

  const categoryFilterValues = [
    "ALL",
    "YOUTUBE",
    "SEMESTER",
    "TECH",
    "PERSONAL",
    "REDIRECT"
  ];
  function handleCategoryChange (category: string) {
    const categoryValue = categoryFilterValues[parseFloat(category)].toString();
    onChangeFilter({categoryValue});
  };

  return (
    <Select
      label="Select category"
      variant="underlined"
      onChange={(e) => handleCategoryChange(e.target.value)}
      className=" focus-visible:border-none focus-visible:outline-none text-xl"
    >
      {categoryFilterValues.map((uniqueCategory, index) => (
        <SelectItem key={index} value={uniqueCategory}>
          {uniqueCategory === "ALL" ? "All Courses" :
           uniqueCategory === "YOUTUBE" ? "YouTube" :
           uniqueCategory === "SEMESTER" ? "Semester" :
           uniqueCategory === "TECH" ? "Tech" :
           uniqueCategory === "PERSONAL" ? "AKSAR" : "Others" }
        </SelectItem>
      ))}
    </Select>
  );
};

export default CategoryFilter;
