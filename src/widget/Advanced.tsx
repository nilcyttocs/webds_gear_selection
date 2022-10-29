import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
  AccordionSummaryProps
} from "@mui/material/AccordionSummary";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

import { styled } from "@mui/material/styles";

import { Page } from "./GearSelectionComponent";

const showHelp = false;

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    marginBottom: "8px"
  },
  "&:before": {
    display: "none"
  }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, .05)"
      : "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)"
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1)
  }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)"
}));

export const Advanced = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(true);
  const [baselineFrames, setBaselineFrames] = useState<number | null>();
  const [gramDataFrames, setGramDataFrames] = useState<number | null>();

  const handleDoneButtonClick = () => {
    props.setBaselineFrames(baselineFrames);
    props.setGramDataFrames(gramDataFrames);
    props.changePage(Page.Landing);
  };

  const handleCovarianceInputChange = (id: string, value: string) => {
    if (value !== "" && isNaN(Number(value))) {
      return;
    }
    if (value === "") {
      if (id === "baselineFrames") {
        setBaselineFrames(null);
      } else if (id === "gramDataFrames") setGramDataFrames(null);
      return;
    }
    const num = parseInt(value, 10);
    if (num < 4096) {
      if (id === "baselineFrames") {
        setBaselineFrames(num);
      } else if (id === "gramDataFrames") setGramDataFrames(num);
    }
  };

  useEffect(() => {
    setBaselineFrames(props.baselineFrames);
    setGramDataFrames(props.gramDataFrames);
    setInitialized(true);
  }, [props.baselineFrames, props.gramDataFrames]);

  return (
    <>
      {initialized ? (
        <>
          <Stack spacing={2}>
            <Box
              sx={{
                width: props.dimensions.width + "px",
                height: props.dimensions.heightTitle + "px",
                position: "relative",
                bgcolor: "section.background"
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)"
                }}
              >
                Carme Gear Selection
              </Typography>
              {showHelp && (
                <Button
                  variant="text"
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "16px",
                    transform: "translate(0%, -50%)"
                  }}
                >
                  <Typography variant="underline">Help</Typography>
                </Button>
              )}
            </Box>
            <Box
              sx={{
                width: props.dimensions.width + "px",
                height: props.dimensions.heightContent + "px",
                boxSizing: "border-box",
                padding: "24px",
                position: "relative",
                bgcolor: "section.background",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ margin: "0px auto 24px auto" }}>
                <Typography>Advanced Settings</Typography>
              </div>
              <div style={{ overflow: "auto" }}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ width: "25%", flexShrink: 0 }}>
                      Covariance Params
                    </Typography>

                    <Typography
                      sx={{ paddingLeft: "4px", color: "text.secondary" }}
                    >
                      Baseline Frames:&nbsp; {baselineFrames}, Gram Data
                      Frames:&nbsp;{gramDataFrames}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack justifyContent="center" spacing={5} direction="row">
                      <div>
                        <Typography>Baseline Frames</Typography>
                        <FormControl
                          variant="outlined"
                          size="small"
                          sx={{ width: "150px" }}
                        >
                          <OutlinedInput
                            id="baselineFrames"
                            value={baselineFrames}
                            onChange={(event) =>
                              handleCovarianceInputChange(
                                event.target.id,
                                event.target.value
                              )
                            }
                          />
                        </FormControl>
                      </div>
                      <div>
                        <Typography>Gram Data Frames</Typography>
                        <FormControl
                          variant="outlined"
                          size="small"
                          sx={{ width: "150px" }}
                        >
                          <OutlinedInput
                            id="gramDataFrames"
                            value={gramDataFrames}
                            onChange={(event) =>
                              handleCovarianceInputChange(
                                event.target.id,
                                event.target.value
                              )
                            }
                          />
                        </FormControl>
                      </div>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </div>
            </Box>
            <Box
              sx={{
                width: props.dimensions.width + "px",
                minHeight: props.dimensions.heightControls + "px",
                position: "relative",
                bgcolor: "section.background",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <div
                style={{
                  margin: "24px"
                }}
              >
                <Button
                  disabled={baselineFrames === null || gramDataFrames === null}
                  onClick={() => handleDoneButtonClick()}
                  sx={{ width: "150px" }}
                >
                  Done
                </Button>
              </div>
            </Box>
          </Stack>
        </>
      ) : null}
    </>
  );
};

export default Advanced;
