import React, { useEffect, useState } from "react";

import { v4 as uuidv4 } from "uuid";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

import IconButton from "@mui/material/IconButton";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DeleteIcon from "@mui/icons-material/Delete";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";

import Typography from "@mui/material/Typography";

import { NoiseCondition, Page } from "./widget_container";

const LIST_HEIGHT_OFFSET = -2 - 16 * 2 - 64 - 24 - 1 - 24 - 24;

let conditionsListHeight = 0;

export const Landing = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [intDurMin, setIntDurMin] = useState<number>(props.intDurMin);
  const [intDurSteps, setIntDurSteps] = useState<number>(props.intDurSteps);
  const [noiseConditions, setNoiseConditions] = useState<NoiseCondition[]>(
    props.noiseConditions
  );
  const [noiseConditionEntry, setNoiseConditionEntry] = useState<any>({
    id: null,
    name: "Noise Condition"
  });

  const handleAddButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setNoiseConditionEntry({ id: null, name: "Noise Condition" });
    setOpenDialog(true);
  };

  const handleDeleteButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string
  ) => {
    const items = noiseConditions.filter((item: any) => item.id !== id);
    setNoiseConditions(items);
  };

  const handleStartButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    props.setIntDurMin(intDurMin);
    props.setIntDurSteps(intDurSteps);
    props.setNoiseConditions(noiseConditions);
    props.changePage(Page.Sweep);
  };

  const handleAdvancedButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    props.changePage(Page.Advanced);
  };

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    id: string,
    name: string
  ) => {
    setNoiseConditionEntry({ id, name });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleDialogDone = () => {
    const items: any = Array.from(noiseConditions);
    if (noiseConditionEntry.id) {
      const index = items.findIndex((item: any) => {
        return item.id === noiseConditionEntry.id;
      });
      if (index !== -1) {
        items[index].name = noiseConditionEntry.name;
        setNoiseConditions(items);
      }
    } else {
      const item = {
        id: uuidv4(),
        name: noiseConditionEntry.name
      };
      items.push(item);
      setNoiseConditions(items);
    }
    handleDialogClose();
  };

  const handleDialogDoneButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    handleDialogDone();
  };

  const handleDialogCancelButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    handleDialogClose();
  };

  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNoiseConditionEntry({
      ...noiseConditionEntry,
      name: event.target.value
    });
  };

  const handleTextFieldKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.keyCode === 13) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.stopPropagation) {
        event.stopPropagation();
      }
      handleDialogDone();
    }
  };

  const handleMinIntDurInputChange = (value: string) => {
    if (value !== "" && isNaN(Number(value))) {
      return;
    }
    if (value === "") {
      value = "0";
    }
    const num = parseInt(value, 10);
    if (num < 4096) {
      setIntDurMin(num);
    }
  };

  const handleIntDurStepsInputChange = (value: string) => {
    if (value !== "" && isNaN(Number(value))) {
      return;
    }
    if (value === "") {
      value = "0";
    }
    const num = parseInt(value, 10);
    if (num <= 4096) {
      setIntDurSteps(num);
    }
  };

  const generateListItems = (): JSX.Element[] => {
    return noiseConditions?.map(({ id, name }: any, index: number) => {
      return (
        <ListItem
          key={id}
          divider
          secondaryAction={
            <IconButton
              color="error"
              edge="start"
              onClick={(event) => handleDeleteButtonClick(event, id)}
            >
              <DeleteIcon />
            </IconButton>
          }
        >
          <ListItemButton
            onClick={(event) => handleListItemClick(event, id, name)}
            sx={{ marginRight: "15px", padding: "0px 16px" }}
          >
            <ListItemText primary={name} />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  useEffect(() => {
    const button = document.getElementById("addNoiseConditionButton");
    if (button && openDialog === false) {
      button.blur();
    }
  }, [openDialog]);

  useEffect(() => {
    conditionsListHeight = props.height + LIST_HEIGHT_OFFSET;
    setInitialized(true);
  }, [props.height]);

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
              Configuration
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
                <Stack justifyContent="center" spacing={10} direction="row">
                  <div>
                    <Typography id="minIntDurText">Minimum Int-Dur</Typography>
                    <FormControl
                      variant="outlined"
                      size="small"
                      sx={{ width: "150px" }}
                    >
                      <OutlinedInput
                        id="minIntDur"
                        value={intDurMin}
                        onChange={(event) =>
                          handleMinIntDurInputChange(event.target.value)
                        }
                      />
                    </FormControl>
                  </div>
                  <div>
                    <Typography id="intDurStepsText">Int-Dur Steps</Typography>
                    <FormControl
                      variant="outlined"
                      size="small"
                      sx={{ width: "150px" }}
                    >
                      <OutlinedInput
                        id="intDurSteps"
                        value={intDurSteps}
                        onChange={(event) =>
                          handleIntDurStepsInputChange(event.target.value)
                        }
                      />
                    </FormControl>
                  </div>
                </Stack>
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
                    <Stack justifyContent="center" direction="row">
                      <IconButton
                        id="addNoiseConditionButton"
                        color="primary"
                        onClick={(event) => handleAddButtonClick(event)}
                        sx={{ marginTop: "5px" }}
                      >
                        <AddBoxIcon />
                      </IconButton>
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
              {noiseConditions.length ? (
                <Button
                  variant="contained"
                  onClick={(event) => handleStartButtonClick(event)}
                  sx={{ width: "100px" }}
                >
                  Start
                </Button>
              ) : (
                <Button variant="contained" disabled sx={{ width: "100px" }}>
                  Start
                </Button>
              )}
              <Button
                variant="text"
                onClick={(event) => handleAdvancedButtonClick(event)}
                sx={{
                  position: "absolute",
                  top: "5px",
                  right: "20px",
                  textTransform: "none"
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ textDecoration: "underline" }}
                >
                  Advanced Settings
                </Typography>
              </Button>
            </div>
          </Box>
          <Dialog
            fullWidth
            maxWidth="xs"
            open={openDialog}
            onClose={handleDialogClose}
          >
            <DialogContent>
              <TextField
                autoFocus
                fullWidth
                label="Name of Noise Condition"
                value={noiseConditionEntry.name}
                type="text"
                variant="standard"
                InputLabelProps={{
                  shrink: true
                }}
                onChange={handleTextFieldChange}
                onKeyDown={handleTextFieldKeyDown}
              />
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                onClick={(event) => handleDialogDoneButtonClick(event)}
                sx={{ width: "75px" }}
              >
                Done
              </Button>
              <Button
                variant="contained"
                onClick={(event) => handleDialogCancelButtonClick(event)}
                sx={{ width: "75px" }}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : null}
    </>
  );
};
