# Job Hunt Midsemester Presentation Notes

## Slide 1 - Project title slide
- Project Name: Job Hunt
- Team Name: Free Labour
- Presented by:
  - Alwyn Sterling
  - Dominic Scott
  - Leah-Jay Holness
  - Ron-Hugh Walters
  - Tianna Bassaragh

## Slide 2 - Objectives Clearly Defined
### Background or context
We observe that modern recruitment is often inefficient and opaque. Employers must manually sift through many applications of varying relevance, while applicants often receive limited feedback about why they were not selected. This creates wasted effort on both sides and can cause qualified candidates to be missed. We are addressing this problem by formalising the comparison between job requirements and candidate competencies into a structured computational process.

We are not trying to model full hiring outcomes or replace recruiters. We are specifically scoping our project as an initial matching and recommendation stage, focused on whether the competencies expressed in a resume satisfy the requirements expressed in a job description. To keep the problem manageable and evaluation realistic, we are limiting our scope to computing related roles.

## Slide 3 - Solution
We aim to build a Job Matching and Qualification System for computing related roles. Our system will accept resumes from candidates and job descriptions from employers, extract relevant competencies from both, map them into a shared O*NET based competency space, and determine whether a candidate is qualified for a given role. Candidates who satisfy required criteria will then be ranked by suitability, while jobs may also be ranked for candidates by compatibility.

Our central objective is to reduce two major failure types: recommending candidates who are actually unqualified, and missing candidates who genuinely satisfy the requirements. In other words, we are trying to approximate the first pass judgement a skilled human recruiter makes in a more consistent and structured way.

## Slide 4 - Project scope
### What we will definitely do
- accept resumes and job descriptions as input
- extract competencies from unstructured text
- map extracted competencies to O*NET descriptors
- generate structured competency profiles for jobs and candidates
- determine whether required competencies are satisfied
- rank qualified candidates for employers and relevant jobs for candidates

### What we will definitely not do
We will not build a complete hiring platform. We will not cover later recruitment stages such as interviews, offer management, onboarding, or final hiring decisions. We will also not claim to predict actual job performance or guarantee real world hiring accuracy, since our system only operates on information available in resumes and job descriptions.

### What we might do
If time permits, we may include features that correspond to the non core requirements of the system. These include allowing employers to explicitly mark competencies as required or preferred, allowing users to adjust ranking weights within defined bounds, generating explanations for qualification decisions, producing competency gap reports for candidates who are not qualified, and allowing users to filter results by criteria to be decided later. These features are valuable, but they are secondary to ensuring that the system can first extract competencies reliably, determine qualification correctly, and produce useful rankings.

## Slide 5 - Technical issues and why the project is non-trivial
Our project is non trivial because the hardest part is not building a website, but converting messy, unstructured text into a reliable competency representation that can support qualification decisions. Resumes and job descriptions are often vague, inconsistent, and full of synonyms, implied skills, and uneven detail. Extracting competencies accurately and then mapping them into a fixed O*NET framework is technically demanding.

A second challenge is defining "qualified" in a defensible way. We are treating qualification as multi dimensional, based on factors such as skill coverage, relevance of experience and education, rather than a single raw score. This means we must combine multiple signals without making the system arbitrary or opaque.

A third challenge is that our approach assumes useful structure in a high dimensional competency space. We also have to consider the fact that linear relationships may not always hold, and that the system must scale beyond a tiny test dataset. This means the project involves real modelling, representation, and computational tradeoffs, not just basic CRUD functionality.

Finally, evaluation itself is difficult. Ground truth for "who is truly qualified" is rarely readily available, so we must define a credible testing strategy using O*NET occupational data, public datasets, and approximate labelled evaluation pairs. Our methodology therefore evaluates the system in two stages: first the binary qualification decision using precision, recall, and F1, and then ranking quality using metrics such as Precision@K, nDCG@K, and MRR if time permits.

## Slide 6 - Knowledge from the curriculum required
To solve this problem, we must draw on knowledge from several courses in the computing curriculum. COMP2171 and COMP2140 will support our documentation, requirements analysis, and system modelling, including the production of diagrams and structured design artefacts needed to communicate the system clearly. COMP3161 will support the database aspects of the project, including how we store resumes, job postings, extracted competencies, and generated results in a structured way.

We will also rely on COMP3162 Data Science for data cleaning, preprocessing, and potentially some of the modelling and evaluation work needed to handle messy resume and job description data. Since our implementation will make use of Python, COMP1127 provides foundational programming knowledge that will support the backend logic, text processing, and experimentation. INFO2180 will be relevant to the design and implementation of the front end through which employers and candidates interact with the system.

In addition, COMP3220 is relevant because the project involves intelligent decision making in the form of competency extraction, matching, and qualification assessment. COMP2211 will also be useful, particularly for thinking about optimization in ranking and decision processes, where we need to balance multiple factors in a structured way.

Taken together, these courses show that the project is not just a simple web application. It requires us to integrate knowledge from software engineering, databases, web development, artificial intelligence, data science, programming, and optimization, which is part of why we see it as a genuine capstone level problem.

## Slide 7 - Progress on target
### Work division
- Alwyn Sterling: Backend development and database implementation
- Dominic Scott: Backend development and database implementation
- Ron-Hugh Walters: Documentation, system modelling, data cleaning, and data parsing
- Leah-Jay Holness: User interface design
- Tianna Bassaragh: User interface design

## Slide 8 - What remains to be done
- Frontend: candidate and employer interfaces, page flow, and user interaction.
- Backend + Database: API endpoints, document processing flow, and storage for jobs, resumes, profiles, and matches.
- Implement the matching pipeline: resume parsing, job parsing, mapping, qualification, and ranking logic.
- Validate the system: prepare datasets, clean data, integrate evaluation, and test the pipeline.

## Slide 9 - Sitemap showing User Interface flow
Use the colored Real Site Map from the project folder.

## Slide 10 - Use Case Diagram
Use Case Diagram 7 from the project folder.
