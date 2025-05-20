import React, { useState, useRef, useEffect } from "react";
import {
  CssBaseline, Container, Box, Typography,
  TextField, Button, Paper, CircularProgress, Divider,
  FormControl, FormControlLabel, Switch, Select, MenuItem,
  InputLabel, Slider, Chip, Card, CardContent, Rating,
  Backdrop, IconButton, Tooltip
} from "@mui/material";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import { matchResumes } from "./api/resumeMatchmakerApi";
import type { ResumeMatchingResponse, ResumeMatch } from "@jobfit-ai/shared/src/resumeMatchmakerTypes";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResumeMatchingResponse | null>(null);
  const [useHybridSearch, setUseHybridSearch] = useState(true);
  const [topResults, setTopResults] = useState(3); // Set default to 3
  const [industryType, setIndustryType] = useState<"general" | "technology" | "healthcare" | "finance" | "education">("general");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [weights, setWeights] = useState({
    experience: 0.3,
    technicalSkills: 0.3,
    certifications: 0.2,
    education: 0.2,
  });
  const [loadingTime, setLoadingTime] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<ResumeMatch | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect for loading
  useEffect(() => {
    if (isLoading) {
      setLoadingTime(0);
      timerRef.current = setInterval(() => {
        setLoadingTime((t) => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  // Handle ESC key to close the sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedCandidate) {
        setSelectedCandidate(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCandidate]);

  const handleSubmit = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const matchingOptions = {
        useHybridSearch,
        topResults,
        industryType,
        customWeights: showAdvancedOptions ? weights : undefined,
      };
      const response = await matchResumes({ jobDescription, matchingOptions });
      setResults(response);

      // Reset selected candidate when getting new search results
      setSelectedCandidate(null);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Failed to match resumes'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (field: keyof typeof weights) => (_: Event, value: number | number[]) => {
    setWeights(prev => ({ ...prev, [field]: value as number }));
  };

  return (
    <ThemeProvider>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          background: theme => theme.palette.mode === 'dark' 
            ? "linear-gradient(120deg, #181A20 0%, #23262F 100%)"
            : "linear-gradient(120deg, #F8FAFD 0%, #FFFFFF 100%)",
          fontFamily: 'inherit',
        }}
      >
        {/* Theme toggle button in the top right */}
        <Box sx={{ position: 'fixed', top: 16, right: 24, zIndex: 2000 }}>
          <ThemeToggle />
        </Box>
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            height: "calc(100vh - 10px)",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            m: 0,
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", flexGrow: 1, gap: 2, overflow: "hidden" }}>
            {/* Left panel - Job description input */}
            <Paper
              elevation={3}
              sx={{
                flex: '0 0 40%',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(35, 38, 47, 0.7)' : 'background.paper',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ color: "primary.main", textAlign: "center", mr: 1 }}>
                  Jobfit AI Matchmaker
                </Typography>
                <IconButton
                  aria-label="About Jobfit AI Matchmaker"
                  size="small"
                  onClick={() => setInfoOpen(true)}
                  sx={{ color: 'primary.main', ml: 0.5 }}
                >
                  <InfoOutlinedIcon fontSize="medium" />
                </IconButton>
              </Box>
              <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 700 }}>About Jobfit AI Matchmaker</DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <b>Jobfit AI Matchmaker</b> helps you quickly find the best-fit candidates for your job description using advanced AI-powered resume analysis. Paste a job description, adjust search options, and instantly see ranked matches, strengths, gaps, and actionable next steps for each candidate.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This tool leverages semantic search and custom scoring to streamline your hiring process and surface the most relevant talent for your needs.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setInfoOpen(false)} variant="contained" color="primary" autoFocus>
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
              <Typography variant="h6" gutterBottom color="primary.light">
                Job Description
              </Typography>
              <TextField
                multiline
                fullWidth
                rows={showAdvancedOptions ? 10 : 23}
                variant="outlined"
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                sx={{
                  mb: 2,
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(24, 26, 32, 0.5)' : 'rgba(240, 242, 245, 0.6)',
                  borderRadius: 1,
                  flex: showAdvancedOptions ? 'none' : 1,
                  '& .MuiOutlinedInput-root': {
                    height: showAdvancedOptions ? 'auto' : '100%',
                    '& textarea': {
                      height: showAdvancedOptions ? 'auto' : '100% !important'
                    },
                    '& fieldset': {
                      borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
              {/* Scrollable container for everything below job description */}
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                {/* Scrollable content */}
                <Box sx={{
                  overflowY: 'auto',
                  flex: 1,
                  mb: 2
                }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Search Options
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Tooltip 
                      title={useHybridSearch ? 
                        "Hybrid Search: Combines semantic and keyword matching for better results" : 
                        "Vector Search: Uses semantic embedding similarity only"}
                      placement="top"
                      arrow
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={useHybridSearch}
                            onChange={(e) => setUseHybridSearch(e.target.checked)}
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        }
                        label="Hybrid Search"
                      />
                    </Tooltip>
                    <FormControl size="small" sx={{ width: '180px' }}>
                      <InputLabel>Industry</InputLabel>
                      <Select
                        value={industryType}
                        label="Industry"
                        onChange={(e) => setIndustryType(e.target.value as typeof industryType)}
                      >
                        <MenuItem value="general">General</MenuItem>
                        <MenuItem value="technology">Technology</MenuItem>
                        <MenuItem value="healthcare">Healthcare</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                        <MenuItem value="education">Education</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {/* Add Top Results slider */}
                  <Box sx={{ mb: 1, mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">Top Results: {topResults}</Typography>
                    </Box>
                    <Slider
                      value={topResults}
                      min={1}
                      max={20}
                      step={1}
                      onChange={(_, value) => setTopResults(value as number)}
                      sx={{ mt: 0.5, mb: 1.5 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAdvancedOptions}
                          onChange={(e) => setShowAdvancedOptions(e.target.checked)}
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      }
                      label="Advanced Options"
                    />
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {showAdvancedOptions && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Matching Weights
                        </Typography>
                        <Box sx={{ px: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Experience</Typography>
                            <Typography variant="caption" color="primary.light">{weights.experience.toFixed(1)}</Typography>
                          </Box>
                          <Slider
                            value={weights.experience}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={handleWeightChange('experience')}
                            sx={{ mt: 0.5, mb: 1.5 }}
                            valueLabelDisplay="auto"
                          />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Technical Skills</Typography>
                            <Typography variant="caption" color="primary.light">{weights.technicalSkills.toFixed(1)}</Typography>
                          </Box>
                          <Slider
                            value={weights.technicalSkills}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={handleWeightChange('technicalSkills')}
                            sx={{ mt: 0.5, mb: 1.5 }}
                            valueLabelDisplay="auto"
                          />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Certifications</Typography>
                            <Typography variant="caption" color="primary.light">{weights.certifications.toFixed(1)}</Typography>
                          </Box>
                          <Slider
                            value={weights.certifications}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={handleWeightChange('certifications')}
                            sx={{ mt: 0.5, mb: 1.5 }}
                            valueLabelDisplay="auto"
                          />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Education</Typography>
                            <Typography variant="caption" color="primary.light">{weights.education.toFixed(1)}</Typography>
                          </Box>
                          <Slider
                            value={weights.education}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={handleWeightChange('education')}
                            sx={{ mt: 0.5, mb: 1 }}
                            valueLabelDisplay="auto"
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
              </Box>
            </Box>

              {/* Button at the bottom of scrollable area */}
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center', py: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSubmit}
                  disabled={isLoading || !jobDescription.trim()}
                  sx={{ px: 4, py: 1, borderRadius: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : "Find Matching Candidates"}
                </Button>
              </Box>
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
            </Paper>
            {/* Right panel - Search results */}
            <Paper
              elevation={3}
              sx={{
                flex: '0 0 60%',
                p: 2,
                mr: 3,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(35, 38, 47, 0.7)' : 'background.paper',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Loading overlay */}
              {isLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(24, 26, 32, 0.7)' : 'rgba(237, 242, 247, 0.92)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={48} color="primary" thickness={5} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 2, 
                      fontWeight: 600, 
                      fontSize: '1.2rem', 
                      letterSpacing: 0.5,
                      color: theme => theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.dark'
                    }}
                  >
                    Finding matching candidates... {
                      loadingTime >= 60
                        ? `${Math.floor(loadingTime / 60)}m ${loadingTime % 60}s`
                        : `${loadingTime}s`
                    } elapsed
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: isLoading ? 'none' : 'block', height: '100%' }}>
                <Typography variant="h6" gutterBottom color="primary.light">
                  Matching Candidates
                </Typography>
                {results ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    {/* Best match section */}
                    {results.bestMatch && (
                      <>
                        <Paper
                          elevation={2}
                          onClick={() => {
                            const bestMatchFull = results.matches.find(
                              match => match.resumeId === results.bestMatch?.candidateId
                            );
                            if (bestMatchFull) {
                              setSelectedCandidate(bestMatchFull);
                            }
                          }}
                          sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: 'rgba(76, 175, 80, 0.08)',
                            borderRadius: 2,
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            maxHeight: 220,
                            overflowY: 'auto',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 3,
                              backgroundColor: 'rgba(76, 175, 80, 0.15)',
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" color="primary.light" fontWeight="bold">
                                Best Match: {results.bestMatch.candidateId}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                (Click to view details)
                              </Typography>
                            </Box>
                            <Chip
                              label={`Score: ${results.bestMatch.overallScore}%`}
                              size="small"
                              sx={{
                                backgroundColor: '#4CAF50', // Green background
                                color: 'white',
                                fontWeight: 600,
                                px: 1
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', whiteSpace: 'pre-line' }}>
                            {results.bestMatch.recommendation}
                          </Typography>
                        </Paper>
                        <Divider sx={{ mb: 2 }} />
                      </>
                    )}
                    {/* Match list */}
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {results.matches.length} Candidates Found
                      {results.metadata?.processingTimeMs && (() => {
                        const seconds = (results.metadata.processingTimeMs / 1000);
                        return seconds >= 60
                          ? ` in ${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
                          : ` in ${seconds.toFixed(2)}s`;
                      })()}
                    </Typography>
                    <Box sx={{ overflowY: 'auto', pr: 1, flex: 1, mb: 4 }}>
                      {results.matches.map((match) => (
                        <CandidateCard
                          key={match.resumeId}
                          match={match}
                          isBestMatch={results.bestMatch && match.resumeId === results.bestMatch.candidateId}
                          onClick={() => setSelectedCandidate(match)}
                        />
                      ))}
                    </Box>
                    {/* Candidate details sidebar */}
                    {selectedCandidate && (
                      <>
                        {/* Backdrop overlay to handle click outside */}
                        <Backdrop
                          open={Boolean(selectedCandidate)}
                          onClick={() => setSelectedCandidate(null)}
                          sx={{ 
                            zIndex: 1200, 
                            bgcolor: theme => theme.palette.mode === 'dark'
                              ? 'rgba(0,0,0,0.7)'
                              : 'rgba(0,0,0,0.5)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '40%', // Match the left panel width
                            height: '100vh',
                            bgcolor: 'background.paper',
                            boxShadow: 6,
                            zIndex: 1300,
                            p: 3,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" color="primary.main">Candidate Details</Typography>
                            <Button onClick={() => setSelectedCandidate(null)} color="secondary" size="small">Close</Button>
                          </Box>
                          <Typography variant="subtitle1" color="text.primary" gutterBottom>
                            Resume ID: {selectedCandidate.resumeId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedCandidate.matchAnalysis.summary}
                          </Typography>
                          <Divider sx={{ my: 2 }} />
                          <Typography
                            variant="h6"
                            color="text.primary"
                            sx={{
                              mb: 1,
                              fontWeight: 600
                            }}
                          >
                            Strengths
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {selectedCandidate.matchAnalysis.technicalSkillsMatch.strengths.map((s: string, i: number) => (
                              <Chip
                                key={i}
                                label={s}
                                sx={{
                                  fontSize: '0.9rem',
                                  px: 1,
                                  py: 1,
                                  fontWeight: 500,
                                  color: theme => theme.palette.mode === 'dark' ? 'white' : '#2E7D32',
                                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)',
                                  '&:hover': {
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(76, 175, 80, 0.15)',
                                  },
                                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.3)'}`,
                                }}
                              />
                            ))}
                          </Box>
                          <Typography
                            variant="h6"
                            color="text.primary"
                            sx={{
                              mb: 1,
                              fontWeight: 600
                            }}
                          >
                            Gaps
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                            {selectedCandidate.matchAnalysis.technicalSkillsMatch.gaps.map((g: string, i: number) => (
                              <Chip
                                key={i}
                                label={g}
                                sx={{
                                  fontSize: '0.9rem',
                                  px: 1,
                                  py: 1,
                                  fontWeight: 500,
                                  color: theme => theme.palette.mode === 'dark' ? 'white' : '#C62828',
                                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
                                  '&:hover': {
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.25)' : 'rgba(211, 47, 47, 0.15)',
                                  },
                                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.5)' : 'rgba(211, 47, 47, 0.3)'}`,
                                }}
                              />
                            ))}
                          </Box>
                          <Typography
                            variant="h6"
                            color="text.primary"
                            sx={{
                              mb: 1,
                              fontWeight: 600
                            }}
                          >
                            Recommended Next Steps
                          </Typography>
                          <Box
                            component="ul"
                            sx={{
                              m: 0,
                              pl: 2
                            }}
                          >
                            {selectedCandidate.matchAnalysis.recommendedNextSteps.map((step: string, idx: number) => (
                              <Box
                                component="li"
                                key={idx}
                                sx={{
                                  color: theme => theme.palette.mode === 'dark' ? '#e0e0e0' : '#4B5563',
                                  fontSize: '1rem',
                                  mb: 1,
                                  lineHeight: 1.4,
                                  '&:last-child': {
                                    mb: 0
                                  }
                                }}
                              >
                                {step}
                              </Box>
                            ))}
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          {/* Show all match dimensions */}
                          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>Match Dimensions</Typography>
                          {Object.entries(selectedCandidate.matchAnalysis).map(([key, value]) => {
                            // Only show dimensions with score (type guard)
                            if (typeof value === 'object' && value !== null && 'score' in value) {
                              const dim = value as {
                                score: number;
                                strengths: string[];
                                gaps: string[];
                                explanation: string;
                              };
                              return (
                                <Box key={key} sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="text.primary">
                                    {key.replace('Match', '')
                                      .replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, str => str.toUpperCase())}
                                    : (Score: {dim.score})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">{dim.explanation}</Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {dim.strengths && dim.strengths.map((s, i) => (
                                      <Chip
                                        key={i}
                                        label={s}
                                        size="small"
                                        sx={{
                                          color: theme => theme.palette.mode === 'dark' ? 'white' : '#2E7D32',
                                          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)',
                                          border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.3)'}`,
                                        }}
                                      />
                                    ))}
                                    {dim.gaps && dim.gaps.map((g, i) => (
                                      <Chip
                                        key={i}
                                        label={g}
                                        size="small"
                                        sx={{
                                          color: theme => theme.palette.mode === 'dark' ? 'white' : '#C62828',
                                          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
                                          border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.5)' : 'rgba(211, 47, 47, 0.3)'}`,
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              );
                            }
                            return null;
                          })}
                        </Box>
                      </>
                    )}
                  </Box>
                ) : (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexGrow: 1,
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    padding: '56px 16px 16px' // Add top padding to account for the header
                  }}>
                    <Typography color="text.secondary" variant="body1" align="center">
                      Enter a job description and click "Find Matching Candidates" to see results
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

const CandidateCard: React.FC<{ match: ResumeMatch; isBestMatch?: boolean; onClick?: () => void }> = ({ match, isBestMatch, onClick }) => {
  // Calculate star rating out of 5 based on overallMatch (0-100)
  const starValue = match.matchAnalysis.overallMatch / 20;
  return (
    <Box sx={{
      mt: 2,
      mb: 2,
      position: 'relative',
      '&:hover': {
        '& > .MuiCard-root': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }
    }}>
      <Card
        onClick={onClick}
        sx={{
          backgroundColor: theme => {
            if (isBestMatch) {
              return theme.palette.mode === 'dark' 
                ? 'rgba(76, 175, 80, 0.12)' 
                : 'rgba(76, 175, 80, 0.08)';
            } else {
              return theme.palette.mode === 'dark' 
                ? 'rgba(24, 26, 32, 0.7)' 
                : '#FFFFFF';
            }
          },
          borderRadius: 2,
          border: theme => {
            if (isBestMatch) {
              return `2px solid ${theme.palette.mode === 'dark' ? '#4caf50' : '#2E7D32'}`;
            } else {
              return theme.palette.mode === 'dark' ? undefined : '1px solid rgba(0,0,0,0.06)';
            }
          },
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          width: '100%'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" color="text.primary">
                Resume ID: {match.resumeId}
              </Typography>
              {isBestMatch && (
                <Chip 
                  label="Best Match" 
                  size="small"
                  sx={{
                    backgroundColor: '#4CAF50', // Green background
                    color: 'white',
                    fontWeight: 600,
                    px: 1
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" mr={1}>
                Match Score:
              </Typography>
              <Rating
                value={starValue}
                precision={0.1}
                readOnly
                size="small"
              />
              <Chip
                label={`${match.matchAnalysis.overallMatch}%`}
                size="small"
                sx={{
                  ml: 1,
                  backgroundColor: theme => theme.palette.mode === 'dark' ? '#5D5FEF' : '#4A4AF4',
                  color: 'white',
                  fontWeight: 600,
                  minWidth: '45px'
                }}
              />
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {match.matchAnalysis.summary}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color="text.primary"
              sx={{
                mb: 0.5,
                fontWeight: 600
              }}
            >
              Strengths:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {match.matchAnalysis.technicalSkillsMatch.strengths.map((strength, i) => (
                <Chip
                  key={i}
                  label={strength}
                  size="small"
                  sx={{
                    fontSize: '0.8rem',
                    px: 0.5,
                    py: 0.75,
                    fontWeight: 500,
                    color: theme => theme.palette.mode === 'dark' ? 'white' : '#2E7D32',
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)',
                    '&:hover': {
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.25)' : 'rgba(76, 175, 80, 0.15)',
                    },
                    border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.3)'}`,
                  }}
                />
              ))}
            </Box>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="subtitle2"
              color="text.primary"
              sx={{
                mb: 0.5,
                fontWeight: 600
              }}
            >
              Gaps:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {match.matchAnalysis.technicalSkillsMatch.gaps.map((gap, i) => (
                <Chip
                  key={i}
                  label={gap}
                  size="small"
                  sx={{
                    fontSize: '0.8rem',
                    px: 0.5,
                    py: 0.75,
                    fontWeight: 500,
                    color: theme => theme.palette.mode === 'dark' ? 'white' : '#C62828',
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
                    '&:hover': {
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.25)' : 'rgba(211, 47, 47, 0.15)',
                    },
                    border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.5)' : 'rgba(211, 47, 47, 0.3)'}`,
                  }}
                />
              ))}
            </Box>
          </Box>
          {/* Show recommended next steps if available */}
          {match.matchAnalysis.recommendedNextSteps && match.matchAnalysis.recommendedNextSteps.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="subtitle2"
                color="text.primary"
                sx={{
                  mb: 0.5,
                  fontWeight: 600
                }}
              >
                Recommended Next Steps:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {match.matchAnalysis.recommendedNextSteps.map((step, idx) => (
                  <Box
                    component="li"
                    key={idx}
                    sx={{
                      color: theme => theme.palette.mode === 'dark' ? '#d1d1d1' : '#4B5563',
                      fontSize: '0.9em',
                      mb: 0.5,
                      lineHeight: 1.4
                    }}
                  >
                    {step}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default App;
