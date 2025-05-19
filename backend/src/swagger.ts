import swaggerJsdoc from 'swagger-jsdoc';
// Use hardcoded version instead of importing from package.json
const version = '1.0.0';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JobFit AI Matchmaker API',
      version,
      description: 'API for resume analysis and job matching using AI',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'JobFit AI Support',
        url: 'https://github.com/yourusername/jobfit-ai-matchmaker',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        // Resume Matching Request
        ResumeMatchingRequest: {
          type: 'object',
          required: ['jobDescription'],
          properties: {
            jobDescription: {
              type: 'string',
              description: 'The job description to analyze or match against resumes',
              minLength: 50,
            },
            matchingOptions: {
              type: 'object',
              properties: {
                useHybridSearch: {
                  type: 'boolean',
                  description: 'Whether to use hybrid (vector + keyword) search',
                  default: true,
                },
                topResults: {
                  type: 'integer',
                  description: 'Number of top results to return',
                  default: 5,
                  minimum: 1,
                  maximum: 20,
                },
                industryType: {
                  type: 'string',
                  description: 'Industry type for specialized matching',
                  enum: ['healthcare', 'technology', 'finance', 'education', 'general'],
                  default: 'general',
                },
                customWeights: {
                  type: 'object',
                  description: 'Custom weights for different matching criteria',
                  properties: {
                    experience: {
                      type: 'number',
                      description: 'Weight for experience matching',
                      minimum: 0,
                      maximum: 1,
                    },
                    technicalSkills: {
                      type: 'number',
                      description: 'Weight for technical skills matching',
                      minimum: 0,
                      maximum: 1,
                    },
                    certifications: {
                      type: 'number',
                      description: 'Weight for certifications matching',
                      minimum: 0,
                      maximum: 1,
                    },
                    education: {
                      type: 'number',
                      description: 'Weight for education matching',
                      minimum: 0,
                      maximum: 1,
                    },
                  },
                },
              },
            },
          },
        },
        // Job Analysis Request
        JobAnalysisRequest: {
          type: 'object',
          required: ['jobDescription'],
          properties: {
            jobDescription: {
              type: 'string',
              description: 'The job description to analyze',
              minLength: 50,
            }
          }
        },
        // Job Analysis Response
        JobAnalysisResponse: {
          type: 'object',
          properties: {
            jobTitle: {
              type: 'string',
              description: 'The title of the job',
            },
            requiredSkills: {
              type: 'array',
              description: 'List of required skills for the job',
              items: {
                type: 'string',
              },
            },
            experienceLevel: {
              type: 'object',
              description: 'Experience level requirements',
              properties: {
                minYears: {
                  type: 'number',
                  description: 'Minimum years of experience required',
                },
                preferredYears: {
                  type: 'number',
                  description: 'Preferred years of experience',
                },
              },
            },
            education: {
              type: 'object',
              description: 'Education requirements',
              properties: {
                minimumLevel: {
                  type: 'string',
                  description: 'Minimum education level required',
                },
                preferredFields: {
                  type: 'array',
                  description: 'Preferred fields of study',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
            certifications: {
              type: 'object',
              properties: {
                required: {
                  type: 'array',
                  description: 'Required certifications',
                  items: {
                    type: 'string',
                  },
                },
                preferred: {
                  type: 'array',
                  description: 'Preferred certifications',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
            industryKnowledge: {
              type: 'array',
              description: 'Industry-specific knowledge requirements',
              items: {
                type: 'string',
              },
            },
            softSkills: {
              type: 'array',
              description: 'Required soft skills',
              items: {
                type: 'string',
              },
            },
            keyResponsibilities: {
              type: 'array',
              description: 'Key job responsibilities',
              items: {
                type: 'string',
              },
            },
            preferredQualifications: {
              type: 'array',
              description: 'Preferred qualifications',
              items: {
                type: 'string',
              },
            },
          },
        },
        // Resume Match Response
        ResumeMatchResponse: {
          type: 'object',
          properties: {
            bestMatch: {
              type: 'object',
              description: 'Details about the best matching candidate',
              properties: {
                candidateId: {
                  type: 'string',
                  description: 'ID of the best matching candidate'
                },
                candidateName: {
                  type: 'string',
                  description: 'Name of the best matching candidate'
                },
                overallScore: {
                  type: 'number',
                  description: 'Overall match score of the best candidate'
                },
                recommendation: {
                  type: 'string',
                  description: 'LLM-generated recommendation explaining why this candidate is the best match'
                }
              }
            },
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resumeId: {
                    type: 'string',
                    description: 'ID of the matched resume',
                  },
                  candidateName: {
                    type: 'string',
                    description: 'Name of the candidate',
                  },
                  searchScore: {
                    type: 'number',
                    description: 'Search relevance score',
                  },
                  matchAnalysis: {
                    type: 'object',
                    properties: {
                      overallMatch: { 
                        type: 'number',
                        description: 'Overall match score for ranking' 
                      },
                      summary: { 
                        type: 'string',
                        description: 'Summary of the match analysis' 
                      },
                      recommendedNextSteps: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Recommended next steps for this candidate' 
                      },
                      technicalSkillsMatch: {
                        type: 'object',
                        properties: {
                          score: { type: 'number' },
                          strengths: { type: 'array', items: { type: 'string' } },
                          gaps: { type: 'array', items: { type: 'string' } },
                          explanation: { type: 'string' },
                        },
                      },
                      experienceMatch: {
                        type: 'object',
                        properties: {
                          score: { type: 'number' },
                          strengths: { type: 'array', items: { type: 'string' } },
                          gaps: { type: 'array', items: { type: 'string' } },
                          explanation: { type: 'string' },
                        },
                      },
                      educationMatch: {
                        type: 'object',
                        properties: {
                          score: { type: 'number' },
                          strengths: { type: 'array', items: { type: 'string' } },
                          gaps: { type: 'array', items: { type: 'string' } },
                          explanation: { type: 'string' },
                        },
                      },
                      certificationsMatch: {
                        type: 'object',
                        properties: {
                          score: { type: 'number' },
                          strengths: { type: 'array', items: { type: 'string' } },
                          gaps: { type: 'array', items: { type: 'string' } },
                          explanation: { type: 'string' },
                        },
                      },
                      industryKnowledgeMatch: {
                        type: 'object',
                        properties: {
                          score: { type: 'number' },
                          strengths: { type: 'array', items: { type: 'string' } },
                          gaps: { type: 'array', items: { type: 'string' } },
                          explanation: { type: 'string' },
                        },
                      },
                      softSkillsMatch: {
                        type: 'object',
                        properties: {
                          score: { type: 'number' },
                          strengths: { type: 'array', items: { type: 'string' } },
                          gaps: { type: 'array', items: { type: 'string' } },
                          explanation: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            metadata: {
              type: 'object',
              description: 'Metadata about the matching process',
              properties: {
                totalCandidatesScanned: {
                  type: 'number',
                  description: 'Total number of candidates in the database'
                },
                processingTimeMs: {
                  type: 'number',
                  description: 'Processing time in milliseconds'
                },
                searchStrategy: {
                  type: 'string',
                  description: 'Search strategy used (hybrid or vector)'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Validation error details',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options);
