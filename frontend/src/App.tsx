import React, { useState, useRef, useEffect } from "react";
import {
  CssBaseline, Container, Box, Typography, ThemeProvider,
  TextField, Button, Paper, CircularProgress, Divider,
  FormControl, FormControlLabel, Switch, Select, MenuItem,
  InputLabel, Slider, Chip, Card, CardContent, Rating,
  Backdrop
} from "@mui/material";
import { muiTheme } from "./theme/muiTheme";
import { matchResumes } from "./api/resumeMatchmakerApi";
import type { ResumeMatchingResponse, ResumeMatch } from "@jobfit-ai/shared/src/resumeMatchmakerTypes";

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

      // If there's a best match in the results, set it as selectedCandidate
      if (response.bestMatch) {
        const bestMatchFull = response.matches.find(
          (match) => match.resumeId === response.bestMatch?.candidateId
        );
        if (bestMatchFull) {
          setSelectedCandidate(bestMatchFull);
        }
      }
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
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          background: "linear-gradient(120deg, #181A20 0%, #23262F 100%)",
          fontFamily: muiTheme.typography.fontFamily,
        }}
      >
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
                backgroundColor: 'rgba(35, 38, 47, 0.7)',
                borderRadius: 2,
              }}
            >
              <Typography variant="h4" gutterBottom sx={{ color: "primary.main", mb: 2, textAlign: "center" }}>
                Jobfit AI Matchmaker
              </Typography>
              <Typography variant="h6" gutterBottom color="primary.light">
                Job Description
              </Typography>
              <TextField
                multiline
                fullWidth
                rows={12}
                variant="outlined"
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                sx={{
                  mb: 2,
                  backgroundColor: 'rgba(24, 26, 32, 0.5)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Search Options
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useHybridSearch}
                        onChange={(e) => setUseHybridSearch(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Hybrid Search"
                  />
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAdvancedOptions}
                      onChange={(e) => setShowAdvancedOptions(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Advanced Options"
                />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {showAdvancedOptions && (
                  <Box sx={{ mt: 2, overflowY: 'auto' }}>
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
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
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
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(35, 38, 47, 0.7)',
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
                    bgcolor: 'rgba(24, 26, 32, 0.7)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={48} color="primary" thickness={5} />
                  <Typography variant="body2" color="primary.contrastText" sx={{ mt: 2, fontWeight: 600, fontSize: '1.2rem', letterSpacing: 0.5 }}>
                    Finding matching candidates... {loadingTime}s elapsed
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
                          sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: 'rgba(76, 175, 80, 0.08)',
                            borderRadius: 2,
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            maxHeight: 220,
                            overflowY: 'auto',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" color="primary.light" fontWeight="bold">
                              Best Match: {results.bestMatch.candidateId}
                            </Typography>
                            <Chip
                              label={`Score: ${results.bestMatch.overallScore}%`}
                              color="success"
                              size="small"
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
                      {results.metadata?.processingTimeMs &&
                        ` in ${(results.metadata.processingTimeMs / 1000).toFixed(2)}s`}
                    </Typography>
                    <Box sx={{ overflowY: 'auto', pr: 1, flex: 1 }}>
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
                          sx={{ zIndex: 1200, bgcolor: 'rgba(0,0,0,0.7)' }}
                        />
                        <Box
                          sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: 500,
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
                          <Typography variant="subtitle1" color="white" gutterBottom>
                            Resume ID: {selectedCandidate.resumeId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedCandidate.matchAnalysis.summary}
                          </Typography>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" color="primary.light">Strengths</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {selectedCandidate.matchAnalysis.technicalSkillsMatch.strengths.map((s: string, i: number) => (
                              <Chip key={i} label={s} size="small" color="primary" variant="outlined" />
                            ))}
                          </Box>
                          <Typography variant="subtitle2" color="error.main">Gaps</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {selectedCandidate.matchAnalysis.technicalSkillsMatch.gaps.map((g: string, i: number) => (
                              <Chip key={i} label={g} size="small" color="error" variant="outlined" />
                            ))}
                          </Box>
                          <Typography variant="subtitle2" color="primary.light">Recommended Next Steps</Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {selectedCandidate.matchAnalysis.recommendedNextSteps.map((step: string, idx: number) => (
                              <Box component="li" key={idx} sx={{ color: '#bdbdbd', fontSize: '0.95em' }}>{step}</Box>
                            ))}
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          {/* Show all match dimensions */}
                          <Typography variant="subtitle2" color="primary.light">Match Dimensions</Typography>
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
                                  <Typography variant="body2" color="primary.main">{key.replace('Match', '')} (Score: {dim.score})</Typography>
                                  <Typography variant="caption" color="text.secondary">{dim.explanation}</Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {dim.strengths && dim.strengths.map((s, i) => (
                                      <Chip key={i} label={s} size="small" color="primary" variant="outlined" />
                                    ))}
                                    {dim.gaps && dim.gaps.map((g, i) => (
                                      <Chip key={i} label={g} size="small" color="error" variant="outlined" />
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
    <Card
      onClick={onClick}
      sx={{
        mb: 2,
        backgroundColor: isBestMatch ? 'rgba(76, 175, 80, 0.12)' : 'rgba(24, 26, 32, 0.7)',
        borderRadius: 2,
        border: isBestMatch ? '2px solid #4caf50' : undefined,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" color="white">
              {match.resumeId}
            </Typography>
            {isBestMatch && <Chip label="Best Match" color="success" size="small" />}
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
            <Typography variant="body2" color="primary.light" ml={1}>
              {match.matchAnalysis.overallMatch}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {match.matchAnalysis.summary}
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Strengths:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {match.matchAnalysis.technicalSkillsMatch.strengths.map((strength, i) => (
              <Chip
                key={i}
                label={strength}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Gaps:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {match.matchAnalysis.technicalSkillsMatch.gaps.map((gap, i) => (
              <Chip
                key={i}
                label={gap}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
        {/* Show recommended next steps if available */}
        {match.matchAnalysis.recommendedNextSteps && match.matchAnalysis.recommendedNextSteps.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Recommended Next Steps:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {match.matchAnalysis.recommendedNextSteps.map((step, idx) => (
                <Box component="li" key={idx} sx={{ color: '#bdbdbd', fontSize: '0.85em' }}>{step}</Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default App;
