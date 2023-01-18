import React, { useEffect, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { WIDTH } from './constants';
import { NoiseCondition, Page } from './GearSelectionComponent';
import { Canvas } from './mui_extensions/Canvas';
import { Content } from './mui_extensions/Content';
import { Controls } from './mui_extensions/Controls';

export const Landing = (props: any): JSX.Element => {
  const [initialized, setInitialized] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [intDurMin, setIntDurMin] = useState<number | null>(props.intDurMin);
  const [intDurSteps, setIntDurSteps] = useState<number | null>(
    props.intDurSteps
  );
  const [noiseConditions, setNoiseConditions] = useState<NoiseCondition[]>([]);
  const [noiseConditionEntry, setNoiseConditionEntry] = useState<any>({
    id: null,
    name: 'Noise Condition'
  });
  const [listRightPdding, setListRightPadding] = useState(0);

  const handleAddButtonClick = () => {
    setNoiseConditionEntry({ id: null, name: 'Noise Condition' });
    setOpenDialog(true);
  };

  const handleDeleteButtonClick = (id: string) => {
    const items = noiseConditions.filter((item: any) => item.id !== id);
    setNoiseConditions(items);
  };

  const handleChangePageButtonClick = (page: Page) => {
    props.setIntDurMin(intDurMin);
    props.setIntDurSteps(intDurSteps);
    props.setNoiseConditions(noiseConditions);
    props.changePage(page);
  };

  const handleListItemClick = (id: string, name: string) => {
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

  const handleDialogDoneButtonClick = () => {
    handleDialogDone();
  };

  const handleDialogCancelButtonClick = () => {
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

  const handleIntDurInputChange = (id: string, value: string) => {
    if (value !== '' && isNaN(Number(value))) {
      return;
    }
    if (value === '') {
      if (id === 'intDurMin') {
        setIntDurMin(null);
      } else if (id === 'intDurSteps') setIntDurSteps(null);
      return;
    }
    const num = parseInt(value, 10);
    if (num < 4096) {
      if (id === 'intDurMin') {
        setIntDurMin(num);
      } else if (id === 'intDurSteps') setIntDurSteps(num);
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
              onClick={() => handleDeleteButtonClick(id)}
            >
              <DeleteIcon />
            </IconButton>
          }
        >
          <ListItemButton
            onClick={() => handleListItemClick(id, name)}
            sx={{ marginRight: '16px', padding: '0px 16px' }}
          >
            <ListItemText primary={name} />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  useEffect(() => {
    const button = document.getElementById('addNoiseConditionButton');
    if (button && openDialog === false) {
      button.blur();
    }
  }, [openDialog]);

  useEffect(() => {
    const element = document.getElementById(
      'webds_gear_selection_landing_noise_conditions_list'
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

  return (
    <>
      {initialized ? (
        <>
          <Canvas title="Carme Gear Selection" width={WIDTH}>
            <Content
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Stack justifyContent="center" spacing={10} direction="row">
                <div>
                  <Typography id="minIntDurText">Minimum Int-Dur</Typography>
                  <FormControl
                    variant="outlined"
                    size="small"
                    sx={{ width: '150px' }}
                  >
                    <OutlinedInput
                      id="intDurMin"
                      value={intDurMin}
                      onChange={event =>
                        handleIntDurInputChange(
                          event.target.id,
                          event.target.value
                        )
                      }
                    />
                  </FormControl>
                </div>
                <div>
                  <Typography id="intDurStepsText">Int-Dur Steps</Typography>
                  <FormControl
                    variant="outlined"
                    size="small"
                    sx={{ width: '150px' }}
                  >
                    <OutlinedInput
                      id="intDurSteps"
                      value={intDurSteps}
                      onChange={event =>
                        handleIntDurInputChange(
                          event.target.id,
                          event.target.value
                        )
                      }
                    />
                  </FormControl>
                </div>
              </Stack>
              <Divider
                orientation="horizontal"
                sx={{ width: '100%', marginTop: '24px' }}
              />
              <Typography sx={{ marginTop: '24px' }}>
                Noise Conditions
              </Typography>
              <div
                id="webds_gear_selection_landing_noise_conditions_list"
                style={{
                  width: '75%',
                  marginTop: '16px',
                  paddingRight: listRightPdding,
                  overflow: 'auto'
                }}
              >
                <List>{generateListItems()}</List>
                <Stack justifyContent="center" direction="row">
                  <IconButton
                    id="addNoiseConditionButton"
                    color="primary"
                    onClick={() => handleAddButtonClick()}
                    sx={{ marginTop: '8px' }}
                  >
                    <AddBoxIcon />
                  </IconButton>
                </Stack>
              </div>
            </Content>
            <Controls
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Button
                disabled={
                  intDurMin === null ||
                  intDurSteps == null ||
                  noiseConditions.length === 0
                }
                onClick={() => handleChangePageButtonClick(Page.Sweep)}
                sx={{ width: '150px' }}
              >
                Start
              </Button>
              <Button
                variant="text"
                onClick={() => handleChangePageButtonClick(Page.Advanced)}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: '24px',
                  transform: 'translate(0%, -50%)'
                }}
              >
                <Typography variant="underline">Advanced Settings</Typography>
              </Button>
            </Controls>
          </Canvas>
          <Dialog
            fullWidth
            maxWidth="xs"
            open={openDialog}
            onClose={handleDialogClose}
          >
            <DialogContent>
              <TextField
                fullWidth
                variant="standard"
                label="Name of Noise Condition"
                type="text"
                value={noiseConditionEntry.name}
                onChange={handleTextFieldChange}
                onKeyDown={handleTextFieldKeyDown}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleDialogCancelButtonClick()}
                sx={{ width: '100px' }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDialogDoneButtonClick()}
                sx={{ width: '100px' }}
              >
                Done
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : null}
    </>
  );
};

export default Landing;
