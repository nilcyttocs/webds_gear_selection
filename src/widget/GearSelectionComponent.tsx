import React, { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';

import Abscap from './Abscap';
import Advanced from './Advanced';
import {
  ALERT_MESSAGE_ADD_PRIVATE_CONFIG_JSON,
  ALERT_MESSAGE_ADD_PUBLIC_CONFIG_JSON,
  ALERT_MESSAGE_READ_STATIC,
  DEFAULT_BASELINE_FRAMES,
  DEFAULT_GRAM_DATA_FRAMES,
  DEFAULT_INT_DUR_MIN,
  DEFAULT_INT_DUR_STEPS
} from './constants';
import Landing from './Landing';
import { requestAPI, webdsService } from './local_exports';
import Sweep from './Sweep';
import Transcap from './Transcap';

export enum Page {
  Landing = 'LANDING',
  Advanced = 'ADVANCED',
  Sweep = 'SWEEP',
  Transcap = 'TRANSCAP',
  Abscap = 'ABSCAP'
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

export const GearSelectionComponent = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<string | undefined>(undefined);
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

  const webdsTheme = webdsService.ui.getWebDSTheme();

  const changePage = (newPage: Page) => {
    setPage(newPage);
  };

  const displayPage = (): JSX.Element | null => {
    switch (page) {
      case Page.Landing:
        return (
          <Landing
            setAlert={setAlert}
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
            setAlert={setAlert}
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
            setAlert={setAlert}
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
            setAlert={setAlert}
            changePage={changePage}
            numGears={numGears}
            noiseData={noiseData}
          />
        );
      case Page.Abscap:
        return (
          <Abscap
            setAlert={setAlert}
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
    const external = webdsService.pinormos.isExternal();
    try {
      if (external) {
        await webdsService.packrat.cache.addPublicConfig();
      } else {
        await webdsService.packrat.cache.addPrivateConfig();
      }
    } catch (error) {
      console.error(error);
      if (external) {
        setAlert(ALERT_MESSAGE_ADD_PUBLIC_CONFIG_JSON);
      } else {
        setAlert(ALERT_MESSAGE_ADD_PRIVATE_CONFIG_JSON);
      }
      return;
    }
    const dataToSend: any = {
      command: 'getStaticConfig'
    };
    try {
      const staticConfig = await requestAPI<any>('command', {
        body: JSON.stringify(dataToSend),
        method: 'POST'
      });
      setNumGears(staticConfig['daqParams.freqTable[0].rstretchDur'].length);
    } catch (error) {
      console.error(`Error - POST /webds/command\n${dataToSend}\n${error}`);
      setAlert(ALERT_MESSAGE_READ_STATIC);
      return;
    }
    setInitialized(true);
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <ThemeProvider theme={webdsTheme}>
        <div className="jp-webds-widget-body">
          {alert !== undefined && (
            <Alert
              severity="error"
              onClose={() => setAlert(undefined)}
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {alert}
            </Alert>
          )}
          {initialized && displayPage()}
        </div>
        {!initialized && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
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
