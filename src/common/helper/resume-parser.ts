
export const extractSkills = (rawText: string): string[] => {
    if (!rawText) return [];

    const skillsMatch = rawText.match(/SKILLS\s*([\s\S]*?)(\n[A-Z ]{3,}:?|\n[A-Z ]{3,}\n|$)/i);
    if (!skillsMatch) return [];

    const skillsLine = skillsMatch[1]
        ?.replace(/\n/g, ' ')
        ?.replace(/[\.:]/g, '')
        ?.trim();

    if (!skillsLine) return [];

    return skillsLine
        .split(/,|\|/g)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 1);
}

export const formatWorkExperience = (experience: any[]) => {
    return (
        experience
            ?.map((work: any) => {
                const title = work.workExperienceJobTitle?.trim();
                const company = work.workExperienceOrganization?.trim();
                const location = work.workExperienceLocation?.formatted?.trim();
                const startYear = work.workExperienceDates?.start?.date ? new Date(work.workExperienceDates.start.date).getFullYear() : null;
                const endYear = work.workExperienceDates?.end?.date ? new Date(work.workExperienceDates.end.date).getFullYear() : (work.workExperienceDates?.end?.isCurrent ? 'Present' : null);
                const description = work.workExperienceDescription?.trim();
                const employmentType = work.workExperienceType?.label?.trim();

                const dateRange = startYear || endYear ? `(${startYear || ''}${startYear && endYear ? '–' : ''}${endYear || ''})` : '';

                const titleLineParts = [title, company].filter(Boolean).join(' - ');
                const titleLine = [titleLineParts, dateRange].filter(Boolean).join(' ').trim();

                const detailsLine = [location, employmentType].filter(Boolean).join(', ');

                if (!titleLine && !description && !detailsLine) return null;

                return [titleLine, detailsLine, description].filter(Boolean).join('\n');
            })
            .filter(Boolean) || []
    );
};


export const transformResumeResponse = (data: any) => {
    const candidate = data;


    return {
        summary: candidate.summary || null,
        skills: extractSkills(candidate.rawText),
        workExperience: formatWorkExperience(candidate.workExperience),

        //     education: candidate.education?.map((edu: any) => ({
        //         degree: edu.educationAccreditation,
        //         institution: edu.educationOrganization,
        //         startDate: edu.educationDates?.start?.date || null,
        //         endDate: edu.educationDates?.end?.date || null,
        //         grade: edu.educationGrade?.educationGradeScore || null
        //     } 

        // )),
        education: candidate.education
            ?.map((edu: any) => {
                const degree = edu.educationAccreditation?.trim();
                const institution = edu.educationOrganization?.trim();
                const endYear = edu.educationDates?.end?.date
                    ? new Date(edu.educationDates.end.date).getFullYear()
                    : null;
                const grade = edu.educationGrade?.educationGradeScore?.toString().trim();

                const mainLine = [degree, institution].filter(Boolean).join(' - ');
                const details: string[] = [];

                if (endYear) details.push(endYear.toString());
                if (grade) details.push(`Grade: ${grade}`);

                const detailsLine = details.length ? `(${details.join(', ')})` : '';

                const finalLine = [mainLine, detailsLine].filter(Boolean).join(' ').trim();
                return finalLine || null;
            })
            .filter(Boolean) || [],




        projects: candidate.project
            ?.map((p: any) => {
                const title = p.projectTitle?.trim();
                const startYear = p.projectDates?.start?.date ? new Date(p.projectDates.start.date).getFullYear() : null;
                const endYear = p.projectDates?.end?.date ? new Date(p.projectDates.end.date).getFullYear() : null;
                const description = p.projectDescription?.trim();

                const dateRange = startYear || endYear ? `(${startYear || ''}${startYear && endYear ? '–' : ''}${endYear || ''})` : '';
                const titleLine = title ? `${title} ${dateRange}`.trim() : '';

                if (!titleLine && !description) return null;

                return [titleLine, description].filter(Boolean).join('\n');
            })
            .filter(Boolean) || [],

    }
}