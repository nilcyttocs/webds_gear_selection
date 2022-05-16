import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import ToggleButton from "@mui/material/ToggleButton";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import { requestAPI } from "./handler";

import {
  Page,
  NoiseData,
  NoiseDataSet,
  NoiseDataEntry,
  NoiseCondition
} from "./widget_container";

const ISTRETCH = 9;
const RESET = 10;
const SAMPLE = 7;
const OVERHEAD = 3;
const CLOCK = 29;

type Selected = { [intDur: string]: boolean };

type Excluded = { [conditionID: string]: boolean };

type Frequency = { [intDur: string]: number };

type SelectedGear = {
  gear: number;
  frequency: number | undefined;
  intDur: number | undefined;
  rstretch: number | undefined;
};

type SelectedGears = SelectedGear[];

let sort = "freq";

let testCommit = "test";

let noiseData: NoiseData = [];

let intDurs: number[] = [];

let frequencies: Frequency = {};

let conditions: NoiseCondition[] = [];

let selectedGears: SelectedGears = [];

let dialogTitle = "";

const testDialogTitle = "Gear Settings to Write to RAM";

const commitDialogTitle = "Gear Settings to Write to Flash";

let alertMessage = "";

const alertMessageWriteToFlash = "Failed to write gear settings to flash.";

const alertMessageWriteToRAM = "Failed to write gear settings to RAM.";

const sendSetTransGearsRequest = async (
  selections: number[],
  numGears: number,
  commit: boolean
): Promise<void> => {
  const dataToSend = {
    function: "set_trans_gears",
    arguments: [selections, numGears, commit]
  };
  try {
    await requestAPI<any>("gear-selection", {
      body: JSON.stringify(dataToSend),
      method: "POST"
    });
    return Promise.resolve();
  } catch (error) {
    console.error(`Error - POST /webds/gear-selectio\n${dataToSend}\n${error}`);
    return Promise.reject("Failed to set transcap gears");
  }
};

const updateSelectedGears = (selected: Selected, numGears: number) => {
  selectedGears = [];
  for (let idx = 0; idx < numGears; idx++) {
    selectedGears.push({
      gear: idx,
      frequency: undefined,
      intDur: undefined,
      rstretch: undefined
    });
  }
  const selections = intDurs.filter((item) => selected[item]);
  if (selections.length) {
    selectedGears[0].intDur = selections[0];
    for (let idx = 0; idx < selections.length; idx++) {
      let intDur = selections[idx];
      selectedGears[idx].frequency = frequencies[intDur];
      selectedGears[idx].intDur = intDur;
      selectedGears[idx].rstretch = intDur - selectedGears[0].intDur;
    }
  }
};

const findMaxNoise = (column: number): number | undefined => {
  const dataSet = noiseData.find((item) => item.intDur === column);
  if (dataSet) {
    const maxDataEntry = dataSet.data.reduce(
      (prev, cur) => {
        if (cur.trans > prev.trans) {
          return cur;
        } else {
          return prev;
        }
      },
      { trans: Number.NEGATIVE_INFINITY }
    );
    if (maxDataEntry.trans === Number.NEGATIVE_INFINITY) {
      return undefined;
    }
    return maxDataEntry.trans;
  }
};

const findMaxNoiseNonExcluded = (
  column: number,
  exclusions: Excluded
): number | undefined => {
  const dataSet = noiseData.find((item) => item.intDur === column);
  if (dataSet) {
    const maxDataEntry = dataSet.data.reduce(
      (prev, cur) => {
        if (exclusions[cur.condition.id]) {
          return prev;
        }
        if (cur.trans > prev.trans) {
          return cur;
        } else {
          return prev;
        }
      },
      { trans: Number.NEGATIVE_INFINITY }
    );
    if (maxDataEntry.trans === Number.NEGATIVE_INFINITY) {
      return undefined;
    }
    return maxDataEntry.trans;
  }
};

const findTotalNoiseNonExcluded = (
  column: number,
  exclusions: Excluded
): number | undefined => {
  const dataSet = noiseData.find((item) => item.intDur === column);
  if (dataSet) {
    const totalNoise = dataSet.data.reduce(
      (prev, cur) => {
        if (exclusions[cur.condition.id]) {
          return prev;
        }
        return { trans: prev.trans + cur.trans };
      },
      { trans: 0 }
    );
    if (totalNoise.trans) {
      return Math.round(totalNoise.trans * 100) / 100;
    }
  }
};

const findMinGearNoise = (condition: NoiseCondition): number | undefined => {
  const gearNoise: number[] = [];
  noiseData.forEach((item) => {
    if (item.selected) {
      const dataEntry = item.data.find(
        (item) => item.condition.id === condition.id
      );
      if (dataEntry) {
        gearNoise.push(dataEntry.trans);
      }
    }
  });
  if (gearNoise.length) {
    return Math.min.apply(null, gearNoise);
  }
};

const sortByFrequency = (): number[] => {
  return noiseData.map((item) => {
    return item.intDur;
  });
};

const sortByTotalNoise = (exclusions: Excluded): number[] => {
  const selectedGroup: number[] = [];
  const nonSelectedGroup: number[] = [];
  noiseData.forEach((item) => {
    if (item.selected) {
      selectedGroup.push(item.intDur);
    }
  });
  selectedGroup.sort((a, b) => {
    const aVal = findTotalNoiseNonExcluded(a, exclusions);
    const bVal = findTotalNoiseNonExcluded(b, exclusions);
    if (aVal && bVal) {
      return aVal - bVal;
    } else {
      return 0;
    }
  });
  noiseData.forEach((item) => {
    if (!item.selected) {
      nonSelectedGroup.push(item.intDur);
    }
  });
  nonSelectedGroup.sort((a, b) => {
    const aVal = findTotalNoiseNonExcluded(a, exclusions);
    const bVal = findTotalNoiseNonExcluded(b, exclusions);
    if (aVal && bVal) {
      return aVal - bVal;
    } else {
      return 0;
    }
  });
  return [...selectedGroup, ...nonSelectedGroup];
};

export const Transcap = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [alert, setAlert] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [columns, setColumns] = useState<number[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [excluded, setExcluded] = useState<Excluded>({});

  const handleSortCheckboxClick = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      sort = "total";
      setColumns(sortByTotalNoise(excluded));
    } else {
      sort = "freq";
      setColumns(sortByFrequency());
    }
  };

  const handleExcludeAllButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const exclusions = { ...excluded };
    Object.keys(exclusions).forEach((item) => {
      exclusions[item] = true;
    });
    setExcluded(exclusions);
    if (sort === "total") {
      setColumns(sortByTotalNoise(exclusions));
    }
  };

  const handleClearExclusionsButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const exclusions = { ...excluded };
    Object.keys(exclusions).forEach((item) => {
      exclusions[item] = false;
    });
    setExcluded(exclusions);
    if (sort === "total") {
      setColumns(sortByTotalNoise(exclusions));
    }
  };

  const handleTestButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    testCommit = "test";
    dialogTitle = testDialogTitle;
    updateSelectedGears(selected, props.numGears);
    setOpenDialog(true);
  };

  const handleCommitButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    testCommit = "commit";
    dialogTitle = commitDialogTitle;
    updateSelectedGears(selected, props.numGears);
    setOpenDialog(true);
  };

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    props.changePage(Page.Abscap);
  };

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    props.changePage(Page.Sweep);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleDialogWriteButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const selections = intDurs.filter((item) => selected[item]);
    const commit = testCommit === "commit";
    try {
      sendSetTransGearsRequest(selections, props.numGears, commit);
    } catch (error) {
      console.error(error);
      if (testCommit === "commit") {
        alertMessage = alertMessageWriteToFlash;
      } else {
        alertMessage = alertMessageWriteToRAM;
      }
      setAlert(true);
    }
    handleDialogClose();
  };

  const handleDialogCancelButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    handleDialogClose();
  };

  const getSelection = (column: number) => {
    return selected[column];
  };

  const updateSelection = (column: number) => {
    const index = noiseData.findIndex((item) => {
      return item.intDur === column;
    });
    if (
      !noiseData[index].selected &&
      Object.values(selected).filter((item) => item === true).length >=
        props.numGears
    ) {
      return;
    }
    noiseData[index].selected = !noiseData[index].selected;
    setSelected({ ...selected, [column]: !selected[column] });
    if (sort === "total") {
      setColumns(sortByTotalNoise(excluded));
    }
  };

  const getExclusion = (condition: NoiseCondition) => {
    return excluded[condition.id];
  };

  const updateExclusion = (condition: NoiseCondition) => {
    const exclusions = { ...excluded };
    exclusions[condition.id] = !exclusions[condition.id];
    setExcluded(exclusions);
    if (sort === "total") {
      setColumns(sortByTotalNoise(exclusions));
    }
  };

  const generateSelectButtons = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    columns.forEach((item) => {
      output.push(
        <TableCell key={item}>
          <ToggleButton
            value={item}
            selected={getSelection(item)}
            onChange={() => {
              updateSelection(item);
            }}
            sx={{ width: "20px", height: "20px" }}
          >
            {getSelection(item) ? (
              <CheckIcon sx={{ width: "20px", height: "20px" }} />
            ) : null}
          </ToggleButton>
        </TableCell>
      );
    });
    return output;
  };

  const generateIntegrationDurations = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    columns.forEach((item) => {
      output.push(<TableCell key={item}>{item}</TableCell>);
    });
    return output;
  };

  const generateFrequencies = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    columns.forEach((item) => {
      output.push(<TableCell key={item}>{frequencies[item]}</TableCell>);
    });
    return output;
  };

  const generateMaxNoises = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    columns.forEach((item) => {
      output.push(<TableCell key={item}>{findMaxNoise(item)}</TableCell>);
    });
    return output;
  };

  const generateMaxNoisesNonExcluded = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    columns.forEach((item) => {
      output.push(
        <TableCell key={item}>
          {findMaxNoiseNonExcluded(item, excluded)}
        </TableCell>
      );
    });
    return output;
  };

  const generateEmptyCells = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    columns.forEach((item) => {
      output.push(<TableCell key={item}></TableCell>);
    });
    return output;
  };

  const generateTotalNoisesNonExcluded = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    columns.forEach((item) => {
      output.push(
        <TableCell key={item}>
          {findTotalNoiseNonExcluded(item, excluded)}
        </TableCell>
      );
    });
    return output;
  };

  const createConditionData = (condition: NoiseCondition): any => {
    const data = columns.map((col) => {
      const dataSet = noiseData.find((item) => item.intDur === col);
      const dataEntry = dataSet!.data.find(
        (item: NoiseDataEntry) => item.condition.id === condition.id
      );
      return dataEntry!.trans;
    });
    return {
      data,
      minNoise: Math.min.apply(null, data)
    };
  };

  const generateConditionRows = (): JSX.Element[] => {
    const output: JSX.Element[] = [];
    conditions.forEach((item: NoiseCondition) => {
      const conditionData = createConditionData(item);
      output.push(
        <TableRow key={item.id}>
          <TableCell>
            <ToggleButton
              value={item.name}
              selected={getExclusion(item)}
              onChange={() => {
                updateExclusion(item);
              }}
              sx={{ width: "20px", height: "20px" }}
            >
              {getExclusion(item) ? (
                <ClearIcon sx={{ width: "20px", height: "20px" }} />
              ) : null}
            </ToggleButton>
          </TableCell>
          <TableCell>{conditionData.minNoise}</TableCell>
          <TableCell sx={{ fontWeight: "bold" }}>
            {findMinGearNoise(item)}
          </TableCell>
          <TableCell component="th">{item.name}</TableCell>
          {conditionData.data.map((item: number, index: number) => {
            return <TableCell key={index}>{item}</TableCell>;
          })}
        </TableRow>
      );
    });
    return output;
  };

  useEffect(() => {
    noiseData = props.noiseData.map((item: NoiseDataSet) =>
      Object.assign({}, item)
    );
    intDurs = noiseData.map((item) => {
      return item.intDur;
    });
    setColumns(intDurs);
    const selected: Selected = {};
    intDurs.forEach((item) => {
      let freq =
        1000 / (((ISTRETCH + item + RESET + SAMPLE + OVERHEAD) / CLOCK) * 2);
      freq = Math.floor(freq * 10) / 10;
      frequencies[item] = freq;
      selected[item] = false;
    });
    setSelected(selected);
    conditions = noiseData[0].data.map((item) => {
      return item.condition;
    });
    const excluded: Excluded = {};
    conditions.forEach((item) => {
      excluded[item.id] = false;
    });
    setExcluded(excluded);
    setInitialized(true);
  }, [props.noiseData]);

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
              Transcap Table
            </Typography>
            <TableContainer
              component={Paper}
              elevation={7}
              sx={{
                marginTop: "8px",
                overflowX: "auto"
              }}
            >
              <div className="jp-webds-gear-selection-table">
                <Table padding="none" sx={{ tableLayout: "fixed" }}>
                  <TableBody>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell component="th">Select</TableCell>
                      {generateSelectButtons()}
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell component="th">Integration Duration</TableCell>
                      {generateIntegrationDurations()}
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <>
                        {sort === "freq" ? (
                          <TableCell
                            component="th"
                            sx={{ backgroundColor: "grey.200" }}
                          >
                            Frequency (kHz)
                          </TableCell>
                        ) : (
                          <TableCell component="th">Frequency (kHz)</TableCell>
                        )}
                      </>
                      {generateFrequencies()}
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell component="th">Overall Max Noise</TableCell>
                      {generateMaxNoises()}
                    </TableRow>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell component="th">
                        Max Noise (non-excluded)
                      </TableCell>
                      {generateMaxNoisesNonExcluded()}
                    </TableRow>
                    <TableRow
                      sx={{ borderBottom: "2px solid rgba(180, 180, 180, 1)" }}
                    >
                      <TableCell>Exclude</TableCell>
                      <TableCell>Min Noise</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Min Gear Noise
                      </TableCell>
                      <TableCell component="th">Test Condition</TableCell>
                      {generateEmptyCells()}
                    </TableRow>
                    {generateConditionRows()}
                    <TableRow
                      sx={{ borderTop: "2px solid rgba(180, 180, 180, 1)" }}
                    >
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <>
                        {sort === "total" ? (
                          <TableCell
                            component="th"
                            sx={{ backgroundColor: "grey.200" }}
                          >
                            Total Noise (non-excluded)
                          </TableCell>
                        ) : (
                          <TableCell component="th">
                            Total Noise (non-excluded)
                          </TableCell>
                        )}
                      </>
                      {generateTotalNoisesNonExcluded()}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TableContainer>
            <div
              style={{
                marginTop: "16px",
                position: "relative",
                display: "flex",
                justifyContent: "center"
              }}
            >
              <Stack spacing={1} sx={{ position: "absolute", left: "0px" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={(event) => handleExcludeAllButtonClick(event)}
                  sx={{
                    minWidth: "150px",
                    maxWidth: "150px",
                    textTransform: "none"
                  }}
                >
                  Exclude All
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={(event) => handleClearExclusionsButtonClick(event)}
                  sx={{
                    minWidth: "150px",
                    maxWidth: "150px",
                    textTransform: "none"
                  }}
                >
                  Clear Exclusions
                </Button>
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={(event) => handleSortCheckboxClick(event)}
                      sx={{ width: "24px", height: "24px" }}
                    />
                  }
                  label="&nbsp;Sort by Total Noise"
                />
              </Stack>
              <Stack spacing={1} sx={{ position: "absolute", right: "0px" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={(event) => handleTestButtonClick(event)}
                  sx={{
                    minWidth: "150px",
                    maxWidth: "150px",
                    textTransform: "none"
                  }}
                >
                  Test
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={(event) => handleCommitButtonClick(event)}
                  sx={{
                    minWidth: "150px",
                    maxWidth: "150px",
                    textTransform: "none"
                  }}
                >
                  Commit
                </Button>
              </Stack>
              <Stack spacing={2} direction="row">
                <Button
                  variant="contained"
                  onClick={(event) => handleBackButtonClick(event)}
                  sx={{
                    width: "100px",
                    textTransform: "none"
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={(event) => handleNextButtonClick(event)}
                  sx={{
                    width: "100px",
                    textTransform: "none"
                  }}
                >
                  Next
                </Button>
              </Stack>
            </div>
          </Box>
          <Dialog open={openDialog} onClose={handleDialogClose}>
            <DialogTitle sx={{ textAlign: "center" }}>
              {dialogTitle}
            </DialogTitle>
            <DialogContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Gear</TableCell>
                    <TableCell align="right">Frequency&nbsp;(kHz)</TableCell>
                    <TableCell align="right">Int-Dur</TableCell>
                    <TableCell align="right">Rstretch</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedGears.map((item) => (
                    <TableRow key={item.gear}>
                      <TableCell align="center">{item.gear}</TableCell>
                      <TableCell align="center">{item.frequency}</TableCell>
                      <TableCell align="center">{item.intDur}</TableCell>
                      <TableCell align="center">{item.rstretch}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                disabled={!selectedGears[0] || !selectedGears[0].frequency}
                onClick={(event) => handleDialogWriteButtonClick(event)}
                sx={{ width: "100px" }}
              >
                Write
              </Button>
              <Button
                variant="contained"
                onClick={(event) => handleDialogCancelButtonClick(event)}
                sx={{ width: "100px" }}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
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
