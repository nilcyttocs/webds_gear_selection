import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import LinearProgress from "@mui/material/LinearProgress";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import { requestAPI } from "./handler";

import {
  NoiseData,
  NoiseDataSet,
  NoiseCondition,
  Page
} from "./widget_container";

const SSE_CLOSED = 2;

const showHelp = false;

let intDurs: number[] = [];

let noiseData: NoiseData = [];

let eventSource: EventSource | undefined = undefined;

let alertMessage = "";

const alertMessagePrePDNRSweep =
  "Failed to do Pre-PDNR sweep. Please ensure device and running firmware support Carme gear selection.";

const alertMessagePDNRSweep =
  "Failed to do PDNR sweep. Please ensure device and running firmware support Carme gear selection.";

const alertMessageAbortPrePDNRSweep = "Failed to abort Pre-PDNR sweep.";

const alertMessageAbortPDNRSweep = "Failed to abort PDNR sweep.";

const alertMessageClearPDNRTuning = "Failed to clear PDNR tuning.";

const sendAbortRequest = async (): Promise<void> => {
  const dataToSend = {
    function: "stop"
  };
  try {
    await requestAPI<any>("gear-selection", {
      body: JSON.stringify(dataToSend),
      method: "POST"
    });
    return Promise.resolve();
  } catch (error) {
    console.error(
      `Error - POST /webds/gear-selection\n${dataToSend}\n${error}`
    );
    return Promise.reject("Failed to abort sweep");
  }
};

const sendClearPDNRTuningRequest = async (): Promise<void> => {
  const dataToSend = {
    function: "clear_pdnr_tuning"
  };
  try {
    await requestAPI<any>("gear-selection", {
      body: JSON.stringify(dataToSend),
      method: "POST"
    });
    return Promise.resolve();
  } catch (error) {
    console.error(
      `Error - POST /webds/gear-selection\n${dataToSend}\n${error}`
    );
    return Promise.reject("Failed to clear PDNR tuning");
  }
};

const sendSweepRequest = async (
  fnName: string,
  numGears: number,
  baselineFrames: number,
  gramDataFrames: number
): Promise<void> => {
  const dataToSend = {
    function: fnName,
    arguments: [intDurs, numGears, baselineFrames, gramDataFrames]
  };
  try {
    await requestAPI<any>("gear-selection", {
      body: JSON.stringify(dataToSend),
      method: "POST"
    });
    return Promise.resolve();
  } catch (error) {
    console.error(
      `Error - POST /webds/gear-selection\n${dataToSend}\n${error}`
    );
    return Promise.reject("Failed to do sweep");
  }
};

export const Sweep = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [prog, setProg] = useState(0);
  const [sweep, setSweep] = useState<string>("Pre-PDNR Sweep");
  const [goLabel, setGoLabel] = useState<string>("Go");
  const [noiseConditions, setNoiseConditions] = useState<NoiseCondition[]>([]);
  const [listRightPdding, setListRightPadding] = useState(0);

  const collectNoiseData = (data: number[][]) => {
    noiseData.forEach((item, index: number) => {
      const condition: NoiseCondition = {
        id: props.noiseConditions[step].id,
        name: props.noiseConditions[step].name
      };
      const trans = Math.floor(data[0][index] * 1000) / 1000;
      const absx = Math.floor(data[1][index] * 1000) / 1000;
      const absy = Math.floor(data[2][index] * 1000) / 1000;
      let max = Math.max(data[1][index], data[2][index]);
      max = Math.floor(max * 1000) / 1000;
      item.data.push({
        condition,
        trans,
        absx,
        absy,
        max
      });
    });
  };

  const eventHandler = (event: any) => {
    const data = JSON.parse(event.data);
    console.log(data);
    const progress = (data.progress * 100) / data.total;
    setProg(progress);
  };

  const removeEvent = () => {
    if (eventSource && eventSource.readyState !== SSE_CLOSED) {
      eventSource.removeEventListener("gear-selection", eventHandler, false);
      eventSource.close();
      eventSource = undefined;
    }
  };

  const errorHandler = (error: any) => {
    removeEvent();
    console.error(`Error - GET /webds/gear-selection\n${error}`);
  };

  const addEvent = () => {
    if (eventSource) {
      return;
    }
    eventSource = new window.EventSource("/webds/gear-selection");
    eventSource.addEventListener("gear-selection", eventHandler, false);
    eventSource.addEventListener("error", errorHandler, false);
    eventSource.onmessage = function (event) {
      if (event.lastEventId === "stopped") {
        removeEvent();
        props.changePage(Page.Landing);
        return;
      } else if (event.lastEventId === "completed") {
        if (sweep === "PDNR Sweep") {
          const data = JSON.parse(event.data);
          collectNoiseData(data);
        }
        removeEvent();
        setTimeout(() => {
          if (step < props.noiseConditions.length - 1) {
            setStep(step + 1);
            setProg(0);
          } else if (sweep === "Pre-PDNR Sweep") {
            setSweep("PDNR Sweep");
            setStep(0);
            setProg(0);
          } else {
            setGoLabel("Next");
            setProg(100);
          }
        }, 1500);
      }
    };
  };

  const doSweep = () => {
    if (sweep === "Pre-PDNR Sweep" && step === 0) {
      try {
        sendClearPDNRTuningRequest();
      } catch (error) {
        console.error(error);
        alertMessage = alertMessageClearPDNRTuning;
        setAlert(true);
        return;
      }
    }
    if (
      sweep === "PDNR Sweep" &&
      step === props.noiseConditions.length - 1 &&
      prog === 100
    ) {
      setSweep("Pre-PDNR Sweep");
      setGoLabel("Go");
      props.setNoiseData(noiseData);
      props.changePage(Page.Transcap);
      return;
    }
    let fnName = "";
    if (sweep === "Pre-PDNR Sweep") {
      fnName = "pre_pdnr_sweep";
    } else {
      fnName = "pdnr_sweep";
    }
    try {
      sendSweepRequest(
        fnName,
        props.numGears,
        props.baselineFrames,
        props.gramDataFrames
      );
    } catch (error) {
      console.error(error);
      if (sweep === "Pre-PDNR Sweep") {
        alertMessage = alertMessagePrePDNRSweep;
      } else {
        alertMessage = alertMessagePDNRSweep;
      }
      setAlert(true);
      return;
    }
    setProg(0.001);
    addEvent();
  };

  const handleGoButtonClick = () => {
    doSweep();
  };

  const handleAbortButtonClick = () => {
    if (prog === 0 || goLabel === "Next") {
      removeEvent();
      props.changePage(Page.Landing);
    }
    try {
      sendAbortRequest();
    } catch (error) {
      console.error(error);
      if (sweep === "Pre-PDNR Sweep") {
        alertMessage = alertMessageAbortPrePDNRSweep;
      } else {
        alertMessage = alertMessageAbortPDNRSweep;
      }
    }
  };

  const generateListItems = (): JSX.Element[] => {
    return props.noiseConditions?.map(({ id, name }: any, index: number) => {
      if (index === step) {
        return (
          <div
            key={id}
            style={{
              position: "relative"
            }}
          >
            <ListItem divider selected>
              <ListItemText primary={name} sx={{ paddingLeft: "16px" }} />
            </ListItem>
            <LinearProgress
              variant="determinate"
              value={prog}
              sx={{
                position: "absolute",
                bottom: "0px",
                width: "100%"
              }}
            />
          </div>
        );
      }
      return (
        <ListItem key={id} divider>
          <ListItemText primary={name} sx={{ paddingLeft: "16px" }} />
        </ListItem>
      );
    });
  };

  useEffect(() => {
    return () => {
      removeEvent();
    };
  }, []);

  useEffect(() => {
    const element = document.getElementById(
      "webds_gear_selection_sweep_noise_conditions_list"
    );
    if (element && element.scrollHeight > element.clientHeight) {
      setListRightPadding(8);
    } else {
      setListRightPadding(0);
    }
  }, [noiseConditions]);

  useEffect(() => {
    setNoiseConditions(props.noiseConditions);
    setInitialized(true);
  }, [props.noiseConditions]);

  useEffect(() => {
    intDurs = [];
    noiseData = [];
    for (
      let idx = props.intDurMin;
      idx < props.intDurMin + props.intDurSteps;
      idx++
    ) {
      intDurs.push(idx);
      noiseData.push({
        intDur: idx,
        data: [],
        selected: false,
        displayNoise: true
      } as NoiseDataSet);
    }
    setNoiseConditions(props.noiseConditions);
    setInitialized(true);
  }, [props.intDurMin, props.intDurSteps, props.noiseConditions]);

  return (
    <>
      {alert ? (
        <Alert
          severity="error"
          onClose={() => setAlert(false)}
          sx={{ marginBottom: "16px", whiteSpace: "pre-wrap" }}
        >
          {alertMessage}
        </Alert>
      ) : null}
      {initialized ? (
        <>
          <Stack spacing={2}>
            <Box
              sx={{
                width: props.dimensions.width + "px",
                height: props.dimensions.heightTitle + "px",
                position: "relative",
                bgcolor: "section.main"
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
                  <Typography
                    variant="body2"
                    sx={{ textDecoration: "underline" }}
                  >
                    Help
                  </Typography>
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
                bgcolor: "section.main",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <Typography sx={{ fontSize: "1.1rem" }}>{sweep}</Typography>
              <Typography
                sx={{
                  marginTop: "8px",
                  fontSize: "1.1rem",
                  textDecoration: "underline"
                }}
              >
                Please set up noise condition "
                <span style={{ fontWeight: "bold" }}>
                  {props.noiseConditions[step].name}
                </span>
                ". Click Go when done.
              </Typography>
              <Divider
                orientation="horizontal"
                sx={{ width: "100%", marginTop: "24px" }}
              />
              <Typography sx={{ marginTop: "24px" }}>
                Noise Conditions
              </Typography>
              <div
                id="webds_gear_selection_sweep_noise_conditions_list"
                style={{
                  width: "75%",
                  marginTop: "16px",
                  paddingRight: listRightPdding,
                  overflow: "auto"
                }}
              >
                <List>{generateListItems()}</List>
              </div>
            </Box>
            <Box
              sx={{
                width: props.dimensions.width + "px",
                minHeight: props.dimensions.heightControls + "px",
                boxSizing: "border-box",
                padding: "24px",
                position: "relative",
                bgcolor: "section.main",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Button
                disabled={prog !== 0 && goLabel !== "Next"}
                onClick={() => handleGoButtonClick()}
                sx={{ width: "150px" }}
              >
                {goLabel}
              </Button>
              <Button
                variant="text"
                onClick={() => handleAbortButtonClick()}
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: "24px",
                  transform: "translate(0%, -50%)"
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ textDecoration: "underline" }}
                >
                  Abort
                </Typography>
              </Button>
            </Box>
          </Stack>
        </>
      ) : null}
    </>
  );
};
