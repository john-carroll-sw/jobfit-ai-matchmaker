import React, { useEffect, useState } from "react";
import { Typography, Box, Divider, Card, CardContent, Chip, Paper } from "@mui/material";
import type { ReasoningResponse } from "../types/supplyChain";
import { useSupplyChain } from "../hooks/useSupplyChain";

const DEFAULT_REASONING: ReasoningResponse = {
  reasoning: `1. No active disruptions are reported, but several high-risk (risk >10%) and high-cost routes exist (f1→dc1: cost 5 000, risk 0.10; f1→dc2: 4 800, 0.12; f1→dc3 via air: 3 000, 0.09).
2. All DCs and retails currently exceed minimums, so there’s no emergency restock, but ongoing replenishment costs and risk exposures can be optimized.
3. Factory Chicago (f2) offers lower-cost, lower-risk lanes to all DCs vs. Factory Shanghai (f1):
   – f2→dc1 (air): 2 000, risk 0.08 vs f1→dc1 (ship) 5 000, 0.10
   – f2→dc2 (ship) 2 500, 0.11 vs f1→dc2 (ship) 4 800, 0.12
   – f2→dc3 (truck) 1 000, 0.07 vs f1→dc3 (air) 3 000, 0.09
4. Shifting DC replenishment to f2 reduces unit transport cost by 40–67% and lowers risk.
5. Several routes still carry >10% risk (r-dc1-dc2 0.13, r-dc2-dc3 0.15). Without buffers, a single delay could trigger expensive expedited shipments.
6. Idle assets (ship s1, multiple planes) can be redeployed to absorb peak or urgent volumes and avoid rush-mode premium rates.
7. Current reorder logic (trigger at minInventory) risks stock falling low before resupply arrives; moving to a mid-point reorder elevates service and avoids costly air-freight rushes.
`,
  recommendations: [
    {
      title: "Reallocate DC replenishment to Factory Chicago (f2)",
      description: "For all regular SKU flows to DC1, DC2, and DC3, switch sourcing from Shanghai (f1) to Chicago (f2). This reduces transport cost by 40–67% per shipment (e.g. f2→dc3 truck 1 000 vs f1→dc3 air 3 000) and lowers route risk. Update your ERP routing rules accordingly."
    },
    {
      title: "Establish safety-stock buffers at high-risk DC pairs",
      description: "For routes with risk >10% (dc1→dc2, dc2→dc3), increase safety stock by 20–30% above minInventory. This buffer covers 1–2 weeks of demand and prevents rush air-freight costs if a shipment is delayed."
    },
    {
      title: "Shift reorder points to mid-inventory levels",
      description: "Rather than triggering replenishment at the minInventory threshold, set reorder points at 50–60% of maxInventory. This ensures shipments are placed earlier, leveraging cheaper sea/truck modes and avoiding expedited transport surcharges."
    },
    {
      title: "Consolidate multi-SKU shipments and cross-dock at DC1",
      description: "Combine smaller SKUA/SKUB/C shipments destined for Berlin and Paris into weekly full-truckloads from DC1. Cross-dock at Rotterdam to minimize per-unit last-mile costs (truck cost 200–220 per leg) and reduce handling fees."
    },
    {
      title: "Redeploy idle transport assets for peak or urgent flow",
      description: "Assign ship s1 to execute monthly full-sea voyages from Shanghai to Rotterdam when f1 surplus warrants, and designate one idle airplane (e.g. a3 in Europe) as a hot-spare for last-mile urgencies. This avoids premium ad-hoc charter rates."
    }
  ]
};

interface ReasoningPanelProps {
  reasoning?: ReasoningResponse;
  error?: string | null;
}

const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ reasoning, error = null }) => {
  const { isInitialState } = useSupplyChain();
  const [displayReasoning, setDisplayReasoning] = useState<ReasoningResponse | undefined>(undefined);
  const [selectedRecommendation, setSelectedRecommendation] = useState<number | null>(null);

  useEffect(() => {
    if (error) {
      setDisplayReasoning(undefined);
      return;
    }
    if (isInitialState) {
      setDisplayReasoning(DEFAULT_REASONING);
    } else if (reasoning && (reasoning.reasoning || reasoning.recommendations.length > 0)) {
      setDisplayReasoning(reasoning);
    } else {
      setDisplayReasoning(undefined);
    }
    setSelectedRecommendation(null); // Reset selection on new reasoning
  }, [reasoning, isInitialState, error]);

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="error" sx={{ fontStyle: 'italic' }}>
          Error getting AI reasoning: {error}
        </Typography>
      </Box>
    );
  }

  if (!displayReasoning) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Trigger a disruption and use "Get AI Reasoning" to see analysis here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Paper elevation={3} sx={{ p: 3, bgcolor: '#23262F', color: '#F4F4F4', mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#00FFD0', fontWeight: 700 }}>
          AI Reasoning & Recommendations
        </Typography>
        {displayReasoning.reasoning && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ color: '#00FFD0' }}>Analysis:</Typography>
            <Paper sx={{ p: 2, bgcolor: '#181A20', color: '#F4F4F4', mt: 1, mb: 2, maxHeight: 300, overflow: 'auto', borderRadius: 2, boxShadow: 'none' }}>
              <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                {displayReasoning.reasoning}
              </Typography>
            </Paper>
          </Box>
        )}
        {displayReasoning.recommendations.length > 0 && (
          <>
            <Divider sx={{ my: 2, bgcolor: '#00FFD0' }} />
            <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ color: '#00FFD0' }}>
              Recommendations:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {displayReasoning.recommendations.map((rec, index) => (
                <Card
                  key={index}
                  onClick={() => setSelectedRecommendation(index)}
                  sx={{
                    mb: 1,
                    bgcolor: selectedRecommendation === index ? '#23262F' : '#181A20',
                    color: '#F4F4F4',
                    borderRadius: 2,
                    border: selectedRecommendation === index
                      ? '2.5px solid #00FFD0'
                      : '2px solid #333',
                    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                    boxShadow: selectedRecommendation === index
                      ? '0 0 12px #00FFD055'
                      : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      border: '2.5px solid #00FFD0',
                      boxShadow: '0 0 8px #00FFD033',
                      bgcolor: '#23262F',
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Chip
                        label={`Option ${index + 1}`}
                        size="small"
                        sx={{
                          mr: 1,
                          bgcolor: selectedRecommendation === index ? '#00FFD0' : 'grey.700',
                          color: selectedRecommendation === index ? '#181A20' : '#F4F4F4',
                          fontWeight: 600,
                          transition: 'background 0.2s, color 0.2s',
                        }}
                      />
                      <Typography variant="subtitle2" sx={{ color: '#00FFD0', fontWeight: 600 }}>
                        {rec.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ color: '#F4F4F4' }}>
                      {rec.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ReasoningPanel;
