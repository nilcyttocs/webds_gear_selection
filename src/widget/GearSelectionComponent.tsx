import React, { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";

import CircularProgress from "@mui/material/CircularProgress";

import { ThemeProvider } from "@mui/material/styles";

import Abscap from "./Abscap";

import Advanced from "./Advanced";

import Landing from "./Landing";

import Sweep from "./Sweep";

import Transcap from "./Transcap";

import { requestAPI } from "../handler";

export enum Page {
  Landing = "LANDING",
  Advanced = "ADVANCED",
  Sweep = "SWEEP",
  Transcap = "TRANSCAP",
  Abscap = "ABSCAP"
}

export type NoiseCondition = {
  id: string;
  name: string;
};

export type NoiseDataEntry = {
  condition: NoiseCondition;
  trans: number;
  absx: number;
  absy: number;
  max: number;
};

export type NoiseDataSet = {
  intDur: number;
  data: NoiseDataEntry[];
  selected: boolean;
  displayNoise: boolean;
};

export type NoiseData = NoiseDataSet[];

const DEFAULT_INT_DUR_MIN = 24;
const DEFAULT_INT_DUR_STEPS = 75;

const DEFAULT_BASELINE_FRAMES = 16;
const DEFAULT_GRAM_DATA_FRAMES = 400;

let alertMessage = "";

const alertMessagePublicConfigJSON =
  "Failed to retrieve config JSON file. Please check in file browser in left sidebar and ensure availability of config JSON file in /Packrat/ directory (e.g. /Packrat/1234567/config.json for PR1234567).";

const alertMessagePrivateConfigJSON =
  "Failed to retrieve config JSON file. Please check in file browser in left sidebar and ensure availability of config JSON file in /Packrat/ directory (e.g. /Packrat/1234567/config_private.json for PR1234567).";

const alertMessageStaticConfig =
  "Failed to read static config and obtain gear information from device. Please ensure device and running firmware support Carme gear selection.";

export const GearSelectionComponent = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [page, setPage] = useState<Page>(Page.Landing);
  const [numGears, setNumGears] = useState<number>(0);
  const [intDurMin, setIntDurMin] = useState<number>(DEFAULT_INT_DUR_MIN);
  const [intDurSteps, setIntDurSteps] = useState<number>(DEFAULT_INT_DUR_STEPS);
  const [baselineFrames, setBaselineFrames] = useState<number>(
    DEFAULT_BASELINE_FRAMES
  );
  const [gramDataFrames, setGramDataFrames] = useState<number>(
    DEFAULT_GRAM_DATA_FRAMES
  );
  const [noiseData, setNoiseData] = useState<NoiseData>([]);
  const [noiseConditions, setNoiseConditions] = useState<NoiseCondition[]>([]);

  const changePage = (newPage: Page) => {
    setPage(newPage);
  };

  const displayPage = (): JSX.Element | null => {
    switch (page) {
      case Page.Landing:
        return (
          <Landing
            changePage={changePage}
            intDurMin={intDurMin}
            setIntDurMin={setIntDurMin}
            intDurSteps={intDurSteps}
            setIntDurSteps={setIntDurSteps}
            noiseConditions={noiseConditions}
            setNoiseConditions={setNoiseConditions}
          />
        );
      case Page.Advanced:
        return (
          <Advanced
            changePage={changePage}
            baselineFrames={baselineFrames}
            setBaselineFrames={setBaselineFrames}
            gramDataFrames={gramDataFrames}
            setGramDataFrames={setGramDataFrames}
          />
        );
      case Page.Sweep:
        return (
          <Sweep
            changePage={changePage}
            numGears={numGears}
            intDurMin={intDurMin}
            intDurSteps={intDurSteps}
            baselineFrames={baselineFrames}
            gramDataFrames={gramDataFrames}
            setNoiseData={setNoiseData}
            noiseConditions={noiseConditions}
          />
        );
      case Page.Transcap:
        return (
          <Transcap
            changePage={changePage}
            numGears={numGears}
            noiseData={noiseData}
          />
        );
      case Page.Abscap:
        return (
          <Abscap
            changePage={changePage}
            numGears={numGears}
            noiseData={noiseData}
          />
        );
      default:
        return null;
    }
  };

  const initialize = async () => {
    const external = props.service.pinormos.isExternal();
    try {
      if (external) {
        await props.service.packrat.cache.addPublicConfig();
      } else {
        await props.service.packrat.cache.addPrivateConfig();
      }
    } catch (error) {
      console.error(error);
      if (external) {
        alertMessage = alertMessagePublicConfigJSON;
      } else {
        alertMessage = alertMessagePrivateConfigJSON;
      }
      setAlert(true);
      return;
    }
    const dataToSend: any = {
      command: "getStaticConfig"
    };
    try {
      const staticConfig = await requestAPI<any>("command", {
        body: JSON.stringify(dataToSend),
        method: "POST"
      });
      setNumGears(staticConfig["daqParams.freqTable[0].rstretchDur"].length);
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      alertMessage = alertMessageStaticConfig;
      setAlert(true);
      return;
    }
    setInitialized(true);
  };

  useEffect(() => {
    initialize();
  }, []);

  const webdsTheme = props.service.ui.getWebDSTheme();

  return (
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert && (
            <Alert
              severity="error"
              onClose={() => setAlert(false)}
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {alertMessage}
            </Alert>
          )}
          {initialized && displayPage()}
        </div>
        {!initialized && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)"
            }}
          >
            <CircularProgress color="primary" />
          </div>
        )}
      </ThemeProvider>
    </>
  );
};

export default GearSelectionComponent;
