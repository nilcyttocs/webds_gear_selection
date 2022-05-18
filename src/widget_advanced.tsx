import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

import Typography from "@mui/material/Typography";

import { Page } from "./widget_container";

export const Advanced = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(true);
  const [accordionExpanded, setAccordionExpanded] = useState<boolean>(false);
  const [baselineFrames, setBaselineFrames] = useState<number>(0);
  const [gramDataFrames, setGramDataFrames] = useState<number>(0);

  const handleAccordionExpandedChange = (expanded: boolean) => {
    setAccordionExpanded(expanded);
  };

  const handleDoneButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    props.setBaselineFrames(baselineFrames);
    props.setGramDataFrames(gramDataFrames);
    props.changePage(Page.Landing);
  };

  const handleCovarianceInputChange = (id: string, value: string) => {
    if (value !== "" && isNaN(Number(value))) {
      return;
    }
    if (value === "") {
      value = "0";
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
          <Box sx={{ width: props.width + "px" }}>
            <Typography
              variant="h5"
              sx={{ height: "50px", textAlign: "center" }}
            >
              Carme Gear Selection
            </Typography>
            <Typography sx={{ height: "25px", textAlign: "center" }}>
              Advanced Settings
            </Typography>
            <Box
              sx={{
                height: props.height + "px",
                boxSizing: "border-box",
                border: 1,
                borderRadius: 1,
                borderColor: "grey.500",
                padding: "16px"
              }}
            >
              <Accordion
                onChange={(event, expanded) =>
                  handleAccordionExpandedChange(expanded)
                }
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography sx={{ width: "25%", flexShrink: 0 }}>
                    Covariance Params
                  </Typography>
                  {accordionExpanded ? null : (
                    <Typography sx={{ paddingLeft: "4px" }}>
                      Baseline Frames: {baselineFrames}, Gram Data Frames:{" "}
                      {gramDataFrames}
                    </Typography>
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  <Stack
                    spacing={5}
                    direction="row"
                    sx={{ paddingLeft: "25%" }}
                  >
                    <div>
                      <Typography id="baselineFramesText">
                        Baseline Frames
                      </Typography>
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
                      <Typography id="gramDataFramesText">
                        Gram Data Frames
                      </Typography>
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
            </Box>
            <div
              style={{
                marginTop: "20px",
                position: "relative",
                display: "flex",
                justifyContent: "center"
              }}
            >
              <Button
                onClick={(event) => handleDoneButtonClick(event)}
                sx={{ width: "100px" }}
              >
                Done
              </Button>
            </div>
          </Box>
        </>
      ) : null}
    </>
  );
};
