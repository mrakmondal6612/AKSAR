import React from 'react';
import { useCourseContext } from '@/context/courseContext';

const semesterLabels = ['All', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

const technicalKeywords = [
  'computer', 'program', 'programming', 'data', 'algorithm', 'database', 'network', 'os', 'operating system',
  'engineering', 'software', 'hardware', 'dsa', 'c++', 'java', 'python', 'react', 'node', 'linux'
];

const SemesterFilter: React.FC = () => {
  const { coursesData, setupdatedCourseData } = useCourseContext();
  const [selectedSemester, setSelectedSemester] = React.useState<string>('All');
  const [technicalOnly, setTechnicalOnly] = React.useState<boolean>(false);

  const applyFilter = React.useCallback(() => {
    if (!coursesData || coursesData.length === 0) {
      setupdatedCourseData([]);
      return;
    }

    let filtered = [...coursesData];

    // Semester filtering: look for common semester markers in title/description
    if (selectedSemester !== 'All') {
      const semNum = selectedSemester.replace(/^S/i, '');
      const semRegex = new RegExp(`(semester\\s*${semNum}|${semNum}\\s*th\\s*semester|\\bS${semNum}\\b|\\bsem\\s*${semNum}\\b)`, 'i');
      filtered = filtered.filter((c: any) => {
        const hay = `${c.courseName || ''} ${c.description || ''}`;
        return semRegex.test(hay);
      });
    }

    // Technical filter heuristics
    if (technicalOnly) {
      const techRegex = new RegExp(technicalKeywords.join('|'), 'i');
      filtered = filtered.filter((c: any) => techRegex.test(`${c.courseName || ''} ${c.description || ''}`));
    }

    setupdatedCourseData(filtered);
  }, [coursesData, selectedSemester, technicalOnly, setupdatedCourseData]);

  React.useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <div className="flex gap-2 flex-wrap">
        {semesterLabels.map((lbl) => (
          <button
            key={lbl}
            onClick={() => setSelectedSemester(lbl)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${selectedSemester === lbl ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={technicalOnly} onChange={(e) => setTechnicalOnly(e.target.checked)} />
          <span className="text-sm">Technical only</span>
        </label>
      </div>
    </div>
  );
};

export default SemesterFilter;
