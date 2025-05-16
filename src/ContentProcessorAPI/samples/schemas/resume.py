from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    """
    Contact information for the candidate.
    """
    email: Optional[str] = Field(description="Email address")
    phone: Optional[str] = Field(description="Phone number")
    address: Optional[str] = Field(description="Mailing address")
    linkedin: Optional[str] = Field(description="LinkedIn profile URL")
    website: Optional[str] = Field(description="Personal website or portfolio URL")

class EducationEntry(BaseModel):
    """
    An entry for education history.
    """
    institution: Optional[str] = Field(description="Name of the institution")
    degree: Optional[str] = Field(description="Degree or certification obtained")
    field_of_study: Optional[str] = Field(description="Field of study or major")
    start_date: Optional[str] = Field(description="Start date (e.g. 2018-09)")
    end_date: Optional[str] = Field(description="End date or expected graduation (e.g. 2022-06)")
    honors: Optional[str] = Field(description="Honors or distinctions received")

class WorkExperienceEntry(BaseModel):
    """
    An entry for work experience.
    """
    job_title: Optional[str] = Field(description="Job title or position")
    employer: Optional[str] = Field(description="Employer or organization name")
    start_date: Optional[str] = Field(description="Start date (e.g. 2020-01)")
    end_date: Optional[str] = Field(description="End date or 'Present'")
    location: Optional[str] = Field(description="Location of the job")
    description: Optional[str] = Field(description="Description of responsibilities and achievements")
    industry: Optional[str] = Field(description="Industry of the employer (e.g. Healthcare, IT, Finance)")

class CertificationEntry(BaseModel):
    """
    An entry for certifications or licenses.
    """
    name: Optional[str] = Field(description="Certification or license name")
    issuer: Optional[str] = Field(description="Issuing organization")
    issue_date: Optional[str] = Field(description="Date issued (e.g. 2021-05)")
    expiration_date: Optional[str] = Field(description="Expiration date, if applicable")
    credential_id: Optional[str] = Field(description="Credential ID or number")

class SkillEntry(BaseModel):
    """
    A skill or competency.
    """
    name: Optional[str] = Field(description="Skill name (e.g. Python, Patient Care)")
    level: Optional[str] = Field(description="Proficiency level (e.g. Beginner, Intermediate, Advanced)")
    category: Optional[str] = Field(description="Skill category (e.g. Technical, Clinical, Soft Skill)")

class LanguageEntry(BaseModel):
    """
    A language spoken by the candidate.
    """
    language: Optional[str] = Field(description="Language name (e.g. English, Spanish)")
    proficiency: Optional[str] = Field(description="Proficiency level (e.g. Native, Fluent, Intermediate)")

class HealthcareExtension(BaseModel):
    """
    Healthcare-specific resume fields.
    """
    npi_number: Optional[str] = Field(description="National Provider Identifier (NPI) number")
    license_state: Optional[str] = Field(description="State of professional license")
    license_number: Optional[str] = Field(description="Professional license number")
    specialties: Optional[List[str]] = Field(description="List of medical specialties")
    board_certifications: Optional[List[str]] = Field(description="List of board certifications")
    emr_systems: Optional[List[str]] = Field(description="Familiar EMR/EHR systems (e.g. Epic, Cerner)")
    clinical_experience_years: Optional[float] = Field(description="Years of clinical experience")
    patient_populations: Optional[List[str]] = Field(description="Patient populations served (e.g. Pediatrics, Geriatrics)")

class Resume(BaseModel):
    """
    A comprehensive, extensible resume schema. General fields are always present. Industry-specific extensions (e.g. healthcare) are optional and can be expanded for other industries.
    """
    full_name: Optional[str] = Field(description="Full name of the candidate")
    contact_info: Optional[ContactInfo] = Field(description="Contact information")
    summary: Optional[str] = Field(description="Professional summary or objective statement")
    education: Optional[List[EducationEntry]] = Field(description="List of education entries")
    work_experience: Optional[List[WorkExperienceEntry]] = Field(description="List of work experience entries")
    certifications: Optional[List[CertificationEntry]] = Field(description="List of certifications or licenses")
    skills: Optional[List[SkillEntry]] = Field(description="List of skills and competencies")
    languages: Optional[List[LanguageEntry]] = Field(description="Languages spoken")
    awards: Optional[List[str]] = Field(description="Awards and recognitions")
    publications: Optional[List[str]] = Field(description="Publications (e.g. articles, research papers)")
    volunteer_experience: Optional[List[str]] = Field(description="Volunteer experience")
    healthcare: Optional[HealthcareExtension] = Field(description="Healthcare-specific fields (if applicable)")
    industry_extensions: Optional[Dict[str, Any]] = Field(description="Additional industry-specific extensions (e.g. { 'finance': {...}, 'engineering': {...} })")

    @staticmethod
    def example():
        """
        Returns an example Resume object with sample data.
        """
        return Resume(
            full_name="Jane Doe, MD",
            contact_info=ContactInfo(
                email="jane.doe@email.com",
                phone="555-123-4567",
                address="123 Main St, Springfield, IL",
                linkedin="https://linkedin.com/in/janedoe",
                website="https://janedoemd.com"
            ),
            summary="Board-certified family physician with 10+ years of experience in primary care, passionate about patient-centered medicine and healthcare innovation.",
            education=[
                EducationEntry(
                    institution="Springfield Medical School",
                    degree="MD",
                    field_of_study="Medicine",
                    start_date="2008-08",
                    end_date="2012-05",
                    honors="Magna Cum Laude"
                )
            ],
            work_experience=[
                WorkExperienceEntry(
                    job_title="Family Physician",
                    employer="Springfield Clinic",
                    start_date="2012-07",
                    end_date="Present",
                    location="Springfield, IL",
                    description="Provide comprehensive primary care to diverse patient populations, supervise residents, and lead quality improvement initiatives.",
                    industry="Healthcare"
                )
            ],
            certifications=[
                CertificationEntry(
                    name="Board Certified in Family Medicine",
                    issuer="ABFM",
                    issue_date="2012-06",
                    expiration_date="2027-06",
                    credential_id="1234567"
                )
            ],
            skills=[
                SkillEntry(name="Patient Care", level="Advanced", category="Clinical"),
                SkillEntry(name="Epic EMR", level="Intermediate", category="Technical")
            ],
            languages=[
                LanguageEntry(language="English", proficiency="Native"),
                LanguageEntry(language="Spanish", proficiency="Fluent")
            ],
            awards=["Physician of the Year 2020"],
            publications=["Doe J. Innovations in Primary Care. J Med Pract. 2021;12(3):45-50."],
            volunteer_experience=["Medical Mission, Honduras, 2019"],
            healthcare=HealthcareExtension(
                npi_number="1234567890",
                license_state="IL",
                license_number="MD12345",
                specialties=["Family Medicine"],
                board_certifications=["Family Medicine"],
                emr_systems=["Epic", "Cerner"],
                clinical_experience_years=10.5,
                patient_populations=["Pediatrics", "Geriatrics"]
            ),
            industry_extensions={
                # Example for future extensibility
                "finance": {"finra_license": "Series 7", "years_in_industry": 5},
                "engineering": {"pe_license": "PE123456", "disciplines": ["Civil", "Structural"]}
            }
        )
