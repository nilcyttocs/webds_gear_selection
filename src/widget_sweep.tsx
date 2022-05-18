import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import LinearProgress from "@mui/material/LinearProgress";

import { grey } from "@mui/material/colors";

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

const LIST_HEIGHT_OFFSET = -2 - 16 * 2 - 64 - 24 - 1 - 24 - 24;

let conditionsListHeight = 0;

let intDurs: number[] = [];

let noiseData: NoiseData = [];

let eventSource: EventSource | undefined = undefined;

let alertMessage = "";

const alertMessagePrePDNRSweep = "Failed to do Pre-PDNR sweep.";

const alertMessagePDNRSweep = "Failed to do PDNR sweep.";

const alertMessageClearPDNRTuning = "Failed to clear PDNR tuning.";

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
    console.error(`Error - POST /webds/gear-selectio\n${dataToSend}\n${error}`);
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
    console.error(`Error - POST /webds/gear-selectio\n${dataToSend}\n${error}`);
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
    const progress = Math.floor((data.progress * 100) / data.total);
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
    eventSource = new window.EventSource(
      "http://localhost:8888/webds/gear-selection"
    );
    eventSource.addEventListener("gear-selection", eventHandler, false);
    eventSource.addEventListener("error", errorHandler, false);
    eventSource.onmessage = function (event) {
      if (event.lastEventId === "completed") {
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

  const handleGoButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    doSweep();
  };

  const handleAbortButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    removeEvent();
    props.changePage(Page.Landing);
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
    conditionsListHeight = props.height + LIST_HEIGHT_OFFSET;
    setInitialized(true);
  }, [props.intDurMin, props.intDurSteps, props.height]);

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
            <Typography
              sx={{ height: "25px", textAlign: "center", fontWeight: "bold" }}
            >
              {sweep}
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
              <Stack spacing={3} divider={<Divider orientation="horizontal" />}>
                <Box
                  sx={{
                    height: "64px"
                  }}
                >
                  <Typography sx={{ paddingTop: "20px", textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: "1.1rem",
                        backgroundColor: "darkorange"
                      }}
                    >
                      Please set up noise condition "
                      <span style={{ fontWeight: "bold" }}>
                        {props.noiseConditions[step].name}
                      </span>
                      ". Click Go when done.
                    </span>
                  </Typography>
                </Box>
                <div>
                  <Typography sx={{ textAlign: "center" }}>
                    Noise Conditions
                  </Typography>
                  <Box
                    sx={{
                      height: conditionsListHeight + "px",
                      overflow: "auto"
                    }}
                  >
                    <Stack justifyContent="center" direction="row">
                      <List sx={{ width: "85%" }}>{generateListItems()}</List>
                    </Stack>
                  </Box>
                </div>
              </Stack>
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
                disabled={prog !== 0 && goLabel !== "Next"}
                onClick={(event) => handleGoButtonClick(event)}
                sx={{ width: "100px" }}
              >
                {goLabel}
              </Button>
              <Button
                variant="text"
                disabled={prog !== 0 && goLabel !== "Next"}
                onClick={(event) => handleAbortButtonClick(event)}
                sx={{
                  position: "absolute",
                  top: "5px",
                  right: "20px",
                  textTransform: "none"
                }}
              >
                {prog !== 0 && goLabel !== "Next" ? (
                  <Typography
                    variant="body2"
                    sx={{ color: grey[500], textDecoration: "underline" }}
                  >
                    Abort
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ textDecoration: "underline" }}
                  >
                    Abort
                  </Typography>
                )}
              </Button>
            </div>
          </Box>
          {alert ? (
            <Alert severity="error" onClose={() => setAlert(false)}>
              {alertMessage}
            </Alert>
          ) : null}
        </>
      ) : null}
    </>
  );
};
